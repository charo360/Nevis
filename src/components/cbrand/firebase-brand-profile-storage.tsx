// Firebase-based brand profile storage
import { CompleteBrandProfile } from './cbrand-wizard';
import { brandProfileFirebaseService } from '@/lib/firebase/services/brand-profile-service';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export interface SavedBrandProfile extends CompleteBrandProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

// Get current user ID
function getCurrentUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user?.uid || null);
    });
  });
}

// Save brand profile to Firestore
export async function saveBrandProfile(profile: CompleteBrandProfile): Promise<SavedBrandProfile> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return saveBrandProfileToLocalStorage(profile);
  }

  try {
    const profileId = await brandProfileFirebaseService.saveBrandProfile(profile, userId);
    const savedProfile = await brandProfileFirebaseService.getBrandProfileById(profileId);

    if (!savedProfile) {
      throw new Error('Failed to retrieve saved profile');
    }

    return savedProfile;
  } catch (error) {
    return saveBrandProfileToLocalStorage(profile);
  }
}

// Load brand profile from Firestore
export async function loadBrandProfile(): Promise<SavedBrandProfile | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return loadBrandProfileFromLocalStorage();
  }

  try {
    const profile = await brandProfileFirebaseService.getLatestCompleteBrandProfile(userId);
    return profile;
  } catch (error) {
    return loadBrandProfileFromLocalStorage();
  }
}

// Get all saved profiles from Firestore
export async function getSavedProfiles(): Promise<SavedBrandProfile[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return getSavedProfilesFromLocalStorage();
  }

  try {
    const profiles = await brandProfileFirebaseService.getUserBrandProfiles(userId);
    return profiles;
  } catch (error) {
    return getSavedProfilesFromLocalStorage();
  }
}

// Delete a saved profile from Firestore
export async function deleteBrandProfile(id: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return deleteBrandProfileFromLocalStorage(id);
  }

  try {
    await brandProfileFirebaseService.delete(id);
  } catch (error) {
    deleteBrandProfileFromLocalStorage(id);
  }
}

// Update brand profile in Firestore
export async function updateBrandProfile(
  id: string,
  updates: Partial<CompleteBrandProfile>
): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('User must be authenticated to update profile');
  }

  try {
    await brandProfileFirebaseService.updateBrandProfile(id, updates);
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// FALLBACK LOCALSTORAGE FUNCTIONS (for backward compatibility)
// ============================================================================

const CBRAND_PROFILE_KEY = 'completeBrandProfile';
const CBRAND_PROFILES_KEY = 'completeBrandProfiles';

function saveBrandProfileToLocalStorage(profile: CompleteBrandProfile): SavedBrandProfile {
  const now = new Date().toISOString();

  const savedProfile: SavedBrandProfile = {
    ...profile,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    version: '1.0',
  };

  try {
    localStorage.setItem(CBRAND_PROFILE_KEY, JSON.stringify(savedProfile));

    const existingProfiles = getSavedProfilesFromLocalStorage();
    const updatedProfiles = [savedProfile, ...existingProfiles.filter(p => p.id !== savedProfile.id)];
    localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(updatedProfiles));

    return savedProfile;
  } catch (error) {

    const profileWithoutDesigns = {
      ...savedProfile,
      designExamples: [],
    };

    localStorage.setItem(CBRAND_PROFILE_KEY, JSON.stringify(profileWithoutDesigns));

    const existingProfiles = getSavedProfilesFromLocalStorage();
    const updatedProfiles = [profileWithoutDesigns, ...existingProfiles.filter(p => p.id !== profileWithoutDesigns.id)];
    localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(updatedProfiles));

    throw new Error('Profile saved but design examples were removed due to storage limitations.');
  }
}

