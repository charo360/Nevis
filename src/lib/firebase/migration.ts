// Migration utilities for moving localStorage data to Firestore
import { brandProfileFirebaseService } from './services/brand-profile-service';
import { generatedPostFirebaseService } from './services/generated-post-service';
import { artifactFirebaseService } from './services/artifact-service';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';
import type { GeneratedPost } from '@/lib/types';

// Migration status tracking
export interface MigrationStatus {
  brandProfiles: { migrated: number; failed: number };
  generatedPosts: { migrated: number; failed: number };
  artifacts: { migrated: number; failed: number };
  errors: string[];
}

// Migrate brand profiles from localStorage to Firestore
export async function migrateBrandProfiles(userId: string): Promise<{
  migrated: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;
  let failed = 0;

  try {
    // Get current brand profile
    const currentProfileData = localStorage.getItem('completeBrandProfile');
    if (currentProfileData) {
      try {
        const currentProfile: CompleteBrandProfile = JSON.parse(currentProfileData);

        // Clean and validate profile data before migration
        const cleanedProfile = {
          ...currentProfile,
          businessName: currentProfile.businessName || 'Untitled Business',
          businessType: currentProfile.businessType || 'General',
          businessDescription: currentProfile.businessDescription || currentProfile.description || '',
          location: currentProfile.location || '',
          website: currentProfile.website || '',
          socialMedia: currentProfile.socialMedia || {},
          brandColors: Array.isArray(currentProfile.brandColors) ? currentProfile.brandColors : [],
          brandFonts: Array.isArray(currentProfile.brandFonts) ? currentProfile.brandFonts : [],
          visualStyle: currentProfile.visualStyle || '',
          targetAudience: currentProfile.targetAudience || '',
          brandVoice: currentProfile.brandVoice || '',
          services: Array.isArray(currentProfile.services) ? currentProfile.services : [],
          designExamples: Array.isArray(currentProfile.designExamples) ? currentProfile.designExamples : [],
        };

        await brandProfileFirebaseService.saveBrandProfile(cleanedProfile, userId);
        migrated++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to migrate current brand profile: ${errorMessage}`);
      }
    }

    // Get saved brand profiles list
    const savedProfilesData = localStorage.getItem('completeBrandProfiles');
    if (savedProfilesData) {
      try {
        const savedProfiles: CompleteBrandProfile[] = JSON.parse(savedProfilesData);

        for (const profile of savedProfiles) {
          try {
            // Check if this profile was already migrated (avoid duplicates)
            const existing = await brandProfileFirebaseService.getUserBrandProfiles(userId);
            const isDuplicate = existing.some(existingProfile =>
              existingProfile.businessName === profile.businessName &&
              existingProfile.businessType === profile.businessType
            );

            if (!isDuplicate) {
              await brandProfileFirebaseService.saveBrandProfile(profile, userId);
              migrated++;
            }
          } catch (error) {
            failed++;
            errors.push(`Failed to migrate saved profile "${profile.businessName}": ${error}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to parse saved profiles: ${error}`);
      }
    }

    // Also check for legacy brand profile format
    const legacyProfileData = localStorage.getItem('brandProfile');
    if (legacyProfileData) {
      try {
        const legacyProfile = JSON.parse(legacyProfileData);

        // Convert legacy format to CompleteBrandProfile
        const convertedProfile: CompleteBrandProfile = {
          businessName: legacyProfile.businessName || '',
          businessType: legacyProfile.businessType || '',
          location: legacyProfile.location || '',
          description: legacyProfile.description || '',
          services: legacyProfile.services || [],
          targetAudience: legacyProfile.targetAudience || '',
          keyFeatures: legacyProfile.keyFeatures || '',
          competitiveAdvantages: legacyProfile.competitiveAdvantages || '',
          contactPhone: legacyProfile.contactPhone || '',
          contactEmail: legacyProfile.contactEmail || '',
          contactAddress: legacyProfile.contactAddress || '',
          visualStyle: legacyProfile.visualStyle || '',
          writingTone: legacyProfile.writingTone || '',
          contentThemes: legacyProfile.contentThemes || '',
          primaryColor: legacyProfile.primaryColor || '',
          accentColor: legacyProfile.accentColor || '',
          backgroundColor: legacyProfile.backgroundColor || '',
          facebookUrl: legacyProfile.socialMedia?.facebook || '',
          instagramUrl: legacyProfile.socialMedia?.instagram || '',
          twitterUrl: legacyProfile.socialMedia?.twitter || '',
          linkedinUrl: legacyProfile.socialMedia?.linkedin || '',
          websiteUrl: legacyProfile.websiteUrl || '',
          logoDataUrl: legacyProfile.logoDataUrl || '',
          designExamples: legacyProfile.designExamples || [],
        };

        // Check for duplicates
        const existing = await brandProfileFirebaseService.getUserBrandProfiles(userId);
        const isDuplicate = existing.some(existingProfile =>
          existingProfile.businessName === convertedProfile.businessName &&
          existingProfile.businessType === convertedProfile.businessType
        );

        if (!isDuplicate) {
          await brandProfileFirebaseService.saveBrandProfile(convertedProfile, userId);
          migrated++;
        }
      } catch (error) {
        failed++;
        errors.push(`Failed to migrate legacy brand profile: ${error}`);
      }
    }

  } catch (error) {
    errors.push(`Migration error: ${error}`);
  }

  return { migrated, failed, errors };
}

// Migrate generated posts from localStorage to Firestore
export async function migrateGeneratedPosts(userId: string, brandProfileId: string): Promise<{
  migrated: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;
  let failed = 0;

  try {
    const generatedPostsData = localStorage.getItem('generatedPosts');
    if (generatedPostsData) {
      try {
        const posts: GeneratedPost[] = JSON.parse(generatedPostsData);

        for (const post of posts) {
          try {

            // Deep clean function to handle all nested objects
            const deepClean = (obj: any): any => {
              if (obj === null || obj === undefined) return null;
              if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
              if (obj instanceof Date) return obj;
              if (Array.isArray(obj)) {
                return obj.map(item => {
                  if (typeof item === 'object' && item !== null) {
                    return JSON.stringify(item);
                  }
                  return String(item);
                });
              }
              if (typeof obj === 'object') {
                // For objects, convert to string to avoid nested entity issues
                return JSON.stringify(obj);
              }
              return String(obj);
            };

            // Clean and validate post data before migration
            const cleanedPost = {
              id: post.id || `post_${Date.now()}`,
              content: deepClean(post.content) || 'Generated content',
              platform: String(post.platform || 'instagram'),
              postType: String(post.postType || 'post'),
              businessType: String(post.businessType || 'general'),
              visualStyle: String(post.visualStyle || ''),
              targetAudience: String(post.targetAudience || ''),
              generationPrompt: String(post.generationPrompt || ''),
              aiModel: String(post.aiModel || 'ai'),
              qualityScore: Math.max(0, Number(post.qualityScore) || 75),
              engagementPrediction: Math.max(0, Number(post.engagementPrediction) || 70),
              brandAlignmentScore: Math.max(0, Number(post.brandAlignmentScore) || 80),
              hashtags: Array.isArray(post.hashtags) ? post.hashtags.map(tag => String(tag)) : [],
              status: String(post.status || 'generated'),
              imageUrl: String(post.imageUrl || ''),
              videoUrl: String(post.videoUrl || ''),
              createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
            };


            await generatedPostFirebaseService.saveGeneratedPost(cleanedPost, userId, brandProfileId);
            migrated++;
          } catch (error) {
            failed++;
            const errorMessage = error instanceof Error ? error.message : String(error);
            errors.push(`Failed to migrate post "${post.id}": ${errorMessage}`);
          }
        }
      } catch (error) {
        errors.push(`Failed to parse generated posts: ${error}`);
      }
    }
  } catch (error) {
    errors.push(`Migration error: ${error}`);
  }

  return { migrated, failed, errors };
}

// Complete migration process
export async function migrateAllData(userId: string): Promise<MigrationStatus> {
  const status: MigrationStatus = {
    brandProfiles: { migrated: 0, failed: 0 },
    generatedPosts: { migrated: 0, failed: 0 },
    artifacts: { migrated: 0, failed: 0 },
    errors: [],
  };


  // 1. Migrate brand profiles first
  const brandProfileResult = await migrateBrandProfiles(userId);
  status.brandProfiles = {
    migrated: brandProfileResult.migrated,
    failed: brandProfileResult.failed,
  };
  status.errors.push(...brandProfileResult.errors);

  // 2. Get the first migrated brand profile ID for posts migration
  let brandProfileId = '';
  try {
    const profiles = await brandProfileFirebaseService.getUserBrandProfiles(userId);
    if (profiles.length > 0) {
      brandProfileId = profiles[0].id;
    }
  } catch (error) {
    status.errors.push(`Failed to get brand profile for posts migration: ${error}`);
  }

  // 3. Migrate generated posts if we have a brand profile
  if (brandProfileId) {
    const postsResult = await migrateGeneratedPosts(userId, brandProfileId);
    status.generatedPosts = {
      migrated: postsResult.migrated,
      failed: postsResult.failed,
    };
    status.errors.push(...postsResult.errors);
  }

  // 4. Artifacts migration would go here (currently using in-memory storage)
  // For now, artifacts are handled by the artifacts service directly

  return status;
}

// Check if migration is needed
export function needsMigration(): boolean {
  const hasLocalBrandProfile = localStorage.getItem('completeBrandProfile') ||
    localStorage.getItem('brandProfile');
  const hasLocalPosts = localStorage.getItem('generatedPosts');

  return !!(hasLocalBrandProfile || hasLocalPosts);
}

// Clear localStorage after successful migration
export function clearMigratedData(): void {
  const keysToRemove = [
    'completeBrandProfile',
    'completeBrandProfiles',
    'brandProfile',
    'generatedPosts',
  ];

  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
    }
  });

}

// Migration hook for React components
export function useMigration() {
  const [migrationStatus, setMigrationStatus] = React.useState<{
    isNeeded: boolean;
    isRunning: boolean;
    isComplete: boolean;
    status?: MigrationStatus;
  }>({
    isNeeded: false,
    isRunning: false,
    isComplete: false,
  });

  React.useEffect(() => {
    setMigrationStatus(prev => ({
      ...prev,
      isNeeded: needsMigration(),
    }));
  }, []);

  const runMigration = async (userId: string) => {
    if (!userId) return;

    setMigrationStatus(prev => ({ ...prev, isRunning: true }));

    try {
      const status = await migrateAllData(userId);

      // Clear localStorage if migration was successful
      if (status.errors.length === 0) {
        clearMigratedData();
      }

      setMigrationStatus({
        isNeeded: false,
        isRunning: false,
        isComplete: true,
        status,
      });
    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        status: {
          ...prev.status!,
          errors: [...(prev.status?.errors || []), `Migration failed: ${error}`],
        },
      }));
    }
  };

  return {
    ...migrationStatus,
    runMigration,
  };
}

// Add React import for the hook
import React from 'react';

// Debug function to inspect post data structure
function debugPostData() {
  try {
    const posts = JSON.parse(localStorage.getItem('generatedPosts') || '[]');

    posts.forEach((post: any, index: number) => {

      // Check for nested objects
      Object.keys(post).forEach(key => {
        const value = post[key];
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        }
      });
    });

  } catch (error) {
  }
}

// Make functions available globally for testing
declare global {
  interface Window {
    testDatabase: () => Promise<void>;
    testMigration: () => Promise<void>;
    clearLocalStorage: () => void;
    runMigration: () => Promise<void>;
    debugPostData: () => void;
  }
}

// Test function to save a completely clean post
async function testCleanPost() {
  try {

    const userId = 'test-user-' + Date.now();
    const brandProfileId = 'test-brand-' + Date.now();

    // Create a completely clean post with no nested objects
    const cleanPost = {
      id: 'test-post-' + Date.now(),
      content: 'This is a simple test post content',
      platform: 'instagram',
      postType: 'post',
      businessType: 'general',
      visualStyle: 'modern',
      targetAudience: 'general',
      generationPrompt: 'test prompt',
      aiModel: 'ai',
      qualityScore: 75,
      engagementPrediction: 70,
      brandAlignmentScore: 80,
      hashtags: ['#test', '#clean'],
      status: 'generated',
      imageUrl: '',
      videoUrl: '',
      createdAt: new Date(),
    };


    const { generatedPostFirebaseService } = await import('./services/generated-post-service');
    await generatedPostFirebaseService.saveGeneratedPost(cleanPost, userId, brandProfileId);

  } catch (error) {
  }
}

// Assign to window for global access
if (typeof window !== 'undefined') {
  window.debugPostData = debugPostData;
  (window as any).testCleanPost = testCleanPost;
}
