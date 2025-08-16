'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useBrandProfiles } from '@/hooks/use-brand-profiles';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

interface BrandContextType {
  // Current selected brand
  currentBrand: CompleteBrandProfile | null;
  
  // All available brands
  brands: CompleteBrandProfile[];
  
  // Loading states
  loading: boolean;
  saving: boolean;
  
  // Actions
  selectBrand: (brand: CompleteBrandProfile | null) => void;
  createBrand: (brand: CompleteBrandProfile) => Promise<string>;
  updateBrand: (brandId: string, updates: Partial<CompleteBrandProfile>) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;
  refreshBrands: () => Promise<void>;
  
  // Utilities
  hasBrands: boolean;
  brandCount: number;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const {
    profiles: brands,
    currentProfile,
    loading,
    saving,
    saveProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
    reload: refreshBrands,
  } = useBrandProfiles();

  const [currentBrand, setCurrentBrand] = useState<CompleteBrandProfile | null>(null);

  // Sync current brand with the hook's current profile
  useEffect(() => {
    if (currentProfile && currentProfile !== currentBrand) {
      setCurrentBrand(currentProfile);
    } else if (!currentProfile && brands.length > 0 && !currentBrand) {
      // Auto-select first brand if none selected
      setCurrentBrand(brands[0]);
      setCurrentProfile(brands[0]);
    }
  }, [currentProfile, brands, currentBrand, setCurrentProfile]);

  const selectBrand = (brand: CompleteBrandProfile | null) => {
    setCurrentBrand(brand);
    setCurrentProfile(brand);
    
    // Store selected brand ID in localStorage for persistence
    if (brand && 'id' in brand) {
      localStorage.setItem('selectedBrandId', (brand as any).id);
    } else {
      localStorage.removeItem('selectedBrandId');
    }
  };

  const createBrand = async (brand: CompleteBrandProfile): Promise<string> => {
    const brandId = await saveProfile(brand);
    
    // Auto-select the newly created brand
    const savedBrand = brands.find(b => (b as any).id === brandId);
    if (savedBrand) {
      selectBrand(savedBrand);
    }
    
    return brandId;
  };

  const updateBrand = async (brandId: string, updates: Partial<CompleteBrandProfile>) => {
    await updateProfile(brandId, updates);
    
    // Update current brand if it's the one being updated
    if (currentBrand && (currentBrand as any).id === brandId) {
      const updatedBrand = brands.find(b => (b as any).id === brandId);
      if (updatedBrand) {
        setCurrentBrand(updatedBrand);
      }
    }
  };

  const deleteBrand = async (brandId: string) => {
    await deleteProfile(brandId);
    
    // If deleted brand was current, select another one
    if (currentBrand && (currentBrand as any).id === brandId) {
      const remainingBrands = brands.filter(b => (b as any).id !== brandId);
      selectBrand(remainingBrands.length > 0 ? remainingBrands[0] : null);
    }
  };

  // Restore selected brand from localStorage on mount
  useEffect(() => {
    const savedBrandId = localStorage.getItem('selectedBrandId');
    if (savedBrandId && brands.length > 0 && !currentBrand) {
      const savedBrand = brands.find(b => (b as any).id === savedBrandId);
      if (savedBrand) {
        selectBrand(savedBrand);
      }
    }
  }, [brands, currentBrand]);

  const contextValue: BrandContextType = {
    currentBrand,
    brands,
    loading,
    saving,
    selectBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    refreshBrands,
    hasBrands: brands.length > 0,
    brandCount: brands.length,
  };

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandContext() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrandContext must be used within a BrandProvider');
  }
  return context;
}

// Convenience hooks
export function useCurrentBrand() {
  const { currentBrand, loading } = useBrandContext();
  return { brand: currentBrand, loading };
}

export function useBrandActions() {
  const { 
    selectBrand, 
    createBrand, 
    updateBrand, 
    deleteBrand, 
    refreshBrands 
  } = useBrandContext();
  
  return {
    selectBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    refreshBrands,
  };
}
