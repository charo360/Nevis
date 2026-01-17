/**
 * Mixpost API Client
 * Handles all communication with the Mixpost social media scheduling platform
 * 
 * Mixpost is a self-hosted social media management tool that allows:
 * - Multi-platform posting (Instagram, Facebook, Twitter, LinkedIn, etc.)
 * - Post scheduling with optimal timing
 * - Analytics and performance tracking
 * - Media library management
 */

import { createClient } from '@supabase/supabase-js';

// Types for Mixpost API
export interface MixpostConfig {
  baseUrl: string;
  apiToken: string;
}

export interface MixpostWorkspace {
  id: string;
  name: string;
  created_at: string;
  accounts: MixpostAccount[];
}

export interface MixpostAccount {
  id: string;
  provider: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok' | 'pinterest';
  name: string;
  username: string;
  avatar_url?: string;
  connected_at: string;
}

export interface MixpostPost {
  id: string;
  workspace_id: string;
  content: string;
  media_ids: string[];
  accounts: string[]; // Account IDs to post to
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  published_at?: string;
  analytics?: MixpostAnalytics;
}

export interface MixpostMedia {
  id: string;
  workspace_id: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  created_at: string;
}

export interface MixpostAnalytics {
  impressions: number;
  reach: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface CreatePostOptions {
  content: string;
  mediaUrls: string[];
  accountIds: string[];
  scheduledAt: Date;
  hashtags?: string[];
}

export interface PublishBatchOptions {
  posts: {
    content: string;
    headline?: string;
    imageUrl: string;
    platform: string;
    hashtags?: string[];
  }[];
  workspaceId: string;
  accountIds: string[];
  startDate?: Date;
  distributionStrategy?: 'even' | 'optimal' | 'custom';
}

/**
 * Mixpost API Client Class
 * Provides methods for interacting with a Mixpost instance
 */
export class MixpostClient {
  private baseUrl: string;
  private apiToken: string;
  private supabase: ReturnType<typeof createClient>;

  constructor(config?: MixpostConfig) {
    this.baseUrl = config?.baseUrl || process.env.MIXPOST_BASE_URL || '';
    this.apiToken = config?.apiToken || process.env.MIXPOST_API_TOKEN || '';
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Check if Mixpost is configured and available
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiToken);
  }

