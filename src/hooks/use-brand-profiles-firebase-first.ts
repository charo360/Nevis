// Firebase-first hook for managing brand profiles
import { useState, useEffect, useCallback } from 'react';
import { useUserId } from './use-firebase-auth';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';
import {
  saveBrandProfileFirebaseFirst,
  loadBrandProfileFirebaseFirst,
  getUserBrandProfilesFirebaseFirst,
  deleteBrandProfileFirebaseFirst,
  clearAllCachedProfiles
} from '@/lib/firebase/services/brand-profile-firebase-first';

export interface BrandProfilesState {
  profiles: CompleteBrandProfile[];
  currentProfile: CompleteBrandProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export function useBrandProfilesFirebaseFirst() {
  const userId = useUserId();
  const [state, setState] = useState<BrandProfilesState>({
    profiles: [],
    currentProfile: null,
    loading: true,
    error: null,
    saving: false,
  });

  // Load profiles from Firebase (with cache)
  const loadProfiles = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false, profiles: [], currentProfile: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      console.log('🔄 Loading profiles with Firebase-first approach');

      // Load all profiles
      const profiles = await getUserBrandProfilesFirebaseFirst(userId);
      
      // Get the current/latest profile
      const currentProfile = profiles.length > 0 ? profiles[0] : null;

      setState(prev => ({
        ...prev,
        profiles,
        currentProfile,
        loading: false,
      }));

      console.log(`✅ Loaded ${profiles.length} profiles, current:`, currentProfile?.businessName);
    } catch (error) {
      console.error('❌ Failed to load profiles:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load profiles',
      }));
    }
  }, [userId]);

  // Save profile to Firebase (primary storage)
  const saveProfile = useCallback(async (profile: CompleteBrandProfile): Promise<string> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      console.log('💾 Saving profile with Firebase-first approach:', profile.businessName);
      
      // Save to Firebase first
      const profileId = await saveBrandProfileFirebaseFirst(profile, userId);
      
      // Update local state with the saved profile
      const savedProfile = { ...profile, id: profileId };
      
      setState(prev => ({
        ...prev,
        profiles: [savedProfile, ...prev.profiles.filter(p => p.id !== profileId)],
        currentProfile: savedProfile,
        saving: false,
      }));

      console.log('✅ Profile saved successfully:', profileId);
      return profileId;
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to save profile',
      }));
      throw error;
    }
  }, [userId]);

  // Update existing profile
  const updateProfile = useCallback(async (profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const existingProfile = state.profiles.find(p => p.id === profileId);
    if (!existingProfile) {
      throw new Error('Profile not found');
    }

    const updatedProfile = { ...existingProfile, ...updates };
    await saveProfile(updatedProfile);
  }, [userId, state.profiles, saveProfile]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      console.log('🗑️ Deleting profile:', profileId);
      
      // Delete from Firebase
      await deleteBrandProfileFirebaseFirst(profileId, userId);
      
      // Update local state
      setState(prev => {
        const updatedProfiles = prev.profiles.filter(p => p.id !== profileId);
        const newCurrentProfile = prev.currentProfile?.id === profileId 
          ? (updatedProfiles.length > 0 ? updatedProfiles[0] : null)
          : prev.currentProfile;
        
        return {
          ...prev,
          profiles: updatedProfiles,
          currentProfile: newCurrentProfile,
          saving: false,
        };
      });

      console.log('✅ Profile deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete profile:', error);
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to delete profile',
      }));
      throw error;
    }
  }, [userId]);

  // Set current profile
  const setCurrentProfile = useCallback((profile: CompleteBrandProfile | null) => {
    console.log('🎯 Setting current profile:', profile?.businessName || 'null');
    setState(prev => ({ ...prev, currentProfile: profile }));
  }, []);

  // Get profile by ID
  const getProfileById = useCallback((profileId: string): CompleteBrandProfile | null => {
    return state.profiles.find(p => p.id === profileId) || null;
  }, [state.profiles]);

  // Clear all data (useful for logout)
  const clearAllData = useCallback(() => {
    console.log('🗑️ Clearing all brand profile data');
    clearAllCachedProfiles();
    setState({
      profiles: [],
      currentProfile: null,
      loading: false,
      error: null,
      saving: false,
    });
  }, []);

  // Load profiles when userId changes
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Clear data when user logs out
  useEffect(() => {
    if (!userId) {
      clearAllData();
    }
  }, [userId, clearAllData]);

  return {
    ...state,
    saveProfile,
    updateProfile,
    deleteProfile,
    setCurrentProfile,
    getProfileById,
    reload: loadProfiles,
    clearAllData,
  };
}

// Hook for checking if user has a complete brand profile
export function useHasCompleteBrandProfileFirebaseFirst(): boolean {
  const { currentProfile, loading } = useBrandProfilesFirebaseFirst();

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

// Hook for getting the current brand profile with Firebase-first approach
export function useCurrentBrandProfileFirebaseFirst(): CompleteBrandProfile | null {
  const { currentProfile } = useBrandProfilesFirebaseFirst();
  return currentProfile;
}
