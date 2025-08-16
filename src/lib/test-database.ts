// Test database connection
import { saveGeneratedPost } from './firebase/generated-posts-storage';
import type { GeneratedPost } from './types';

export async function testDatabaseConnection(): Promise<boolean> {
  console.log('🧪 Testing database connection...');

  try {
    // Create a test post
    const testPost: GeneratedPost = {
      id: 'test-' + Date.now(),
      date: new Date().toISOString(),
      content: 'This is a test post to verify database connectivity.',
      hashtags: ['#test', '#database', '#firebase'],
      status: 'generated',
      variants: [{
        platform: 'instagram',
        imageUrl: 'https://via.placeholder.com/400x400/blue/white?text=Test+Post',
      }],
      catchyWords: 'Test Post',
      platform: 'instagram',
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
      console.log('✅ Database connection test successful! Post ID:', postId);
      return true;
    } else {
      console.error('❌ Database connection test failed - no post ID returned');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Test migration function
export async function testMigration(): Promise<boolean> {
  console.log('🧪 Testing migration...');

  try {
    const { migrateAllData } = await import('./firebase/migration');
    const { useUserId } = await import('../hooks/use-firebase-auth');

    // Get current user ID (this is a hack for testing)
    const userId = 'test-user-' + Date.now();
    console.log('Using test user ID:', userId);

    const result = await migrateAllData(userId);
    console.log('Migration result:', result);

    if (result.errors.length === 0) {
      console.log('✅ Migration test successful!');
      return true;
    } else {
      console.error('❌ Migration test failed with errors:', result.errors);
      return false;
    }
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    return false;
  }
}

// Inspect localStorage data
export function inspectLocalStorageData(): void {
  console.log('🔍 Inspecting localStorage data...');

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
        console.log(`📋 ${key}:`, parsed);

        // Special inspection for brand profile
        if (key === 'completeBrandProfile') {
          console.log('🏢 Brand Profile Details:');
          console.log('- businessName:', parsed.businessName);
          console.log('- businessType:', parsed.businessType);
          console.log('- businessDescription:', parsed.businessDescription);
          console.log('- description:', parsed.description);
          console.log('- location:', parsed.location);
          console.log('- website:', parsed.website);
        }
      } catch (error) {
        console.log(`❌ Failed to parse ${key}:`, error);
        console.log(`📄 Raw data:`, data.substring(0, 200) + '...');
      }
    } else {
      console.log(`📭 ${key}: (empty)`);
    }
  });
}

// Clear problematic localStorage data
export function clearLocalStorageData(): void {
  console.log('🧹 Clearing localStorage data...');

  const keysToRemove = [
    'completeBrandProfile',
    'brandProfile',
    'generatedPosts',
    'artifacts',
    'savedProfiles'
  ];

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`Removing ${key} from localStorage`);
      localStorage.removeItem(key);
    }
  });

  console.log('✅ localStorage cleared');
}

// Functions to test from browser console
(window as any).testDatabase = testDatabaseConnection;
(window as any).testMigration = testMigration;
(window as any).inspectLocalStorage = inspectLocalStorageData;
(window as any).clearLocalStorage = clearLocalStorageData;
