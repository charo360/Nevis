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
      currentProfile: currentProfile?.businessName || (currentProfile as any)?.name,
      currentBrand: currentBrand?.businessName,
      brandsCount: brands.length
    });

    // Only sync if currentProfile exists and is different from currentBrand
    // Don't override manual selections
    if (currentProfile && currentProfile !== currentBrand) {
      const normalizedProfile = normalizeBrand(currentProfile);
      setCurrentBrand(normalizedProfile);
    } else if (!currentProfile && brands.length > 0 && !currentBrand) {
      const firstBrand = normalizeBrand(brands[0]);
      // Auto-select first brand if none selected
      setCurrentBrand(firstBrand);
      setCurrentProfile(firstBrand);
    }
  }, [currentProfile, brands.length]); // Removed currentBrand and setCurrentProfile from dependencies to prevent loops

  // Helper function to normalize brand data structure
  const normalizeBrand = (brand: any): CompleteBrandProfile | null => {
    if (!brand) return null;

    // If brand has 'name' but not 'businessName', map it
    if (brand.name && !brand.businessName) {
      return {
        ...brand,
        businessName: brand.name
      };
    }

    return brand;
  };

  const selectBrand = (brand: CompleteBrandProfile | null) => {
      currentBrand: currentBrand?.businessName,
      currentProfile: currentProfile?.businessName
    });

    // Normalize the brand data structure
    const normalizedBrand = normalizeBrand(brand);

    // Force immediate update of both states
    setCurrentBrand(normalizedBrand);
    setCurrentProfile(normalizedBrand);

    // Force a re-render by updating the state in the next tick
    setTimeout(() => {
      setCurrentBrand(normalizedBrand);
    }, 0);


    // Store selected brand ID in localStorage for persistence
    if (normalizedBrand && 'id' in normalizedBrand) {
      localStorage.setItem('selectedBrandId', (normalizedBrand as any).id);
    } else {
      localStorage.removeItem('selectedBrandId');
    }

    // Emit event for unified brand context to listen to
    const event = new CustomEvent('originalBrandChanged', {
      detail: {
        brand: normalizedBrand,
        brandId: normalizedBrand?.id || null,
        brandName: normalizedBrand?.businessName || (normalizedBrand as any)?.name || 'null'
      }
    });
    window.dispatchEvent(event);
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
