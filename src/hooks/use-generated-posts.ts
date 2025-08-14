// Hook for managing generated posts with Firestore
import { useState, useEffect, useCallback } from 'react';
import { generatedPostFirebaseService } from '@/lib/firebase/services/generated-post-service';
import { useUserId } from './use-firebase-auth';
import { useCurrentBrandProfile } from './use-brand-profiles';
import type { GeneratedPost, Platform } from '@/lib/types';

export interface GeneratedPostsState {
  posts: GeneratedPost[];
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export function useGeneratedPosts(limit: number = 10) {
  const userId = useUserId();
  const { profile: currentProfile } = useCurrentBrandProfile();
  const [state, setState] = useState<GeneratedPostsState>({
    posts: [],
    loading: true,
    error: null,
    saving: false,
  });

  // Load generated posts
  const loadPosts = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false, posts: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const posts = await generatedPostFirebaseService.getUserGeneratedPosts(userId, { limit });
      
      setState(prev => ({
        ...prev,
        posts,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load posts',
      }));
    }
  }, [userId, limit]);

  // Save generated post
  const savePost = useCallback(async (post: GeneratedPost): Promise<string> => {
    if (!userId || !currentProfile) {
      throw new Error('User must be authenticated and have a brand profile to save posts');
    }

    try {
      setState(prev => ({ ...prev, saving: true, error: null }));
      
      const postId = await generatedPostFirebaseService.saveGeneratedPost(post, userId, currentProfile.id);
      
      // Add to local state optimistically
      setState(prev => ({
        ...prev,
        posts: [{ ...post, id: postId }, ...prev.posts].slice(0, limit),
        saving: false,
      }));
      
      return postId;
    } catch (error) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : 'Failed to save post',
      }));
      throw error;
    }
  }, [userId, currentProfile, limit]);

  // Update post analytics
  const updatePostAnalytics = useCallback(async (
    postId: string,
    analytics: {
      views?: number;
      likes?: number;
      shares?: number;
      comments?: number;
      qualityScore?: number;
      engagementPrediction?: number;
      brandAlignmentScore?: number;
    }
  ): Promise<void> => {
    try {
      await generatedPostFirebaseService.updatePostAnalytics(postId, analytics);
      
      // Update local state
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId 
            ? { ...post, ...analytics }
            : post
        ),
      }));
    } catch (error) {
      console.error('Failed to update post analytics:', error);
      throw error;
    }
  }, []);

  // Update post status
  const updatePostStatus = useCallback(async (
    postId: string,
    status: 'generated' | 'edited' | 'posted'
  ): Promise<void> => {
    try {
      const firestoreStatus = status === 'posted' ? 'published' : 'draft';
      const publishedAt = status === 'posted' ? new Date() : undefined;
      
      await generatedPostFirebaseService.updatePostStatus(postId, firestoreStatus, undefined, publishedAt);
      
      // Update local state
      setState(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId 
            ? { ...post, status }
            : post
        ),
      }));
    } catch (error) {
      console.error('Failed to update post status:', error);
      throw error;
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      await generatedPostFirebaseService.delete(postId);
      
      // Update local state
      setState(prev => ({
        ...prev,
        posts: prev.posts.filter(post => post.id !== postId),
      }));
    } catch (error) {
      console.error('Failed to delete post:', error);
      throw error;
    }
  }, []);

  // Get posts by platform
  const getPostsByPlatform = useCallback(async (platform: Platform): Promise<GeneratedPost[]> => {
    if (!userId) return [];
    
    try {
      return await generatedPostFirebaseService.getUserGeneratedPosts(userId, { platform, limit });
    } catch (error) {
      console.error('Failed to get posts by platform:', error);
      return [];
    }
  }, [userId, limit]);

  // Get posts by status
  const getPostsByStatus = useCallback(async (status: 'generated' | 'edited' | 'posted'): Promise<GeneratedPost[]> => {
    if (!userId) return [];
    
    try {
      const firestoreStatus = status === 'posted' ? 'published' : 'draft';
      return await generatedPostFirebaseService.getPostsByStatus(userId, firestoreStatus);
    } catch (error) {
      console.error('Failed to get posts by status:', error);
      return [];
    }
  }, [userId]);

  // Load posts when dependencies change
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Set up real-time listener
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = generatedPostFirebaseService.onUserDocumentsChange(
      userId,
      (posts) => {
        setState(prev => ({
          ...prev,
          posts: posts.slice(0, limit),
        }));
      },
      { limit, orderBy: 'createdAt', orderDirection: 'desc' }
    );

    return unsubscribe;
  }, [userId, limit]);

  return {
    ...state,
    savePost,
    updatePostAnalytics,
    updatePostStatus,
    deletePost,
    getPostsByPlatform,
    getPostsByStatus,
    reload: loadPosts,
  };
}

// Hook for getting posts for a specific brand profile
export function useGeneratedPostsForBrand(brandProfileId: string, limit: number = 10) {
  const userId = useUserId();
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!userId || !brandProfileId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const brandPosts = await generatedPostFirebaseService.getRecentPostsForBrand(
        userId, 
        brandProfileId, 
        limit
      );
      
      setPosts(brandPosts);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      setLoading(false);
    }
  }, [userId, brandProfileId, limit]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    reload: loadPosts,
  };
}

// Hook for post statistics
export function usePostStatistics() {
  const { posts } = useGeneratedPosts(100); // Get more posts for statistics
  
  const statistics = {
    total: posts.length,
    byPlatform: posts.reduce((acc, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {} as Record<Platform, number>),
    byStatus: posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    averageQuality: posts.length > 0 
      ? posts.reduce((sum, post) => sum + (post.qualityScore || 0), 0) / posts.length 
      : 0,
    averageEngagement: posts.length > 0 
      ? posts.reduce((sum, post) => sum + (post.engagementPrediction || 0), 0) / posts.length 
      : 0,
  };

  return statistics;
}
