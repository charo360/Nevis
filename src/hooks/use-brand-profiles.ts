// Hook for managing brand profiles with MongoDB
import { useState, useEffect, useCallback } from 'react';
// MongoDB services accessed via API routes only
import { useAuth } from '@/hooks/use-auth-supabase';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

export interface BrandProfilesState {
  profiles: CompleteBrandProfile[];
  currentProfile: CompleteBrandProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export function useBrandProfiles() {
  const { user, getAccessToken } = useAuth();
  const userId = user?.userId;
  const [state, setState] = useState<BrandProfilesState>({
    profiles: [],
    currentProfile: null,
    loading: true,
    error: null,
    saving: false,
  });

  // Load brand profiles
  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false, profiles: [], currentProfile: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load from MongoDB
      let profiles: CompleteBrandProfile[] = [];
      try {
        // Get authentication token
        const token = await getAccessToken();
        if (!token) {
          console.warn('⚠️ No authentication token found, cannot load profiles');
          profiles = [];
        } else {
          console.log('🔍 Loading brand profiles from Supabase via API...');

          // Use API route to load profiles with authentication
          const response = await fetch(`/api/brand-profiles?userId=${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            profiles = await response.json();
            console.log('✅ Loaded', profiles.length, 'brand profiles from MongoDB');
          } else {
            console.error('❌ Failed to load profiles:', response.status);
            profiles = [];
          }
        }
      } catch (apiError) {
        console.error('❌ API error loading profiles:', apiError);
        // Fallback to localStorage if API fails
        const stored = localStorage.getItem('completeBrandProfile');
        if (stored) {
          const profile = JSON.parse(stored);
          profiles = [profile];
          console.log('📦 Loaded 1 profile from localStorage fallback');
        }
      }

      const currentProfile = profiles.length > 0 ? profiles[0] : null;

      setState(prev => ({
        ...prev,
        profiles,
        currentProfile,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profiles',
      }));
    }
  }, [userId]);

  // Save brand profile
  const saveProfile = useCallback(async (profile: CompleteBrandProfile): Promise<string> => {
    if (!userId) {
      throw new Error('User must be authenticated to save profile');
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      // Get authentication token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('💾 Saving brand profile to MongoDB via API...');

      // Save profile via API route with authentication
      const response = await fetch('/api/brand-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...profile, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to save brand profile:', response.status, errorData);
        throw new Error(errorData.error || `Failed to save profile (${response.status})`);
      }

      const result = await response.json();
      const profileId = result.id;

      console.log('✅ Brand profile saved successfully:', profileId);

      // Reload profiles to get the updated list
      await loadProfiles();

      setState(prev => ({ ...prev, saving: false }));
      return profileId;
    } catch (error) {
      console.error('❌ Error saving brand profile:', error);
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      }));
      throw error;
    }
  }, [userId, loadProfiles]);

  // Update brand profile
  const updateProfile = useCallback(async (
    profileId: string,
    updates: Partial<CompleteBrandProfile>
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));

      // Get authentication token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('🔄 Updating brand profile via API:', profileId);

      // Update profile via API route with authentication
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to update brand profile:', response.status, errorData);
        throw new Error(errorData.error || `Failed to update profile (${response.status})`);
      }

      console.log('✅ Brand profile updated successfully');

      // Update local state optimistically
      setState(prev => ({
        ...prev,
        profiles: prev.profiles.map(p =>
          p.id === profileId ? { ...p, ...updates } : p
        ),
        currentProfile: prev.currentProfile?.id === profileId
          ? { ...prev.currentProfile, ...updates }
          : prev.currentProfile,
        saving: false,
      }));
    } catch (error) {
      console.error('❌ Error updating brand profile:', error);
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      }));
      throw error;
    }
  }, [userId]);

  // Delete brand profile
  const deleteProfile = useCallback(async (profileId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User must be authenticated to delete profile');
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      // Delete profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        profiles: prev.profiles.filter(p => p.id !== profileId),
        currentProfile: prev.currentProfile?.id === profileId ? null : prev.currentProfile,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete profile',
      }));
      throw error;
    }
  }, [userId]);

  // Set current profile
  const setCurrentProfile = useCallback((profile: CompleteBrandProfile | null) => {
    setState(prev => {
      return { ...prev, currentProfile: profile };
    });
  }, []);

  // Get profile by ID
  const getProfileById = useCallback(async (profileId: string): Promise<CompleteBrandProfile | null> => {
    try {
      // Get profile via API route
      const response = await fetch(`/api/brand-profiles/${profileId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Load profiles when userId changes
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Note: Real-time updates removed for MongoDB migration
  // Profiles will be refreshed when operations are performed

  return {
    ...state,
    saveProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
    getProfileById,
    reload: loadProfiles,
  };
}

// Hook for getting the current/latest brand profile
export function useCurrentBrandProfile() {
  const { currentProfile, loading, error } = useBrandProfiles();

  return {
    profile: currentProfile,
    loading,
    error,
  };
}

// Hook for checking if user has a complete brand profile
export function useHasCompleteBrandProfile(): boolean {
  const { currentProfile, loading } = useBrandProfiles();

  if (loading || !currentProfile) return false;

  // Check if profile has required fields
  const requiredFields = [
    'businessName',
    'businessType',
    'location',
    'description',
    'services',
  ];

  return requiredFields.every(field => {
    const value = currentProfile[field as keyof CompleteBrandProfile];
    return value && (
      typeof value === 'string' ? value.trim().length > 0 :
        Array.isArray(value) ? value.length > 0 :
          true
    );
  });
}
