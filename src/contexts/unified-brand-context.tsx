'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';
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
  const { user, getAccessToken } = useAuth();

  // Initialize currentBrand from localStorage immediately to prevent flash of missing logo
  const [currentBrand, setCurrentBrand] = useState<CompleteBrandProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedBrandData = localStorage.getItem('currentBrandData');
      if (savedBrandData) {
        const parsed = JSON.parse(savedBrandData);
        return parsed as CompleteBrandProfile;
      }
    } catch (error) {
      console.error('Failed to restore brand from localStorage on init:', error);
    }
    return null;
  });

  const [brands, setBrands] = useState<CompleteBrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Use refs to store current values for event handlers
  const currentBrandRef = useRef<CompleteBrandProfile | null>(null);

  // Update refs when values change
  useEffect(() => {
    currentBrandRef.current = currentBrand;
  }, [currentBrand]);

  // Load brands when user changes
  useEffect(() => {

    if (user?.userId) {
      setHasAttemptedLoad(false);
      // Add a small delay to ensure Supabase session is fully ready
      setTimeout(() => {
        loadBrands();
      }, 1000);
    } else {
      setBrands([]);
      setCurrentBrand(null);
      setLoading(false);
      setHasAttemptedLoad(false);
    }
  }, [user?.userId]);

  // Additional effect to ensure brands load after login with a longer delay to allow auth to settle
  useEffect(() => {
    if (user?.userId && brands.length === 0 && !loading && !hasAttemptedLoad) {
      const timer = setTimeout(() => {
        loadBrands();
      }, 2000); // Increased delay to 2 seconds to allow auth to properly settle

      return () => clearTimeout(timer);
    }
  }, [user?.userId, brands.length, loading, hasAttemptedLoad]);

  // Load all brands for the current user (using Supabase via API)
  const loadBrands = async () => {
    if (!user?.userId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setHasAttemptedLoad(true);

      const token = await getAccessToken();
      if (!token) {
        // Don't set error, just try the request without token - Supabase RLS will handle authentication
      }

      // Load brands via API route (which now uses Supabase)
      const response = await fetch('/api/brand-profiles', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        // Check if it's a network/auth issue and try fallback
        if (response.status === 401 || response.status === 0) {
          console.warn('⚠️ Network/Auth issue detected, trying fallback approach...');

          // Try to load from localStorage as fallback
          const fallbackBrand = localStorage.getItem('completeBrandProfile');
          if (fallbackBrand) {
            try {
              const parsedBrand = JSON.parse(fallbackBrand);
              setBrands([parsedBrand]);
              setCurrentBrand(parsedBrand);
              setLoading(false);
              return;
            } catch (parseError) {
              console.error('❌ Failed to parse fallback brand:', parseError);
            }
          }

          // If no fallback available, set error state but don't throw
          console.warn('⚠️ No fallback brand available, setting error state');
          setError('Authentication in progress. Brand data will load shortly...');
          setLoading(false);
          return;
        }
        console.error('❌ Failed to load brand profiles, status:', response.status);
        setError('Failed to load brand data. Please try refreshing the page.');
        setLoading(false);
        return;
      }

      const userBrands = await response.json();
      setBrands(userBrands);

      // Sync current brand with loaded brands
      if (currentBrand && userBrands.length > 0) {
        const freshBrand = userBrands.find(b => b.id === currentBrand.id);
        if (freshBrand && (freshBrand.logoUrl !== currentBrand.logoUrl || freshBrand.logoDataUrl !== currentBrand.logoDataUrl)) {

          const updatedBrand = {
            ...currentBrand,
            ...freshBrand,
            // Ensure we keep both logo formats if available
            logoUrl: freshBrand.logoUrl || currentBrand.logoUrl,
            logoDataUrl: freshBrand.logoDataUrl || currentBrand.logoDataUrl,
          };

          setCurrentBrand(updatedBrand);
          updateAllBrandScopedServices(updatedBrand);
        }
      }

      // If no current brand is selected, try to restore from localStorage or select the first active one
      if (!currentBrand && userBrands.length > 0) {

        // Try to restore from localStorage first
        let restoredBrand: CompleteBrandProfile | null = null;

        try {
          const savedBrandId = localStorage.getItem('selectedBrandId');
          if (savedBrandId) {
            restoredBrand = userBrands.find(b => b.id === savedBrandId) || null;
          }
        } catch (error) {
          console.error('Error restoring from localStorage:', error);
        }

        // If restoration failed, try to restore from full brand data
        if (!restoredBrand) {
          try {
            const savedBrandData = localStorage.getItem('currentBrandData');
            if (savedBrandData) {
              const parsedData = JSON.parse(savedBrandData);
              restoredBrand = userBrands.find(b => b.id === parsedData.id) || null;
            }
          } catch (error) {
            console.error('Error restoring from full brand data:', error);
          }
        }

        // If restoration still failed, select the first active brand or first brand
        const brandToSelect = restoredBrand || userBrands.find(b => b.isActive) || userBrands[0];

        setCurrentBrand(brandToSelect);
        updateAllBrandScopedServices(brandToSelect);
      }
    } catch (err) {
      console.error('❌ Error loading brands from Supabase:', err);

      // Provide more specific error messages
      const errorMessage = err instanceof Error ? err.message : 'Failed to load brand profiles';
      if (errorMessage.includes('Network connectivity')) {
        setError('Network connectivity issue. Please check your internet connection and try refreshing the page.');
      } else if (errorMessage.includes('fetch failed') || errorMessage.includes('timeout')) {
        setError('Connection timeout. Please check your internet connection and try again.');
      } else {
        setError('Failed to load brand profiles. Please try refreshing the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update all brand-scoped services when brand changes
  const updateAllBrandScopedServices = useCallback((brand: CompleteBrandProfile | null) => {
    const brandId = brand?.id || null;
    const brandName = brand?.businessName || brand?.name || 'none';

    try {
      // Update artifacts service
      brandScopedArtifactsService.setBrand(brandId);

      // Store the current brand ID for other services to use
      if (brandId) {
        localStorage.setItem('currentBrandId', brandId);
        localStorage.setItem('currentBrandName', brandName);
      } else {
        localStorage.removeItem('currentBrandId');
        localStorage.removeItem('currentBrandName');
      }
    } catch (error) {
      console.error('Error updating brand-scoped services:', error);
    }
  }, []);

  // Select a brand as current
  const selectBrand = useCallback((brand: CompleteBrandProfile | null) => {
    const brandName = brand?.businessName || brand?.name || 'null';

    // Update state
    setCurrentBrand(brand);

    // Update all brand-scoped services
    updateAllBrandScopedServices(brand);

    // Enhanced brand persistence - save both ID and full data immediately
    if (brand) {
      // Save brand ID for quick restoration
      localStorage.setItem('selectedBrandId', brand.id);

      // Save full brand data for complete restoration
      const brandData = {
        id: brand.id,
        businessName: brand.businessName,
        name: brand.name,
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        logoUrl: brand.logoUrl,
        logoDataUrl: brand.logoDataUrl,
        businessType: brand.businessType,
        location: brand.location,
        description: brand.description,
        services: brand.services,
        selectedAt: new Date().toISOString()
      };
      localStorage.setItem('currentBrandData', JSON.stringify(brandData));

      // Save colors separately for quick access
      const colorData = {
        primaryColor: brand.primaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        brandId: brand.id,
        brandName: brand.businessName || brand.name,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('brandColors', JSON.stringify(colorData));

    } else {
      // Clear localStorage when no brand is selected
      localStorage.removeItem('selectedBrandId');
      localStorage.removeItem('currentBrandData');
      localStorage.removeItem('brandColors');
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
  }, [updateAllBrandScopedServices]);

  // Note: Brand persistence is now handled directly in selectBrand function
  // to ensure immediate saving when brand is selected

  // Save a brand profile (using Supabase via API)
  const saveProfile = async (profile: CompleteBrandProfile): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setSaving(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Save brand profile via API route (which now uses Supabase)
      const response = await fetch('/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand profile');
      }

      const result = await response.json();
      const profileId = result.id;

      // Refresh brands list
      setHasAttemptedLoad(false);
      await loadBrands();

      return profileId;
    } catch (err) {
      console.error('Error saving profile to Supabase:', err);
      setError('Failed to save brand profile');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Update a brand profile
  const updateProfile = async (profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> => {
    try {
      setSaving(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Update brand profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update brand profile');
      }

      // Update local state
      setBrands(prev => prev.map(brand =>
        brand.id === profileId ? { ...brand, ...updates } : brand
      ));

      // Update current brand if it's the one being updated
      if (currentBrand?.id === profileId) {
        const updatedBrand = { ...currentBrand, ...updates };
        setCurrentBrand(updatedBrand);
      }
    } catch (err) {
      console.error('Error updating profile in Supabase:', err);
      setError('Failed to update brand profile');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Delete a brand profile
  const deleteProfile = async (profileId: string): Promise<void> => {
    try {
      setSaving(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Delete brand profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete brand profile');
      }

      // Update local state
      setBrands(prev => prev.filter(brand => brand.id !== profileId));

      // Clear current brand if it's the one being deleted
      if (currentBrand?.id === profileId) {
        const remainingBrands = brands.filter(brand => brand.id !== profileId);
        selectBrand(remainingBrands.length > 0 ? remainingBrands[0] : null);
      }
    } catch (err) {
      console.error('Error deleting profile from Supabase:', err);
      setError('Failed to delete brand profile');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Refresh brands list
  const refreshBrands = async (): Promise<void> => {
    setHasAttemptedLoad(false);
    await loadBrands();
  };

  // Helper function to get brand-scoped storage for any feature
  const getBrandStorage = useCallback((feature: string): BrandScopedStorage | null => {
    if (!currentBrand?.id) {
      return null;
    }

    return new BrandScopedStorage({ brandId: currentBrand.id, feature });
  }, [currentBrand?.id]); // Only depend on ID to prevent stale storage instances

  // Helper function to clear all data for a specific brand
  const clearBrandData = useCallback((brandId: string) => {
    BrandScopedStorage.clearBrandData(brandId);
  }, []);

  // Helper function to migrate global data to brand-scoped storage
  const migrateBrandData = useCallback((brandId: string) => {
    const features = Object.values(STORAGE_FEATURES);
    migrateAllGlobalStorage(brandId, features);
  }, []);

  // Listen for brand changes from other contexts (backward compatibility)
  useEffect(() => {
    const handleBrandChange = (event: any) => {
      if (event.detail && event.detail.brand) {
        const brand = event.detail.brand;

        // Only update if it's different from current brand
        const currentBrandValue = currentBrandRef.current;
        if (!currentBrandValue || currentBrandValue.id !== brand.id) {
          setCurrentBrand(brand);
          updateAllBrandScopedServices(brand);
        }
      }
    };

    window.addEventListener('brandChanged', handleBrandChange);
    window.addEventListener('originalBrandChanged', handleBrandChange);

    return () => {
      window.removeEventListener('brandChanged', handleBrandChange);
      window.removeEventListener('originalBrandChanged', handleBrandChange);
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