// Test database connection
import { saveGeneratedPost } from './firebase/generated-posts-storage';
import type { GeneratedPost } from './types';

export async function testDatabaseConnection(): Promise<boolean> {

  try {
    // Create a test post
    const testPost: GeneratedPost = {
      id: 'test-' + Date.now(),
      date: new Date().toISOString(),
      content: 'This is a test post to verify database connectivity.',
      hashtags: ['#test', '#database', '#firebase'],
      status: 'generated',
      variants: [{
        platform: 'Instagram',
        imageUrl: 'https://via.placeholder.com/400x400/blue/white?text=Test+Post',
      }],
      catchyWords: 'Test Post',
      platform: 'Instagram',
      postType: 'post',
      businessType: 'test',
      visualStyle: 'modern',
      targetAudience: 'general',
      generationPrompt: 'Test post for database connectivity',
      aiModel: 'test',
      qualityScore: 85,
      engagementPrediction: 75,
      brandAlignmentScore: 90,
    };

    // Try to save the test post
    const postId = await saveGeneratedPost(testPost);

    if (postId) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Test migration function
export async function testMigration(): Promise<boolean> {

  try {
    const { migrateAllData } = await import('./firebase/migration');
    const { useUserId } = await import('../hooks/use-firebase-auth');

    // Get current user ID (this is a hack for testing)
    const userId = 'test-user-' + Date.now();

    const result = await migrateAllData(userId);

    if (result.errors.length === 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Inspect localStorage data
export function inspectLocalStorageData(): void {

  const keysToCheck = [
    'completeBrandProfile',
    'brandProfile',
    'generatedPosts',
    'artifacts',
    'savedProfiles'
  ];

  keysToCheck.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);

        // Special inspection for brand profile
        if (key === 'completeBrandProfile') {
        }
      } catch (error) {
      }
    } else {
    }
  });
}

// Clear problematic localStorage data
export function clearLocalStorageData(): void {

  const keysToRemove = [
    'completeBrandProfile',
    'brandProfile',
    'generatedPosts',
    'artifacts',
    'savedProfiles'
  ];

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });

}

// Functions to test from browser console
(window as any).testDatabase = testDatabaseConnection;
(window as any).testMigration = testMigration;
(window as any).inspectLocalStorage = inspectLocalStorageData;
(window as any).clearLocalStorage = clearLocalStorageData;
