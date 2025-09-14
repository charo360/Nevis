'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
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
        console.log('🔄 Immediately restoring brand from localStorage on init:', {
          businessName: parsed.businessName || parsed.name,
          hasLogoUrl: !!parsed.logoUrl,
          hasLogoDataUrl: !!parsed.logoDataUrl
        });
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
    console.log('🔍 Brand context: User effect triggered', {
      userId: user?.userId,
      userExists: !!user,
      brandsCount: brands.length,
      loading,
      hasAttemptedLoad
    });

    if (user?.userId) {
      console.log('🔄 User authenticated, loading brands for:', user.userId);
      setHasAttemptedLoad(false);
      loadBrands();
    } else {
      console.log('🚫 No user, clearing brands');
      setBrands([]);
      setCurrentBrand(null);
      setLoading(false);
      setHasAttemptedLoad(false);
    }
  }, [user?.userId]);

  // Additional effect to ensure brands load after login with a slight delay
  useEffect(() => {
    if (user?.userId && brands.length === 0 && !loading && !hasAttemptedLoad) {
      console.log('🔄 Backup brand loading triggered for:', user.userId);
      const timer = setTimeout(() => {
        console.log('⏰ Executing delayed brand loading...');
        loadBrands();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [user?.userId, brands.length, loading, hasAttemptedLoad]);

  // Load all brands for the current user (using Supabase via API)
  const loadBrands = async () => {
    if (!user?.userId) {
      console.log('🚫 No user ID available for loading brands');
      return;
    }

    try {
      console.log('🔄 Loading brands from Supabase for user:', user.userId);
      setLoading(true);
      setError(null);
      setHasAttemptedLoad(true);

      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Load brands via API route (which now uses Supabase)
      const response = await fetch('/api/brand-profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load brand profiles');
      }
      
      const userBrands = await response.json();
      console.log('✅ Brands loaded successfully from Supabase:', userBrands.length, 'brands found');
      console.log('📋 Brand names:', userBrands.map(b => b.businessName || b.name));
      setBrands(userBrands);

      // Sync current brand with loaded brands
      if (currentBrand && userBrands.length > 0) {
        const freshBrand = userBrands.find(b => b.id === currentBrand.id);
        if (freshBrand && (freshBrand.logoUrl !== currentBrand.logoUrl || freshBrand.logoDataUrl !== currentBrand.logoDataUrl)) {
          console.log('🔄 Updating current brand with fresh logo data from Supabase:', {
            businessName: freshBrand.businessName || freshBrand.name,
            oldLogoUrl: currentBrand.logoUrl,
            newLogoUrl: freshBrand.logoUrl,
            oldLogoDataUrl: !!currentBrand.logoDataUrl,
            newLogoDataUrl: !!freshBrand.logoDataUrl
          });
          
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
        console.log('🔍 No current brand selected, attempting restoration from localStorage');
        
        // Try to restore from localStorage first
        let restoredBrand: CompleteBrandProfile | null = null;
        
        try {
          const savedBrandId = localStorage.getItem('selectedBrandId');
          if (savedBrandId) {
            restoredBrand = userBrands.find(b => b.id === savedBrandId) || null;
            console.log('🔄 Found saved brand ID, attempting to restore:', savedBrandId);
          }
        } catch (error) {
          console.error('Error restoring from localStorage:', error);
        }
        
        // If restoration failed, auto-select the first active brand
        const brandToSelect = restoredBrand || userBrands.find(b => b.isActive) || userBrands[0];
        
        console.log('🎯 Selecting brand:', {
          restored: !!restoredBrand,
          businessName: brandToSelect.businessName || brandToSelect.name,
          brandId: brandToSelect.id
        });
        
        setCurrentBrand(brandToSelect);
        updateAllBrandScopedServices(brandToSelect);
      }
    } catch (err) {
      console.error('❌ Error loading brands from Supabase:', err);
      setError('Failed to load brand profiles');
    } finally {
      setLoading(false);
      console.log('✅ Brand loading completed');
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

    console.log('🎯 Selecting brand:', brandName);

    // Update state
    setCurrentBrand(brand);

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

  // Enhanced brand persistence - save both ID and full data
  useEffect(() => {
    if (currentBrand?.id) {
      localStorage.setItem('selectedBrandId', currentBrand.id);
      // Also save the full brand data for immediate restoration
      // Store both logoUrl and logoDataUrl to handle both scenarios
      localStorage.setItem('currentBrandData', JSON.stringify({
        id: currentBrand.id,
        businessName: currentBrand.businessName,
        name: currentBrand.name,
        primaryColor: currentBrand.primaryColor,
        accentColor: currentBrand.accentColor,
        backgroundColor: currentBrand.backgroundColor,
        logoUrl: currentBrand.logoUrl, // Supabase storage URL
        logoDataUrl: currentBrand.logoDataUrl, // Base64 data URL
        // Store essential data for immediate UI restoration
        businessType: currentBrand.businessType,
        location: currentBrand.location,
        description: currentBrand.description
      }));
    } else {
      localStorage.removeItem('selectedBrandId');
      localStorage.removeItem('currentBrandData');
    }
  }, [currentBrand]);

  // Save a brand profile (using Supabase via API)
  const saveProfile = async (profile: CompleteBrandProfile): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setSaving(true);
      setError(null);

      const token = getAccessToken();
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

      const token = getAccessToken();
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

      const token = getAccessToken();
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
  }, [currentBrand]);

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