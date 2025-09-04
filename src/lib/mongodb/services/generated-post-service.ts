// MongoDB Generated Post Service (replaces Firebase generated post service)
import { generatedPostService } from '../database';
import type { GeneratedPostDocument } from '../schemas';

// Generated post interface (matching the existing interface)
export interface GeneratedPost {
  id: string;
  userId: string;
  brandProfileId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  postType: 'post' | 'story' | 'reel' | 'advertisement';
  content: {
    text: string;
    hashtags?: string[];
    mentions?: string[];
    imageUrl?: string;
    videoUrl?: string;
  };
  // Support for multi-platform variants
  variants?: {
    platform: string;
    imageUrl: string;
  }[];
  // Legacy fields for backward compatibility
  imageUrl?: string;
  catchyWords?: string;
  subheadline?: string;
  callToAction?: string;
  metadata?: {
    businessType?: string;
    visualStyle?: string;
    targetAudience?: string;
    generationPrompt?: string;
    aiModel?: string;
  };
  analytics?: {
    qualityScore?: number;
    engagementPrediction?: number;
    brandAlignmentScore?: number;
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class GeneratedPostMongoService {
  // Convert MongoDB document to GeneratedPost
  private documentToPost(doc: GeneratedPostDocument): any {
    // Convert database format to frontend GeneratedPost format
    const result = {
      id: doc._id?.toString() || '',
      date: doc.createdAt?.toISOString() || new Date().toISOString(),
      content: doc.content?.text || '',
      hashtags: doc.content?.hashtags || [],
      status: doc.status === 'published' ? 'posted' : 'generated',
      variants: doc.variants || [],
      catchyWords: doc.catchyWords || '',
      subheadline: doc.subheadline,
      callToAction: doc.callToAction,
      videoUrl: doc.content?.videoUrl,
      imageUrl: doc.imageUrl || doc.content?.imageUrl,
      platform: doc.platform,
      postType: doc.postType,
      // Business context from metadata
      businessType: doc.metadata?.businessType,
      visualStyle: doc.metadata?.visualStyle,
      targetAudience: doc.metadata?.targetAudience,
      generationPrompt: doc.metadata?.generationPrompt,
      aiModel: doc.metadata?.aiModel,
      // Quality metrics from analytics
      qualityScore: doc.analytics?.qualityScore,
      engagementPrediction: doc.analytics?.engagementPrediction,
      brandAlignmentScore: doc.analytics?.brandAlignmentScore,
      // Internal database fields (not in frontend type but needed for operations)
      userId: doc.userId,
      brandProfileId: doc.brandProfileId,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };

    // Debug logging for variants
    if (doc.variants && doc.variants.length > 0) {
      console.log('🖼️ MongoDB Service: Post has variants:', doc.variants.length, 'variants');
    } else {
      console.log('⚠️ MongoDB Service: Post has no variants - imageUrl:', doc.imageUrl || doc.content?.imageUrl || 'none');
    }

    return result;
  }

  // Convert GeneratedPost to MongoDB document data
  private postToDocument(post: any): Omit<GeneratedPostDocument, '_id' | 'createdAt' | 'updatedAt'> {
    // Debug logging for variants
    if (post.variants && post.variants.length > 0) {
      console.log('🖼️ MongoDB Service: Saving post with variants:', post.variants.length, 'variants');
      post.variants.forEach((variant: any, index: number) => {
        console.log(`  Variant ${index + 1}: ${variant.platform} - ${variant.imageUrl ? 'has image' : 'no image'}`);
      });
    } else {
      console.log('⚠️ MongoDB Service: Saving post without variants - imageUrl:', post.imageUrl || 'none');
    }

    // Convert frontend GeneratedPost format to database format
    return {
      userId: post.userId || '',
      brandProfileId: post.brandProfileId || '',
      platform: post.platform || 'instagram',
      postType: post.postType || 'post',
      content: {
        text: typeof post.content === 'string' ? post.content : post.content?.text || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags :
          typeof post.hashtags === 'string' ? post.hashtags.split(' ') :
            post.content?.hashtags || [],
        mentions: post.content?.mentions || [],
        imageUrl: post.content?.imageUrl || post.imageUrl,
        videoUrl: post.content?.videoUrl || post.videoUrl,
      },
      variants: post.variants || [],
      imageUrl: post.imageUrl,
      catchyWords: post.catchyWords,
      subheadline: post.subheadline,
      callToAction: post.callToAction,
      metadata: {
        businessType: post.businessType,
        visualStyle: post.visualStyle,
        targetAudience: post.targetAudience,
        generationPrompt: post.generationPrompt,
        aiModel: post.aiModel,
        ...post.metadata
      },
      analytics: {
        qualityScore: post.qualityScore,
        engagementPrediction: post.engagementPrediction,
        brandAlignmentScore: post.brandAlignmentScore,
        ...post.analytics
      },
      status: post.status === 'posted' ? 'published' : 'draft',
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
    };
  }

  // Save generated post
  async saveGeneratedPost(post: GeneratedPost): Promise<string> {
    try {
      console.log('🔄 MongoDB Service: Saving generated post...', {
        hasId: !!post.id,
        userId: post.userId,
        brandProfileId: post.brandProfileId,
        platform: post.platform,
        contentLength: post.content?.text?.length || 0
      });

      // For generated posts, always create new posts instead of updating
      // Only update if we have a valid MongoDB ObjectId (24 character hex string)
      const isValidObjectId = post.id && /^[0-9a-fA-F]{24}$/.test(post.id);

      if (isValidObjectId) {
        // Update existing post with valid MongoDB ObjectId
        console.log('🔄 MongoDB Service: Updating existing post with valid ObjectId:', post.id);
        const success = await generatedPostService.updateById(post.id, this.postToDocument(post));
        if (!success) {
          throw new Error('Failed to update generated post');
        }
        console.log('✅ MongoDB Service: Post updated successfully');
        return post.id;
      } else {
        // Create new post (this includes cases where id is invalid or missing)
        if (post.id && !isValidObjectId) {
          console.log('🔄 MongoDB Service: Invalid ObjectId detected, creating new post instead. Invalid ID:', post.id);
        } else {
          console.log('🔄 MongoDB Service: Creating new post...');
        }

        const document = this.postToDocument(post);
        console.log('🔄 MongoDB Service: Document to save:', {
          userId: document.userId,
          brandProfileId: document.brandProfileId,
          platform: document.platform,
          hasContent: !!document.content
        });

        const postId = await generatedPostService.create(document);
        console.log('✅ MongoDB Service: Post created successfully with ID:', postId);
        return postId;
      }
    } catch (error) {
      console.error('❌ MongoDB Service: Error saving generated post:', error);
      console.error('❌ MongoDB Service: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
    }
  }

  // Load generated post by ID
  async loadGeneratedPost(postId: string): Promise<GeneratedPost | null> {
    try {
      const doc = await generatedPostService.getById(postId);
      return doc ? this.documentToPost(doc) : null;
    } catch (error) {
      console.error('Error loading generated post:', error);
      return null;
    }
  }

  // Load all generated posts for a user
  async loadGeneratedPosts(userId: string, limit?: number): Promise<GeneratedPost[]> {
    try {
      const docs = await generatedPostService.getByUserId(userId, {
        sort: { createdAt: -1 },
        limit: limit || 50
      });
      return docs.map(doc => this.documentToPost(doc));
    } catch (error) {
      console.error('Error loading generated posts:', error);
      return [];
    }
  }

  // Load generated posts by brand profile
  async loadGeneratedPostsByBrand(brandProfileId: string, limit?: number): Promise<GeneratedPost[]> {
    try {
      const docs = await generatedPostService.getAll(
        { brandProfileId },
        {
          sort: { createdAt: -1 },
          limit: limit || 50
        }
      );
      return docs.map(doc => this.documentToPost(doc));
    } catch (error) {
      console.error('Error loading generated posts by brand:', error);
      return [];
    }
  }

  // Load generated posts by platform
  async loadGeneratedPostsByPlatform(
    userId: string,
    platform: string,
    limit?: number
  ): Promise<GeneratedPost[]> {
    try {
      const docs = await generatedPostService.getAll(
        { userId, platform },
        {
          sort: { createdAt: -1 },
          limit: limit || 50
        }
      );
      return docs.map(doc => this.documentToPost(doc));
    } catch (error) {
      console.error('Error loading generated posts by platform:', error);
      return [];
    }
  }

  // Load generated posts by status
  async loadGeneratedPostsByStatus(
    userId: string,
    status: string,
    limit?: number
  ): Promise<GeneratedPost[]> {
    try {
      const docs = await generatedPostService.getAll(
        { userId, status },
        {
          sort: { createdAt: -1 },
          limit: limit || 50
        }
      );
      return docs.map(doc => this.documentToPost(doc));
    } catch (error) {
      console.error('Error loading generated posts by status:', error);
      return [];
    }
  }

  // Update generated post
  async updateGeneratedPost(postId: string, updates: Partial<GeneratedPost>): Promise<void> {
    try {
      const success = await generatedPostService.updateById(postId, updates);
      if (!success) {
        throw new Error('Failed to update generated post');
      }
    } catch (error) {
      console.error('Error updating generated post:', error);
      throw error;
    }
  }

  // Delete generated post
  async deleteGeneratedPost(postId: string): Promise<void> {
    try {
      const success = await generatedPostService.deleteById(postId);
      if (!success) {
        throw new Error('Failed to delete generated post');
      }
    } catch (error) {
      console.error('Error deleting generated post:', error);
      throw error;
    }
  }

  // Update post status
  async updatePostStatus(postId: string, status: GeneratedPost['status']): Promise<void> {
    try {
      const updates: any = { status };

      if (status === 'published') {
        updates.publishedAt = new Date();
      }

      await this.updateGeneratedPost(postId, updates);
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  }

  // Update post analytics
  async updatePostAnalytics(postId: string, analytics: GeneratedPost['analytics']): Promise<void> {
    try {
      await this.updateGeneratedPost(postId, { analytics });
    } catch (error) {
      console.error('Error updating post analytics:', error);
      throw error;
    }
  }

  // Get post count for user
  async getPostCount(userId: string): Promise<number> {
    try {
      return await generatedPostService.count({ userId });
    } catch (error) {
      console.error('Error getting post count:', error);
      return 0;
    }
  }

  // Get posts with pagination
  async getPostsWithPagination(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters?: {
      platform?: string;
      status?: string;
      brandProfileId?: string;
    }
  ): Promise<{
    posts: GeneratedPost[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const filter: any = { userId };

      if (filters?.platform) filter.platform = filters.platform;
      if (filters?.status) filter.status = filters.status;
      if (filters?.brandProfileId) filter.brandProfileId = filters.brandProfileId;

      const result = await generatedPostService.findWithPagination(
        filter,
        page,
        limit,
        { createdAt: -1 }
      );

      return {
        posts: result.documents.map(doc => this.documentToPost(doc)),
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      };
    } catch (error) {
      console.error('Error getting posts with pagination:', error);
      return {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  }

  // Search posts by content
  async searchPosts(userId: string, searchTerm: string): Promise<GeneratedPost[]> {
    try {
      const docs = await generatedPostService.getAll({
        userId,
        'content.text': { $regex: searchTerm, $options: 'i' }
      });
      return docs.map(doc => this.documentToPost(doc));
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const generatedPostMongoService = new GeneratedPostMongoService();

// Export functions that match the Firebase service API
export async function saveGeneratedPostMongo(post: GeneratedPost): Promise<string> {
  return generatedPostMongoService.saveGeneratedPost(post);
}

export async function loadGeneratedPostMongo(postId: string): Promise<GeneratedPost | null> {
  return generatedPostMongoService.loadGeneratedPost(postId);
}

export async function loadGeneratedPostsMongo(userId: string, limit?: number): Promise<GeneratedPost[]> {
  return generatedPostMongoService.loadGeneratedPosts(userId, limit);
}

export async function updateGeneratedPostMongo(postId: string, updates: Partial<GeneratedPost>): Promise<void> {
  return generatedPostMongoService.updateGeneratedPost(postId, updates);
}

export async function deleteGeneratedPostMongo(postId: string): Promise<void> {
  return generatedPostMongoService.deleteGeneratedPost(postId);
}
