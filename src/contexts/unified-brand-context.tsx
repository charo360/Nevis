'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useBrandProfilesFirebaseFirst } from '@/hooks/use-brand-profiles-firebase-first';
import { brandScopedArtifactsService } from '@/lib/services/brand-scoped-artifacts-service';
import { BrandScopedStorage, STORAGE_FEATURES, migrateAllGlobalStorage } from '@/lib/services/brand-scoped-storage';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

interface UnifiedBrandContextType {
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

  // Brand-scoped storage helpers
  getBrandStorage: (feature: string) => BrandScopedStorage | null;
  clearBrandData: (brandId: string) => void;
  migrateBrandData: (brandId: string) => void;

  // Error handling
  error: string | null;
}

const UnifiedBrandContext = createContext<UnifiedBrandContextType | undefined>(undefined);

interface UnifiedBrandProviderProps {
  children: React.ReactNode;
}

export function UnifiedBrandProvider({ children }: UnifiedBrandProviderProps) {
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
  const [brandScopedServices, setBrandScopedServices] = useState<Map<string, any>>(new Map());

  // Use refs to store current values for event handlers
  const currentBrandRef = useRef<CompleteBrandProfile | null>(null);
  const setCurrentProfileRef = useRef(setCurrentProfile);
  const updateAllBrandScopedServicesRef = useRef<(brand: CompleteBrandProfile | null) => void>();

  // Update refs when values change
  useEffect(() => {
    currentBrandRef.current = currentBrand;
  }, [currentBrand]);

  useEffect(() => {
    setCurrentProfileRef.current = setCurrentProfile;
  }, [setCurrentProfile]);

  // Sync current brand with the hook's current profile
  useEffect(() => {
    console.log('🔄 Unified brand sync effect triggered:', {
      currentProfile: currentProfile?.businessName || currentProfile?.name,
      currentBrand: currentBrand?.businessName || currentBrand?.name,
      brandsCount: brands.length
    });

    // Only sync if currentProfile exists and is different from currentBrand
    if (currentProfile && currentProfile !== currentBrand) {
      console.log('✅ Syncing currentBrand with currentProfile:', currentProfile.businessName || currentProfile.name);
      setCurrentBrand(currentProfile);
      updateAllBrandScopedServices(currentProfile);
    } else if (!currentProfile && !currentBrand && brands.length > 0) {
      // Auto-select first brand only if no brand is selected at all and brands exist
      // This should only happen on initial load, not during navigation
      const savedBrandId = localStorage.getItem('selectedBrandId');
      let brandToSelect = brands[0]; // Default to first brand

      // Try to restore previously selected brand
      if (savedBrandId) {
        const savedBrand = brands.find(b => b.id === savedBrandId);
        if (savedBrand) {
          brandToSelect = savedBrand;
          console.log('🔄 Restoring previously selected brand:', brandToSelect.businessName || brandToSelect.name);
        }
      }

      if (!currentBrand) { // Only select if no brand is currently selected
        console.log('🎯 Auto-selecting brand for initial load:', brandToSelect.businessName || brandToSelect.name);
        setCurrentBrand(brandToSelect);
        setCurrentProfile(brandToSelect);
        updateAllBrandScopedServices(brandToSelect);
      }
    }
  }, [currentProfile, brands.length]); // Removed currentBrand and setCurrentProfile to prevent infinite loop

  // Update all brand-scoped services when brand changes
  const updateAllBrandScopedServices = useCallback((brand: CompleteBrandProfile | null) => {
    const brandId = brand?.id || null;
    const brandName = brand?.businessName || brand?.name || 'none';

    console.log('🔄 Updating ALL brand-scoped services for brand:', brandName, 'ID:', brandId);

    try {
      // Update artifacts service
      brandScopedArtifactsService.setBrand(brandId);
      console.log('✅ Updated artifacts service for brand:', brandName);

      // TODO: Update other brand-scoped services here
      // - Social media service
      // - Content calendar service
      // - Creative studio service
      // - Quick content service
      // - etc.

      // Store the current brand ID for other services to use
      if (brandId) {
        localStorage.setItem('currentBrandId', brandId);
        localStorage.setItem('currentBrandName', brandName);
      } else {
        localStorage.removeItem('currentBrandId');
        localStorage.removeItem('currentBrandName');
      }

      console.log('✅ All brand-scoped services updated successfully');
    } catch (error) {
      console.error('❌ Failed to update brand-scoped services:', error);
    }
  }, []);

  // Update the ref when the function changes
  useEffect(() => {
    updateAllBrandScopedServicesRef.current = updateAllBrandScopedServices;
  }, [updateAllBrandScopedServices]);

  const selectBrand = useCallback((brand: CompleteBrandProfile | null) => {
    const brandName = brand?.businessName || brand?.name || 'null';
    console.log('🎯 Unified selectBrand called with:', brandName);
    console.log('📊 Current state before selection:', {
      currentBrand: currentBrand?.businessName || currentBrand?.name,
      currentProfile: currentProfile?.businessName || currentProfile?.name
    });

    // Log color information for debugging
    if (brand) {
      console.log('🎨 Selecting brand with colors:', {
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor
      });
    }

    // Update both states immediately
    setCurrentBrand(brand);
    setCurrentProfile(brand);

    // Update all brand-scoped services
    updateAllBrandScopedServices(brand);

    // Force update color persistence immediately
    if (brand) {
      const colorData = {
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        brandId: brand.id,
        brandName: brand.businessName || brand.name,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('brandColors', JSON.stringify(colorData));
      console.log('💾 Force updated color persistence:', colorData);
    }

    // Trigger a custom event for other components to listen to
    const event = new CustomEvent('brandChanged', {
      detail: {
        brand,
        brandId: brand?.id || null,
        brandName: brandName
      }
    });
    window.dispatchEvent(event);

    console.log('✅ Unified brand selection completed, new brand:', brandName);
  }, [currentBrand, currentProfile, setCurrentProfile, updateAllBrandScopedServices]);

  // localStorage restoration is now handled in the main sync effect above

  // Enhanced brand persistence - save both ID and full data
  useEffect(() => {
    if (currentBrand?.id) {
      localStorage.setItem('selectedBrandId', currentBrand.id);
      // Also save the full brand data for immediate restoration
      localStorage.setItem('currentBrandData', JSON.stringify({
        id: currentBrand.id,
        businessName: currentBrand.businessName,
        name: currentBrand.name,
        primaryColor: currentBrand.primaryColor,
        accentColor: currentBrand.accentColor,
        backgroundColor: currentBrand.backgroundColor,
        logoDataUrl: currentBrand.logoDataUrl,
        // Store essential data for immediate UI restoration
        businessType: currentBrand.businessType,
        location: currentBrand.location,
        description: currentBrand.description
      }));
      console.log('💾 Saved brand data to localStorage for persistence:', currentBrand.businessName || currentBrand.name);
    } else {
      localStorage.removeItem('selectedBrandId');
      localStorage.removeItem('currentBrandData');
      console.log('🗑️ Cleared brand data from localStorage');
    }
  }, [currentBrand]);

  // Helper function to get brand-scoped storage for any feature
  const getBrandStorage = useCallback((feature: string): BrandScopedStorage | null => {
    if (!currentBrand?.id) {
      console.warn(`Cannot create brand-scoped storage for ${feature}: no brand selected`);
      return null;
    }

    return new BrandScopedStorage({ brandId: currentBrand.id, feature });
  }, [currentBrand]);

  // Helper function to clear all data for a specific brand
  const clearBrandData = useCallback((brandId: string) => {
    console.log('🗑️ Clearing all data for brand:', brandId);
    BrandScopedStorage.clearBrandData(brandId);
  }, []);

  // Helper function to migrate global data to brand-scoped storage
  const migrateBrandData = useCallback((brandId: string) => {
    console.log('🔄 Migrating global data to brand-scoped for brand:', brandId);
    const features = Object.values(STORAGE_FEATURES);
    migrateAllGlobalStorage(brandId, features);
  }, []);

  // Listen for brand changes from other contexts (backward compatibility)
  useEffect(() => {
    const handleBrandChange = (event: any) => {
      if (event.detail && event.detail.brand) {
        const brand = event.detail.brand;
        const brandName = brand.businessName || brand.name;
        console.log('🔄 Unified context received brand change event from other context:', brandName);

        // Only update if it's different from current brand
        const currentBrandValue = currentBrandRef.current;
        if (!currentBrandValue || currentBrandValue.id !== brand.id) {
          console.log('🔄 Updating unified context with new brand:', brandName);
          setCurrentBrand(brand);
          setCurrentProfileRef.current(brand);
          if (updateAllBrandScopedServicesRef.current) {
            updateAllBrandScopedServicesRef.current(brand);
          }
        } else {
          console.log('🔄 Brand already current in unified context:', brandName);
        }
      }
    };

    // Listen for the original brand context changes
    const handleOriginalBrandChange = (event: any) => {
      console.log('🔄 Unified context received original brand change event:', event.detail);
      if (event.detail && event.detail.brand) {
        handleBrandChange(event);
      }
    };

    window.addEventListener('brandChanged', handleBrandChange);
    window.addEventListener('originalBrandChanged', handleOriginalBrandChange);

    return () => {
      window.removeEventListener('brandChanged', handleBrandChange);
      window.removeEventListener('originalBrandChanged', handleOriginalBrandChange);
    };
  }, []); // Empty dependencies to prevent re-registering listeners

  const contextValue: UnifiedBrandContextType = {
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
    getBrandStorage,
    clearBrandData,
    migrateBrandData,
  };

  return (
    <UnifiedBrandContext.Provider value={contextValue}>
      {children}
    </UnifiedBrandContext.Provider>
  );
}

export function useUnifiedBrand() {
  const context = useContext(UnifiedBrandContext);
  if (context === undefined) {
    throw new Error('useUnifiedBrand must be used within a UnifiedBrandProvider');
  }
  return context;
}

// Convenience hooks
export function useCurrentBrand(): CompleteBrandProfile | null {
  const { currentBrand } = useUnifiedBrand();
  return currentBrand;
}

export function useBrands(): CompleteBrandProfile[] {
  const { brands } = useUnifiedBrand();
  return brands;
}

export function useBrandActions() {
  const { selectBrand, saveProfile, updateProfile, deleteProfile, refreshBrands } = useUnifiedBrand();
  return { selectBrand, saveProfile, updateProfile, deleteProfile, refreshBrands };
}

export function useBrandStorage(feature: string): BrandScopedStorage | null {
  const { getBrandStorage } = useUnifiedBrand();
  return getBrandStorage(feature);
}

// Hook to listen for brand changes
export function useBrandChangeListener(callback: (brand: CompleteBrandProfile | null) => void) {
  const { currentBrand } = useUnifiedBrand();
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Call callback when brand changes (no callback in dependencies to prevent infinite loop)
  useEffect(() => {
    callbackRef.current(currentBrand);
  }, [currentBrand]);

  // Listen for brand change events (no callback in dependencies)
  useEffect(() => {
    const handleBrandChange = (event: any) => {
      if (event.detail && event.detail.brand) {
        callbackRef.current(event.detail.brand);
      }
    };

    window.addEventListener('brandChanged', handleBrandChange);
    return () => window.removeEventListener('brandChanged', handleBrandChange);
  }, []); // Empty dependencies to prevent re-registration
}
