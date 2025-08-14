import { CompleteBrandProfile } from './cbrand-wizard';
import { brandProfileFirebaseService } from '@/lib/firebase/services/brand-profile-service';
import { auth } from '@/lib/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';

const CBRAND_PROFILE_KEY = 'completeBrandProfile';
const CBRAND_PROFILES_KEY = 'completeBrandProfiles';

export interface SavedBrandProfile extends CompleteBrandProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  version: string;
}

// Compress design examples to reduce storage size
function compressDesignExamples(designExamples: string[]): string[] {
  return designExamples.map(dataUri => {
    try {
      // Extract the base64 part
      const base64Data = dataUri.split(',')[1];
      if (!base64Data) return dataUri;

      // For storage optimization, we'll keep only the first 3 design examples
      // and compress them by reducing quality
      return dataUri; // For now, keep original - we'll implement compression if needed
    } catch (error) {
      console.warn('Failed to compress design example:', error);
      return dataUri;
    }
  }).slice(0, 3); // Limit to 3 design examples to prevent storage overflow
}

// Save current brand profile with storage optimization
export function saveBrandProfile(profile: CompleteBrandProfile): SavedBrandProfile {
  const now = new Date().toISOString();

  // Optimize profile for storage
  const optimizedProfile = {
    ...profile,
    // Compress design examples to prevent storage overflow
    designExamples: profile.designExamples ? compressDesignExamples(profile.designExamples) : [],
  };

  const savedProfile: SavedBrandProfile = {
    ...optimizedProfile,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    version: '1.0',
  };

  try {
    // Save as current profile
    localStorage.setItem(CBRAND_PROFILE_KEY, JSON.stringify(savedProfile));

    // Also save to profiles list for future reference
    const existingProfiles = getSavedProfiles();
    const updatedProfiles = [savedProfile, ...existingProfiles.filter(p => p.id !== savedProfile.id)];
    localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(updatedProfiles));

    return savedProfile;
  } catch (error) {
    // If storage fails due to size, try saving without design examples
    console.warn('Storage failed with design examples, saving without them:', error);

    const profileWithoutDesigns = {
      ...savedProfile,
      designExamples: [],
    };

    localStorage.setItem(CBRAND_PROFILE_KEY, JSON.stringify(profileWithoutDesigns));

    const existingProfiles = getSavedProfiles();
    const updatedProfiles = [profileWithoutDesigns, ...existingProfiles.filter(p => p.id !== profileWithoutDesigns.id)];
    localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(updatedProfiles));

    throw new Error('Profile saved but design examples were removed due to storage limitations. Please use fewer or smaller design images.');
  }
}

// Load current brand profile
export function loadBrandProfile(): SavedBrandProfile | null {
  try {
    const stored = localStorage.getItem(CBRAND_PROFILE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load brand profile:', error);
    return null;
  }
}

// Get all saved profiles
export function getSavedProfiles(): SavedBrandProfile[] {
  try {
    const stored = localStorage.getItem(CBRAND_PROFILES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load saved profiles:', error);
    return [];
  }
}

// Delete a saved profile
export function deleteBrandProfile(id: string): void {
  const profiles = getSavedProfiles().filter(p => p.id !== id);
  localStorage.setItem(CBRAND_PROFILES_KEY, JSON.stringify(profiles));

  // If this was the current profile, clear it
  const current = loadBrandProfile();
  if (current?.id === id) {
    localStorage.removeItem(CBRAND_PROFILE_KEY);
  }
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
    designExamples: profile.designExamples, // Include design examples
    visualStyle: profile.visualStyle,
    writingTone: profile.writingTone,
    contentThemes: profile.contentThemes,
    primaryColor: profile.primaryColor,
    accentColor: profile.accentColor,
    backgroundColor: profile.backgroundColor,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    contactAddress: profile.contactAddress,
    // Additional fields that might be used by content generation
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

// Auto-save functionality
export function setupAutoSave(
  profile: CompleteBrandProfile,
  onSave?: (saved: SavedBrandProfile) => void
): () => void {
  const saveInterval = setInterval(() => {
    // Only auto-save if there's meaningful content
    if (profile.businessName || profile.description || profile.websiteUrl) {
      try {
        const saved = saveBrandProfile(profile);
        onSave?.(saved);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, 30000); // Auto-save every 30 seconds

  // Return cleanup function
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
export function importBrandProfile(jsonData: string): SavedBrandProfile {
  try {
    const data = JSON.parse(jsonData);
    const now = new Date().toISOString();

    const importedProfile: SavedBrandProfile = {
      ...data,
      id: generateId(), // Generate new ID for imported profile
      createdAt: data.createdAt || now,
      updatedAt: now,
      version: data.version || '1.0',
    };

    return saveBrandProfile(importedProfile);
  } catch (error) {
    throw new Error('Invalid profile data format');
  }
}

// Utility function to generate unique IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Check if profile is complete
export function isProfileComplete(profile: CompleteBrandProfile): boolean {
  const requiredFields = [
    'businessName',
    'businessType',
    'location',
    'description',
    'services',
    'logoDataUrl'
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
