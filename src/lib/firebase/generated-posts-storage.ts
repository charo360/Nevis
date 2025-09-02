// Firebase-based generated posts storage
import { generatedPostFirebaseService } from './services/generated-post-service';
import { brandProfileFirebaseService } from './services/brand-profile-service';
import { auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';
import type { GeneratedPost } from '@/lib/types';

// Get current user ID
function getCurrentUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user?.uid || null);
    });
  });
}

// Get current brand profile ID
async function getCurrentBrandProfileId(userId: string): Promise<string | null> {
  try {
    const profile = await brandProfileFirebaseService.getLatestCompleteBrandProfile(userId);
    return profile?.id || null;
  } catch (error) {
    return null;
  }
}

// Save generated post to Firestore
export async function saveGeneratedPost(post: GeneratedPost): Promise<string> {

  const userId = await getCurrentUserId();

  if (!userId) {
    return saveGeneratedPostToLocalStorage(post);
  }

  const brandProfileId = await getCurrentBrandProfileId(userId);

  if (!brandProfileId) {
    throw new Error('No brand profile found. Please create a brand profile first.');
  }

  try {
    const postId = await generatedPostFirebaseService.saveGeneratedPost(post, userId, brandProfileId);
    return postId;
  } catch (error) {
    return saveGeneratedPostToLocalStorage(post);
  }
}

// Load generated posts from Firestore
export async function loadGeneratedPosts(limit: number = 10): Promise<GeneratedPost[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return loadGeneratedPostsFromLocalStorage();
  }

  try {
    const posts = await generatedPostFirebaseService.getUserGeneratedPosts(userId, { limit });
    return posts;
  } catch (error) {
    return loadGeneratedPostsFromLocalStorage();
  }
}

// Load generated posts for a specific brand profile
export async function loadGeneratedPostsForBrand(brandProfileId: string, limit: number = 10): Promise<GeneratedPost[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  try {
    const posts = await generatedPostFirebaseService.getRecentPostsForBrand(userId, brandProfileId, limit);
    return posts;
  } catch (error) {
    return [];
  }
}

// Delete generated post from Firestore
export async function deleteGeneratedPost(postId: string): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    // Fallback to localStorage if user is not authenticated
    return deleteGeneratedPostFromLocalStorage(postId);
  }

  try {
    await generatedPostFirebaseService.delete(postId);
  } catch (error) {
    deleteGeneratedPostFromLocalStorage(postId);
  }
}

// Update post status
export async function updatePostStatus(
  postId: string,
  status: 'generated' | 'edited' | 'posted'
): Promise<void> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('User must be authenticated to update post status');
  }

  try {
    const firestoreStatus = status === 'posted' ? 'published' : 'draft';
    const publishedAt = status === 'posted' ? new Date() : undefined;

    await generatedPostFirebaseService.updatePostStatus(postId, firestoreStatus, undefined, publishedAt);
  } catch (error) {
    throw error;
  }
}

// Real-time listener for generated posts
export function subscribeToGeneratedPosts(
  callback: (posts: GeneratedPost[]) => void,
  limit: number = 10
): () => void {
  let unsubscribe: (() => void) | null = null;

  getCurrentUserId().then(userId => {
    if (!userId) {
      // Load from localStorage and call callback once
      const posts = loadGeneratedPostsFromLocalStorage();
      callback(posts);
      return;
    }

    // Set up real-time listener
    unsubscribe = generatedPostFirebaseService.onUserDocumentsChange(
      userId,
      callback,
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );
  });

  // Return cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

// ============================================================================
// FALLBACK LOCALSTORAGE FUNCTIONS (for backward compatibility)
// ============================================================================

const GENERATED_POSTS_KEY = 'generatedPosts';
const MAX_POSTS_TO_STORE = 10;

function saveGeneratedPostToLocalStorage(post: GeneratedPost): string {
  try {
    const existingPosts = loadGeneratedPostsFromLocalStorage();
    const newPosts = [post, ...existingPosts.filter(p => p.id !== post.id)].slice(0, MAX_POSTS_TO_STORE);

    localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(newPosts));
    return post.id;
  } catch (error) {
    throw error;
  }
}

function loadGeneratedPostsFromLocalStorage(): GeneratedPost[] {
  try {
    const stored = localStorage.getItem(GENERATED_POSTS_KEY);
    if (!stored) return [];

    const posts = JSON.parse(stored);

    // Fix invalid dates in existing posts
    return posts.map((post: GeneratedPost) => {
      if (!post.date || isNaN(new Date(post.date).getTime())) {
        return {
          ...post,
          date: new Date().toISOString()
        };
      }
      return post;
    });
  } catch (error) {
    return [];
  }
}

function deleteGeneratedPostFromLocalStorage(postId: string): void {
  try {
    const posts = loadGeneratedPostsFromLocalStorage().filter(p => p.id !== postId);
    localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(posts));
  } catch (error) {
  }
}

// Storage cleanup utility
export function cleanupStorage(): void {
  try {
    const posts = loadGeneratedPostsFromLocalStorage();

    // Fix invalid dates and limit posts
    const fixedPosts = posts
      .map((post: GeneratedPost) => {
        if (!post.date || isNaN(new Date(post.date).getTime())) {
          return {
            ...post,
            date: new Date().toISOString()
          };
        }
        return post;
      })
      .slice(0, MAX_POSTS_TO_STORE);

    localStorage.setItem(GENERATED_POSTS_KEY, JSON.stringify(fixedPosts));
  } catch (error) {
    // If cleanup fails, clear all posts
    localStorage.removeItem(GENERATED_POSTS_KEY);
  }
}

// Batch save posts (for migration)
export async function batchSaveGeneratedPosts(posts: GeneratedPost[]): Promise<{
  saved: number;
  failed: number;
  errors: string[];
}> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('User must be authenticated to batch save posts');
  }

  const brandProfileId = await getCurrentBrandProfileId(userId);
  if (!brandProfileId) {
    throw new Error('No brand profile found. Please create a brand profile first.');
  }

  let saved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const post of posts) {
    try {
      await generatedPostFirebaseService.saveGeneratedPost(post, userId, brandProfileId);
      saved++;
    } catch (error) {
      failed++;
      errors.push(`Failed to save post ${post.id}: ${error}`);
    }
  }

  return { saved, failed, errors };
}

// Check if migration is needed
export function needsPostsMigration(): boolean {
  const hasLocalPosts = localStorage.getItem(GENERATED_POSTS_KEY);
  return !!hasLocalPosts;
}

// Clear localStorage after successful migration
export function clearMigratedPosts(): void {
  try {
    localStorage.removeItem(GENERATED_POSTS_KEY);
  } catch (error) {
  }
}