function loadBrandProfileFromLocalStorage(): SavedBrandProfile | null {
  try {
    const stored = localStorage.getItem(CBRAND_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function getSavedProfilesFromLocalStorage(): SavedBrandProfile[] {
  try {
    const stored = localStorage.getItem(CBRAND_PROFILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function deleteBrandProfileFromLocalStorage(id: string): void {
  const profiles = getSavedProfilesFromLocalStorage().filter(p => p.id !== id);
  localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(profiles));

  const current = loadBrandProfileFromLocalStorage();
  if (current?.id === id) {
    localStorage.removeItem(CBRAND_PROFILE_KEY);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Convert complete brand profile to legacy format for compatibility
export function convertToLegacyProfile(profile: CompleteBrandProfile): any {
  return {
    businessName: profile.businessName,
    businessType: profile.businessType,
    location: profile.location,
    description: profile.description,
    services: profile.services,
    websiteUrl: profile.websiteUrl,
    logoDataUrl: profile.logoDataUrl,
    designExamples: profile.designExamples,
    visualStyle: profile.visualStyle,
    writingTone: profile.writingTone,
    contentThemes: profile.contentThemes,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor,
    backgroundColor: profile.backgroundColor,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    contactAddress: profile.contactAddress,
    targetAudience: profile.targetAudience,
    keyFeatures: profile.keyFeatures,
    competitiveAdvantages: profile.competitiveAdvantages,
    socialMedia: {
      facebook: profile.facebookUrl,
      instagram: profile.instagramUrl,
      twitter: profile.twitterUrl,
      linkedin: profile.linkedinUrl,
    },
  };
}

// Auto-save functionality with Firestore
export function setupAutoSave(
  profile: CompleteBrandProfile,
  onSave?: (saved: SavedBrandProfile) => void
): () => void {
  const saveInterval = setInterval(async () => {
    if (profile.businessName || profile.description || profile.websiteUrl) {
      try {
        const saved = await saveBrandProfile(profile);
        onSave?.(saved);
      } catch (error) {
      }
    }
  }, 30000); // Auto-save every 30 seconds

  return () => clearInterval(saveInterval);
}

// Export profile data
export function exportBrandProfile(profile: SavedBrandProfile): string {
  const exportData = {
    ...profile,
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0',
  };
  return JSON.stringify(exportData, null, 2);
}

// Import profile data
export async function importBrandProfile(jsonData: string): Promise<SavedBrandProfile> {
  try {
    const data = JSON.parse(jsonData);
    const now = new Date().toISOString();

    const importedProfile: CompleteBrandProfile = {
      ...data,
      // Remove ID fields as they will be regenerated
    };

    return await saveBrandProfile(importedProfile);
  } catch (error) {
    throw new Error('Invalid profile data format');
  }
}

// Check if profile is complete
export function isProfileComplete(profile: CompleteBrandProfile): boolean {
  const requiredFields = [
    'businessName',
    'businessType',
    'location',
    'description',
    'services'
    // Temporarily removed 'logoDataUrl' to test logo persistence
  ];

  return requiredFields.every(field => {
    const value = profile[field as keyof CompleteBrandProfile];
    return value && typeof value === 'string' && value.trim().length > 0;
  });
}

// Get profile completion percentage
export function getCompletionPercentage(profile: CompleteBrandProfile): number {
  const allFields = [
    'businessName', 'businessType', 'location', 'description', 'services',
    'targetAudience', 'keyFeatures', 'competitiveAdvantages',
    'contactPhone', 'contactEmail', 'contactAddress',
    'visualStyle', 'writingTone', 'contentThemes',
    'primaryColor', 'accentColor', 'backgroundColor',
    'facebookUrl', 'instagramUrl', 'twitterUrl', 'linkedinUrl',
    'websiteUrl', 'logoDataUrl'
  ];

  const completedFields = allFields.filter(field => {
    const value = profile[field as keyof CompleteBrandProfile];
    return value && typeof value === 'string' && value.trim().length > 0;
  });

  return Math.round((completedFields.length / allFields.length) * 100);
}
