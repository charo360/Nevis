// MongoDB-based brand context (replaces Firebase brand context)
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
// MongoDB services accessed via API routes only
import type { CompleteBrandProfile } from '@/lib/mongodb/services/brand-profile-service';

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

export function BrandProvider({ children }: BrandProviderProps) {
  const { user } = useAuth();
  const [currentBrand, setCurrentBrand] = useState<CompleteBrandProfile | null>(null);
  const [brands, setBrands] = useState<CompleteBrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands when user changes
  useEffect(() => {
    if (user?.userId) {
      console.log('🔄 User changed, loading brands for:', user.userId);
      loadBrands();
    } else {
      console.log('🚫 No user, clearing brands');
      setBrands([]);
      setCurrentBrand(null);
      setLoading(false);
    }
  }, [user?.userId]);

  // Additional effect to ensure brands load after login
  // This helps with timing issues where auth state updates don't immediately trigger brand loading
  useEffect(() => {
    if (user?.userId && brands.length === 0 && !loading) {
      console.log('🔄 Ensuring brands are loaded after login for:', user.userId);
      loadBrands();
    }
  }, [user?.userId, brands.length, loading]);

  // Load all brands for the current user
  const loadBrands = async () => {
    if (!user?.userId) {
      console.log('🚫 No user ID available for loading brands');
      return;
    }

    try {
      console.log('🔄 Loading brands for user:', user.userId);
      setLoading(true);
      setError(null);

      // Load brands via API route
      const response = await fetch(`/api/brand-profiles?userId=${user.userId}`);
      if (!response.ok) {
        throw new Error('Failed to load brand profiles');
      }
      const userBrands = await response.json();
      console.log('✅ Brands loaded successfully:', userBrands.length, 'brands found');
      console.log('📋 Brand names:', userBrands.map(b => b.businessName || b.name));
      setBrands(userBrands);

      // If no current brand is selected, select the first active one
      if (!currentBrand && userBrands.length > 0) {
        const activeBrand = userBrands.find(b => b.isActive) || userBrands[0];
        console.log('🎯 Auto-selecting brand:', activeBrand.businessName || activeBrand.name);
        setCurrentBrand(activeBrand);
      }
    } catch (err) {
      console.error('❌ Error loading brands:', err);
      setError('Failed to load brand profiles');
    } finally {
      setLoading(false);
      console.log('✅ Brand loading completed');
    }
  };

  // Select a brand as current
  const selectBrand = (brand: CompleteBrandProfile | null) => {
    setCurrentBrand(brand);
  };

  // Save a brand profile
  const saveProfile = async (profile: CompleteBrandProfile): Promise<string> => {
    if (!user?.userId) {
      throw new Error('User not authenticated');
    }

    try {
      setSaving(true);
      setError(null);

      // Ensure userId is set
      const profileWithUserId = {
        ...profile,
        userId: user.userId,
      };

      // Save brand profile via API route
      const response = await fetch('/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileWithUserId),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand profile');
      }

      const result = await response.json();
      const profileId = result.id;

      // Refresh brands list
      await loadBrands();

      return profileId;
    } catch (err) {
      console.error('Error saving profile:', err);
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

      // Update brand profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
        setCurrentBrand(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
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

      // Delete brand profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete brand profile');
      }

      // Update local state
      setBrands(prev => prev.filter(brand => brand.id !== profileId));

      // Clear current brand if it's the one being deleted
      if (currentBrand?.id === profileId) {
        const remainingBrands = brands.filter(brand => brand.id !== profileId);
        setCurrentBrand(remainingBrands.length > 0 ? remainingBrands[0] : null);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError('Failed to delete brand profile');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Refresh brands list
  const refreshBrands = async (): Promise<void> => {
    await loadBrands();
  };

  const value: BrandContextType = {
    currentBrand,
    brands,
    loading,
    saving,
    selectBrand,
    saveProfile,
    updateProfile,
    deleteProfile,
    refreshBrands,
    error,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

// Hook to use the brand context
export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

// Hook to get current brand
export function useCurrentBrand() {
  const { currentBrand } = useBrand();
  return currentBrand;
}

// Hook to get all brands
export function useBrands() {
  const { brands } = useBrand();
  return brands;
}

// Hook to check if user has any brands
export function useHasBrands() {
  const { brands, loading } = useBrand();
  return { hasBrands: brands.length > 0, loading };
}

// Hook for brand operations
export function useBrandOperations() {
  const { saveProfile, updateProfile, deleteProfile, refreshBrands, saving, error } = useBrand();
  return { saveProfile, updateProfile, deleteProfile, refreshBrands, saving, error };
}
