// Hook for enhanced brand state persistence across page navigation
import { useEffect, useCallback } from 'react';
import { useUnifiedBrand } from '@/contexts/unified-brand-context';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

export interface BrandPersistenceOptions {
  autoRestore?: boolean;
  persistColors?: boolean;
  persistFullData?: boolean;
}

export function useBrandPersistence(options: BrandPersistenceOptions = {}) {
  const {
    autoRestore = true,
    persistColors = true,
    persistFullData = true
  } = options;

  const { currentBrand, selectBrand, brands } = useUnifiedBrand();

  // Enhanced brand restoration from localStorage
  const restoreBrandFromStorage = useCallback((): CompleteBrandProfile | null => {
    try {
      // Try to restore from full brand data first
      if (persistFullData) {
        const savedBrandData = localStorage.getItem('currentBrandData');
        if (savedBrandData) {
          const parsedData = JSON.parse(savedBrandData);
          console.log('🔄 Attempting to restore brand from full data:', parsedData.businessName || parsedData.name);
          
          // Find matching brand in current brands list
          const matchingBrand = brands.find(b => b.id === parsedData.id);
          if (matchingBrand) {
            console.log('✅ Found matching brand in brands list, using fresh data');
            return matchingBrand;
          } else {
            console.log('⚠️ No matching brand found, using saved data as fallback');
            return parsedData as CompleteBrandProfile;
          }
        }
      }

      // Fallback to brand ID restoration
      const savedBrandId = localStorage.getItem('selectedBrandId');
      if (savedBrandId && brands.length > 0) {
        const savedBrand = brands.find(b => b.id === savedBrandId);
        if (savedBrand) {
          console.log('🔄 Restored brand from ID:', savedBrand.businessName || savedBrand.name);
          return savedBrand;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to restore brand from storage:', error);
      return null;
    }
  }, [brands, persistFullData]);

  // Force brand restoration (useful for manual recovery)
  const forceBrandRestore = useCallback(() => {
    const restoredBrand = restoreBrandFromStorage();
    if (restoredBrand && (!currentBrand || currentBrand.id !== restoredBrand.id)) {
      console.log('🔧 Force restoring brand:', restoredBrand.businessName || restoredBrand.name);
      selectBrand(restoredBrand);
      return true;
    }
    return false;
  }, [restoreBrandFromStorage, currentBrand, selectBrand]);

  // Auto-restore brand on mount or when brands list changes
  useEffect(() => {
    if (!autoRestore) return;

    // Only restore if no current brand is selected and brands are available
    if (!currentBrand && brands.length > 0) {
      const restoredBrand = restoreBrandFromStorage();
      if (restoredBrand) {
        console.log('🔄 Auto-restoring brand on mount:', restoredBrand.businessName || restoredBrand.name);
        selectBrand(restoredBrand);
      }
    }
  }, [autoRestore, currentBrand, brands, restoreBrandFromStorage, selectBrand]);

  // Enhanced brand data persistence
  const persistBrandData = useCallback((brand: CompleteBrandProfile | null) => {
    if (!brand) {
      localStorage.removeItem('selectedBrandId');
      localStorage.removeItem('currentBrandData');
      if (persistColors) {
        localStorage.removeItem('brandColors');
      }
      return;
    }

    // Always persist brand ID
    localStorage.setItem('selectedBrandId', brand.id);

    // Persist full brand data if enabled
    if (persistFullData) {
      const brandData = {
        id: brand.id,
        businessName: brand.businessName,
        name: brand.name,
        businessType: brand.businessType,
        location: brand.location,
        description: brand.description,
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        logoUrl: brand.logoUrl, // Supabase storage URL
        logoDataUrl: brand.logoDataUrl, // Base64 data URL
        services: brand.services,
        // Add timestamp for cache invalidation
        persistedAt: new Date().toISOString()
      };
      localStorage.setItem('currentBrandData', JSON.stringify(brandData));
    }

    // Persist colors separately for quick access
    if (persistColors) {
      const colorData = {
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        brandId: brand.id,
        brandName: brand.businessName || brand.name
      };
      localStorage.setItem('brandColors', JSON.stringify(colorData));
    }

    console.log('💾 Enhanced brand persistence completed for:', brand.businessName || brand.name);
  }, [persistFullData, persistColors]);

  // Listen for brand changes and persist automatically
  useEffect(() => {
    persistBrandData(currentBrand);
  }, [currentBrand, persistBrandData]);

  // Get persisted brand colors (useful for immediate UI updates)
  const getPersistedColors = useCallback(() => {
    if (!persistColors) return null;

    try {
      const savedColors = localStorage.getItem('brandColors');
      if (savedColors) {
        return JSON.parse(savedColors);
      }
    } catch (error) {
      console.error('Failed to get persisted colors:', error);
    }
    return null;
  }, [persistColors]);

  // Clear all persisted brand data
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem('selectedBrandId');
    localStorage.removeItem('currentBrandData');
    localStorage.removeItem('brandColors');
    console.log('🗑️ Cleared all persisted brand data');
  }, []);

  return {
    // State
    currentBrand,
    isRestored: !!currentBrand,
    
    // Actions
    forceBrandRestore,
    persistBrandData,
    clearPersistedData,
    getPersistedColors,
    
    // Utilities
    restoreBrandFromStorage
  };
}

// Hook for immediate brand color restoration (useful for preventing flash of wrong colors)
export function useBrandColorPersistence() {
  const getColors = useCallback(() => {
    try {
      const savedColors = localStorage.getItem('brandColors');
      if (savedColors) {
        const colors = JSON.parse(savedColors);
        return {
          primaryColor: colors.primaryColor || '#3b82f6',
          accentColor: colors.accentColor || '#10b981',
          backgroundColor: colors.backgroundColor || '#f8fafc'
        };
      }
    } catch (error) {
      console.error('Failed to get persisted colors:', error);
    }
    
    // Return default colors
    return {
      primaryColor: '#3b82f6',
      accentColor: '#10b981',
      backgroundColor: '#f8fafc'
    };
  }, []);

  return { getColors };
}
