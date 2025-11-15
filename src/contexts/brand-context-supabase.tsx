// Supabase-based brand context (replaces MongoDB brand context)
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth-supabase';
import { supabaseService } from '@/lib/services/supabase-service';
import type { SupabaseBrandProfile } from '@/lib/services/supabase-service';

interface BrandContextType {
  brands: SupabaseBrandProfile[];
  selectedBrand: SupabaseBrandProfile | null;
  loading: boolean;
  error: string | null;
  selectBrand: (brandId: string) => void;
  refreshBrands: () => Promise<void>;
  saveBrand: (brandData: Partial<SupabaseBrandProfile>, logoFile?: File) => Promise<string | null>;
  deleteBrand: (brandId: string) => Promise<boolean>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

interface BrandProviderProps {
  children: React.ReactNode;
}

export function BrandProvider({ children }: BrandProviderProps) {
  const { user } = useAuth();
  const [brands, setBrands] = useState<SupabaseBrandProfile[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<SupabaseBrandProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands from Supabase via API
  const loadBrands = useCallback(async () => {
    if (!user?.userId) return;

    setLoading(true);
    setError(null);

    try {
      // Get auth token from Supabase
      const { createClient } = await import('@/lib/supabase-client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('❌ No auth session found');
        setError('Authentication required');
        setBrands([]);
        return;
      }

      // Fetch brands from API endpoint
      const response = await fetch('/api/brand-profiles', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load brands: ${response.statusText}`);
      }

      const userBrands: SupabaseBrandProfile[] = await response.json();
      
      console.log('✅ Loaded brands:', userBrands.length);
      setBrands(userBrands);

      // Auto-select the first brand if none is selected
      if (userBrands.length > 0 && !selectedBrand) {
        const firstBrand = userBrands[0];
        setSelectedBrand(firstBrand);
        localStorage.setItem('selectedBrandId', firstBrand.id);
      }
    } catch (err) {
      console.error('❌ Error loading brands:', err);
      setError(err instanceof Error ? err.message : 'Failed to load brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // Load brands when user changes
  useEffect(() => {
    if (user?.userId) {
      loadBrands();
    } else {
      setBrands([]);
      setSelectedBrand(null);
      localStorage.removeItem('selectedBrandId');
    }
  }, [user?.userId, loadBrands]);

  // Restore selected brand from localStorage
  useEffect(() => {
    const savedBrandId = localStorage.getItem('selectedBrandId');
    if (savedBrandId && brands.length > 0) {
      const savedBrand = brands.find(b => b.id === savedBrandId);
      if (savedBrand) {
        setSelectedBrand(savedBrand);
      }
    }
  }, [brands]);

  // Select a brand
  const selectBrand = useCallback((brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
      localStorage.setItem('selectedBrandId', brandId);
    }
  }, [brands]);

  // Refresh brands
  const refreshBrands = useCallback(async () => {
    await loadBrands();
  }, [loadBrands]);

  // Save brand
  const saveBrand = useCallback(async (
    brandData: Partial<SupabaseBrandProfile>, 
    logoFile?: File
  ): Promise<string | null> => {
    if (!user?.userId) return null;

    try {
      setLoading(true);
      setError(null);

      
      // Convert to the format expected by supabaseService
      const brandProfile = {
        businessName: brandData.business_name,
        businessType: brandData.business_type,
        location: brandData.location,
        websiteUrl: brandData.website_url,
        description: brandData.description,
        targetAudience: brandData.target_audience,
        services: brandData.services,
        logoUrl: brandData.logo_url,
        brandColors: brandData.brand_colors,
        contactInfo: brandData.contact_info,
        socialHandles: brandData.social_handles,
        websiteAnalysis: brandData.website_analysis,
        brandVoice: brandData.brand_voice
      };

      const savedBrand = await supabaseService.saveBrandProfile(
        user.userId,
        brandProfile,
        logoFile
      );

      if (savedBrand) {
        await refreshBrands();
        return savedBrand.id;
      }

      return null;
    } catch (err) {
      console.error('❌ Error saving brand:', err);
      setError(err instanceof Error ? err.message : 'Failed to save brand');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.userId, refreshBrands]);

  // Delete brand
  const deleteBrand = useCallback(async (brandId: string): Promise<boolean> => {
    if (!user?.userId) return false;

    try {
      setLoading(true);
      setError(null);

      const success = await supabaseService.deleteBrandProfile(brandId);

      if (success) {
        
        // If the deleted brand was selected, clear selection
        if (selectedBrand?.id === brandId) {
          setSelectedBrand(null);
          localStorage.removeItem('selectedBrandId');
        }
        
        await refreshBrands();
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ Error deleting brand:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete brand');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.userId, selectedBrand?.id, refreshBrands]);

  const value: BrandContextType = {
    brands,
    selectedBrand,
    loading,
    error,
    selectBrand,
    refreshBrands,
    saveBrand,
    deleteBrand,
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

// Hook to get the selected brand
export function useSelectedBrand() {
  const { selectedBrand } = useBrand();
  return selectedBrand;
}

// Hook to get the selected brand ID
export function useSelectedBrandId() {
  const { selectedBrand } = useBrand();
  return selectedBrand?.id || null;
}