  /**
   * Make authenticated request to Mixpost API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Mixpost is not configured. Please set MIXPOST_BASE_URL and MIXPOST_API_TOKEN.');
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mixpost API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // ============================================================================
  // WORKSPACE MANAGEMENT
  // ============================================================================

  /**
   * Create a new workspace for a client
   * Called when a new client signs up
   */
  async createWorkspace(clientData: {
    clientId: string;
    businessName: string;
    email: string;
  }): Promise<MixpostWorkspace> {
    console.log(`🏢 [Mixpost] Creating workspace for ${clientData.businessName}`);

    const workspace = await this.request<MixpostWorkspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        name: clientData.businessName,
        email: clientData.email,
      }),
    });

    // Store workspace ID in Supabase
    await this.supabase
      .from('brand_profiles')
      .update({ 
        mixpost_workspace_id: workspace.id,
        mixpost_connected_at: new Date().toISOString()
      })
      .eq('id', clientData.clientId);

    console.log(`✅ [Mixpost] Workspace created: ${workspace.id}`);
    return workspace;
  }

  /**
   * Get workspace details including connected accounts
   */
  async getWorkspace(workspaceId: string): Promise<MixpostWorkspace> {
    return this.request<MixpostWorkspace>(`/workspaces/${workspaceId}`);
  }

  /**
   * List all workspaces (admin only)
   */
  async listWorkspaces(): Promise<MixpostWorkspace[]> {
    return this.request<MixpostWorkspace[]>('/workspaces');
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  /**
   * Get connected social accounts for a workspace
   */
  async getAccounts(workspaceId: string): Promise<MixpostAccount[]> {
    return this.request<MixpostAccount[]>(`/workspaces/${workspaceId}/accounts`);
  }

  /**
   * Get OAuth URL for connecting a new social account
   */
  async getConnectAccountUrl(
    workspaceId: string,
    provider: MixpostAccount['provider'],
    callbackUrl: string
  ): Promise<string> {
    const response = await this.request<{ url: string }>(
      `/workspaces/${workspaceId}/accounts/connect`,
      {
        method: 'POST',
        body: JSON.stringify({ provider, callback_url: callbackUrl }),
      }
    );
    return response.url;
  }

  /**
   * Disconnect a social account
   */
  async disconnectAccount(workspaceId: string, accountId: string): Promise<void> {
    await this.request(`/workspaces/${workspaceId}/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // MEDIA MANAGEMENT
  // ============================================================================

  /**
   * Upload media (image/video) to Mixpost media library
   */
  async uploadMedia(
    workspaceId: string,
    imageData: string, // Base64 or URL
    filename: string = 'image.png'
  ): Promise<MixpostMedia> {
    console.log(`📤 [Mixpost] Uploading media to workspace ${workspaceId}`);

    // If it's a data URL, extract the base64 part
    let base64Data = imageData;
    let mimeType = 'image/png';
    
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const media = await this.request<MixpostMedia>(
      `/workspaces/${workspaceId}/media`,
      {
        method: 'POST',
        body: JSON.stringify({
          file: base64Data,
          filename,
          mime_type: mimeType,
        }),
      }
    );

    console.log(`✅ [Mixpost] Media uploaded: ${media.id}`);
    return media;
  }

  /**
   * Get media library for a workspace
   */
  async getMedia(workspaceId: string): Promise<MixpostMedia[]> {
    return this.request<MixpostMedia[]>(`/workspaces/${workspaceId}/media`);
  }

  // ============================================================================
  // POST MANAGEMENT
  // ============================================================================

  /**
   * Create and schedule a single post
   */
  async createPost(
    workspaceId: string,
    options: CreatePostOptions
  ): Promise<MixpostPost> {
    console.log(`📝 [Mixpost] Creating post for workspace ${workspaceId}`);

    // Upload media first
    const mediaIds: string[] = [];
    for (const mediaUrl of options.mediaUrls) {
      const media = await this.uploadMedia(workspaceId, mediaUrl);
      mediaIds.push(media.id);
    }

    // Append hashtags to content if provided
    let content = options.content;
    if (options.hashtags && options.hashtags.length > 0) {
      content += '\n\n' + options.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
    }

    const post = await this.request<MixpostPost>(`/workspaces/${workspaceId}/posts`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        media_ids: mediaIds,
        accounts: options.accountIds,
        scheduled_at: options.scheduledAt.toISOString(),
        status: 'scheduled',
      }),
    });

    console.log(`✅ [Mixpost] Post created and scheduled: ${post.id}`);
    return post;
  }

  /**
   * Publish a batch of generated posts to Mixpost
   * This is the main function called after Revo 2.0 generates content
   */
  async publishBatch(options: PublishBatchOptions): Promise<{
    success: MixpostPost[];
    failed: { post: typeof options.posts[0]; error: string }[];
  }> {
    console.log(`📦 [Mixpost] Publishing batch of ${options.posts.length} posts`);

    const success: MixpostPost[] = [];
    const failed: { post: typeof options.posts[0]; error: string }[] = [];

    // Calculate optimal posting times
    const scheduleTimes = await this.calculateOptimalSchedule(
      options.workspaceId,
      options.posts.length,
      options.startDate || new Date(),
      options.distributionStrategy || 'optimal'
    );

    for (let i = 0; i < options.posts.length; i++) {
      const post = options.posts[i];
      const scheduledAt = scheduleTimes[i];

      try {
        const mixpostPost = await this.createPost(options.workspaceId, {
          content: post.content,
          mediaUrls: [post.imageUrl],
          accountIds: options.accountIds,
          scheduledAt,
          hashtags: post.hashtags,
        });

        success.push(mixpostPost);

        // Store in Supabase for tracking
        await this.supabase.from('scheduled_posts').insert({
          workspace_id: options.workspaceId,
          mixpost_post_id: mixpostPost.id,
          content: post.content,
          headline: post.headline,
          platform: post.platform,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
        });

      } catch (error) {
        console.error(`❌ [Mixpost] Failed to publish post ${i + 1}:`, error);
        failed.push({
          post,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ [Mixpost] Batch complete: ${success.length} success, ${failed.length} failed`);
    return { success, failed };
  }

  /**
   * Get scheduled posts for a workspace
   */
  async getScheduledPosts(workspaceId: string): Promise<MixpostPost[]> {
    return this.request<MixpostPost[]>(
      `/workspaces/${workspaceId}/posts?status=scheduled`
    );
  }

  /**
   * Get post calendar view
   */
  async getCalendar(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MixpostPost[]> {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    return this.request<MixpostPost[]>(
      `/workspaces/${workspaceId}/posts?start_date=${start}&end_date=${end}`
    );
  }

  /**
   * Update a scheduled post
   */
  async updatePost(
    workspaceId: string,
    postId: string,
    updates: Partial<CreatePostOptions>
  ): Promise<MixpostPost> {
    return this.request<MixpostPost>(
      `/workspaces/${workspaceId}/posts/${postId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    );
  }

  /**
   * Delete a scheduled post
   */
  async deletePost(workspaceId: string, postId: string): Promise<void> {
    await this.request(`/workspaces/${workspaceId}/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // SCHEDULING & OPTIMIZATION
  // ============================================================================

  /**
   * Calculate optimal posting times based on analytics
   */
  async calculateOptimalSchedule(
    workspaceId: string,
    numPosts: number,
    startDate: Date = new Date(),
    strategy: 'even' | 'optimal' | 'custom' = 'optimal'
  ): Promise<Date[]> {
    console.log(`📅 [Mixpost] Calculating schedule for ${numPosts} posts`);

    const times: Date[] = [];
    const currentDate = new Date(startDate);

    if (strategy === 'optimal') {
      // Get analytics to determine best posting times
      try {
        const analytics = await this.getAnalytics(workspaceId, 30);
        const bestHours = this.analyzeBestPostingTimes(analytics);
        
        for (let i = 0; i < numPosts; i++) {
          // Distribute across days, using optimal hours
          const dayOffset = Math.floor(i / 2); // 2 posts per day max
          const hourIndex = i % bestHours.length;
          
          const postDate = new Date(currentDate);
          postDate.setDate(postDate.getDate() + dayOffset);
          postDate.setHours(bestHours[hourIndex], 0, 0, 0);
          
          times.push(postDate);
        }
      } catch (error) {
        console.warn('⚠️ [Mixpost] Could not get analytics, using default schedule');
        return this.calculateOptimalSchedule(workspaceId, numPosts, startDate, 'even');
      }
    } else {
      // Even distribution: spread posts evenly across the week
      const postsPerDay = Math.ceil(numPosts / 7);
      const defaultHours = [9, 12, 17, 19]; // 9am, 12pm, 5pm, 7pm
      
      for (let i = 0; i < numPosts; i++) {
        const dayOffset = Math.floor(i / postsPerDay);
        const hourIndex = i % defaultHours.length;
        
        const postDate = new Date(currentDate);
        postDate.setDate(postDate.getDate() + dayOffset);
        postDate.setHours(defaultHours[hourIndex], 0, 0, 0);
        
        times.push(postDate);
      }
    }

    console.log(`✅ [Mixpost] Schedule calculated: ${times.length} time slots`);
    return times;
  }

  /**
   * Analyze analytics to find best posting times
   */
  private analyzeBestPostingTimes(analytics: MixpostAnalytics[]): number[] {
    // Default optimal hours if no data
    const defaultHours = [9, 12, 17, 19];
    
    if (!analytics || analytics.length === 0) {
      return defaultHours;
    }

    // TODO: Implement actual analysis based on engagement data
    // For now, return sensible defaults
    return defaultHours;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get analytics for a workspace
   */
  async getAnalytics(
    workspaceId: string,
    days: number = 30
  ): Promise<MixpostAnalytics[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.request<MixpostAnalytics[]>(
      `/workspaces/${workspaceId}/analytics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
    );
  }

  /**
   * Get analytics for a specific post
   */
  async getPostAnalytics(
    workspaceId: string,
    postId: string
  ): Promise<MixpostAnalytics> {
    return this.request<MixpostAnalytics>(
      `/workspaces/${workspaceId}/posts/${postId}/analytics`
    );
  }

  /**
   * Sync analytics from Mixpost to Supabase
   * Called by daily cron job
   */
  async syncAnalytics(workspaceId: string): Promise<void> {
    console.log(`📊 [Mixpost] Syncing analytics for workspace ${workspaceId}`);

    // Get all published posts
    const posts = await this.request<MixpostPost[]>(
      `/workspaces/${workspaceId}/posts?status=published`
    );

    for (const post of posts) {
      try {
        const analytics = await this.getPostAnalytics(workspaceId, post.id);
        
        // Update in Supabase
        await this.supabase
          .from('scheduled_posts')
          .update({
            analytics: analytics,
            synced_at: new Date().toISOString(),
          })
          .eq('mixpost_post_id', post.id);

      } catch (error) {
        console.error(`⚠️ [Mixpost] Failed to sync analytics for post ${post.id}:`, error);
      }
    }

    console.log(`✅ [Mixpost] Analytics synced for ${posts.length} posts`);
  }
}

// Export singleton instance
let mixpostClient: MixpostClient | null = null;

export function getMixpostClient(): MixpostClient {
  if (!mixpostClient) {
    mixpostClient = new MixpostClient();
  }
  return mixpostClient;
}

export default MixpostClient;
