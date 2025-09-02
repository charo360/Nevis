'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBrandProfilesFirebaseFirst } from '@/hooks/use-brand-profiles-firebase-first';
import { brandScopedArtifactsService } from '@/lib/services/brand-scoped-artifacts-service';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

interface BrandContextType {
  // Current brand state
  currentBrand: CompleteBrandProfile | null;

  // All brands
  brands: CompleteBrandProfile[];

  // Loading states
  loading: boolean;
  saving: boolean;

  // Actions
  selectBrand: (brand: CompleteBrandProfile | null) => void;
  saveProfile: (profile: CompleteBrandProfile) => Promise<string>;
  updateProfile: (profileId: string, updates: Partial<CompleteBrandProfile>) => Promise<void>;
  deleteProfile: (profileId: string) => Promise<void>;
  refreshBrands: () => Promise<void>;

  // Error handling
  error: string | null;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: React.ReactNode;
}

export function BrandProviderFirebaseFirst({ children }: BrandProviderProps) {
  const {
    profiles: brands,
    currentProfile,
    loading,
    saving,
    error,
    saveProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
    reload: refreshBrands,
  } = useBrandProfilesFirebaseFirst();

  const [currentBrand, setCurrentBrand] = useState<CompleteBrandProfile | null>(null);

  // Sync current brand with the hook's current profile
  useEffect(() => {

    // Only sync if currentProfile exists and is different from currentBrand
    if (currentProfile && currentProfile !== currentBrand) {
      setCurrentBrand(currentProfile);
    } else if (!currentProfile && brands.length > 0 && !currentBrand) {
      // Auto-select first brand if none selected
      const firstBrand = brands[0];
      setCurrentBrand(firstBrand);
      setCurrentProfile(firstBrand);
    }
  }, [currentProfile, brands.length, currentBrand, setCurrentProfile]);

  const selectBrand = (brand: CompleteBrandProfile | null) => {
    // Update both states immediately
    setCurrentBrand(brand);
    setCurrentProfile(brand);

    // Update all brand-scoped services
    const brandId = brand?.id || null;

    // Update artifacts service
    brandScopedArtifactsService.setBrand(brandId);

    // TODO: Update other brand-scoped services here
    // - Social media service
    // - Content calendar service
    // - Creative studio service
    // - etc.

  };

  // Restore selected brand from localStorage on mount (for UX continuity)
  useEffect(() => {
    const savedBrandId = localStorage.getItem('selectedBrandId');
    if (savedBrandId && brands.length > 0 && !currentBrand) {
      const savedBrand = brands.find(b => b.id === savedBrandId);
      if (savedBrand) {
        selectBrand(savedBrand);
      }
    }
  }, [brands, currentBrand]);

  // Save selected brand ID to localStorage for UX continuity
  useEffect(() => {
    if (currentBrand?.id) {
      localStorage.setItem('selectedBrandId', currentBrand.id);
    } else {
      localStorage.removeItem('selectedBrandId');
    }
  }, [currentBrand]);

  const contextValue: BrandContextType = {
    currentBrand,
    brands,
    loading,
    saving,
    error,
    selectBrand,
    saveProfile,
    updateProfile,
    deleteProfile,
    refreshBrands,
  };

  return (
    <BrandContext.Provider value={contextValue}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrandFirebaseFirst() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrandFirebaseFirst must be used within a BrandProviderFirebaseFirst');
  }
  return context;
}

// Convenience hooks
export function useCurrentBrandFirebaseFirst(): CompleteBrandProfile | null {
  const { currentBrand } = useBrandFirebaseFirst();
  return currentBrand;
}

export function useBrandsFirebaseFirst(): CompleteBrandProfile[] {
  const { brands } = useBrandFirebaseFirst();
  return brands;
}

export function useBrandActionsFirebaseFirst() {
  const { selectBrand, saveProfile, updateProfile, deleteProfile, refreshBrands } = useBrandFirebaseFirst();
  return { selectBrand, saveProfile, updateProfile, deleteProfile, refreshBrands };
}
