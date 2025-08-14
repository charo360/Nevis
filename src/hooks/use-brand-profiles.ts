// Hook for managing brand profiles with Firestore
import { useState, useEffect, useCallback } from 'react';
import { brandProfileFirebaseService } from '@/lib/firebase/services/brand-profile-service';
import { useUserId } from './use-firebase-auth';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

export interface BrandProfilesState {
  profiles: CompleteBrandProfile[];
  currentProfile: CompleteBrandProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export function useBrandProfiles() {
  const userId = useUserId();
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

      // Try to load from Firestore, fallback to localStorage
      let profiles: CompleteBrandProfile[] = [];
      try {
        profiles = await brandProfileFirebaseService.getUserBrandProfiles(userId);
      } catch (firebaseError) {
        console.log('🔄 Firebase unavailable, using localStorage fallback');
        // Fallback to localStorage
        const stored = localStorage.getItem('completeBrandProfile');
        if (stored) {
          const profile = JSON.parse(stored);
          profiles = [profile];
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

      const profileId = await brandProfileFirebaseService.saveBrandProfile(profile, userId);

      // Reload profiles to get the updated list
      await loadProfiles();

      setState(prev => ({ ...prev, saving: false }));
      return profileId;
    } catch (error) {
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

      await brandProfileFirebaseService.updateBrandProfile(profileId, updates);

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

      await brandProfileFirebaseService.delete(profileId);

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
    setState(prev => ({ ...prev, currentProfile: profile }));
  }, []);

  // Get profile by ID
  const getProfileById = useCallback(async (profileId: string): Promise<CompleteBrandProfile | null> => {
    try {
      return await brandProfileFirebaseService.getBrandProfileById(profileId);
    } catch (error) {
      console.error('Failed to get profile by ID:', error);
      return null;
    }
  }, []);

  // Load profiles when userId changes
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Set up real-time listener
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = brandProfileFirebaseService.onUserDocumentsChange(
      userId,
      (profiles) => {
        setState(prev => ({
          ...prev,
          profiles,
          currentProfile: profiles.length > 0 && !prev.currentProfile
            ? profiles[0]
            : prev.currentProfile,
        }));
      },
      { orderBy: 'updatedAt', orderDirection: 'desc' }
    );

    return unsubscribe;
  }, [userId]);

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
