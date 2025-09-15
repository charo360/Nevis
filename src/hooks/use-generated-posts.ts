// Hook for managing generated posts with MongoDB
import { useState, useEffect, useCallback } from 'react';
// MongoDB services accessed via API routes only
import { useAuth } from '@/hooks/use-auth-supabase';
import { useCurrentBrandProfile } from './use-brand-profiles';
import type { GeneratedPost, Platform } from '@/lib/types';



// Get Supabase access token for API calls
const getSupabaseAccessToken = async () => {
  if (typeof window !== 'undefined') {
    const { supabase } = await import('@/lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
  return null;
};

// Create headers with Supabase auth token
const getAuthHeaders = async () => {
  const token = await getSupabaseAccessToken();
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : {
    'Content-Type': 'application/json'
  };
};

export interface GeneratedPostsState {
  posts: GeneratedPost[];
  loading: boolean;
  error: string | null;
  saving: boolean;
}

export function useGeneratedPosts(limit: number = 10) {
  const { user } = useAuth();
  const userId = user?.userId;
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

      // Load posts via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts?userId=${userId}&limit=${limit}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to load posts');
      }
      const posts = await response.json();

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

      // Save post via API route
      const headers = await getAuthHeaders();
      const response = await fetch('/api/generated-posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          post,
          userId,
          brandProfileId: currentProfile.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const result = await response.json();
      const postId = result.id;

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
      // Update analytics via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts/${postId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          type: 'analytics',
          ...analytics,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update analytics');
      }

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

      // Update status via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts/${postId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          type: 'status',
          status: firestoreStatus,
          publishedAt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

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
      throw error;
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId: string): Promise<void> => {
    try {
      // Delete post via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts/${postId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Update local state
      setState(prev => ({
        ...prev,
        posts: prev.posts.filter(post => post.id !== postId),
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  // Get posts by platform
  const getPostsByPlatform = useCallback(async (platform: Platform): Promise<GeneratedPost[]> => {
    if (!userId) return [];

    try {
      // Get posts by platform via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts?userId=${userId}&platform=${platform}&limit=${limit}`, {
        headers
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [userId, limit]);

  // Get posts by status
  const getPostsByStatus = useCallback(async (status: 'generated' | 'edited' | 'posted'): Promise<GeneratedPost[]> => {
    if (!userId) return [];

    try {
      const firestoreStatus = status === 'posted' ? 'published' : 'draft';
      // Get posts by status via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts?userId=${userId}&status=${firestoreStatus}`, {
        headers
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [userId]);

  // Load posts when dependencies change
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Note: Real-time updates removed for MongoDB migration
  // Posts will be refreshed when operations are performed

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
  const { user } = useAuth();
  const userId = user?.userId;
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

      // Get brand posts via API route
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/generated-posts/brand/${brandProfileId}?userId=${userId}&limit=${limit}`, {
        headers
      });
      if (!response.ok) {
        throw new Error('Failed to load brand posts');
      }
      const brandPosts = await response.json();

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
