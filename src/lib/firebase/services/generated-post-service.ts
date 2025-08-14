// Generated Posts Firebase service
import { query, where, orderBy, limit, getDocs, collection } from 'firebase/firestore';
import { db } from '../config';
import { DatabaseService } from '../database';
import { COLLECTIONS, GeneratedPostDocument, GeneratedPostDocumentSchema } from '../schema';
import type { GeneratedPost, Platform } from '@/lib/types';

export class GeneratedPostService extends DatabaseService<GeneratedPostDocument> {
  constructor() {
    super(COLLECTIONS.GENERATED_POSTS);
  }

  // Convert from app GeneratedPost to Firestore document
  private toFirestoreDocument(
    post: GeneratedPost,
    userId: string,
    brandProfileId: string
  ): Omit<GeneratedPostDocument, 'id' | 'createdAt' | 'updatedAt'> {
    // Helper function to clean undefined values and flatten nested objects
    const cleanValue = (value: any, defaultValue: any = '') => {
      return value !== undefined && value !== null ? value : defaultValue;
    };

    // Helper function to handle base64 and long strings for Firestore
    const sanitizeForFirestore = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') {
        // Handle base64 data URLs - they're too long for Firestore
        if (value.startsWith('data:image/') && value.includes('base64,')) {
          // Extract just the format info, not the actual base64 data
          const formatMatch = value.match(/data:(image\/[^;]+)/);
          return formatMatch ? `[Base64 ${formatMatch[1]} image]` : '[Base64 image]';
        }
        // Limit string length to prevent Firestore issues
        return value.length > 1000 ? value.substring(0, 1000) + '...[truncated]' : value;
      }
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      // Convert everything else to JSON string to ensure no nested entities
      return JSON.stringify(value);
    };

    // Handle hashtags - convert string to array if needed
    const hashtags = Array.isArray(post.hashtags)
      ? post.hashtags.filter(tag => tag && typeof tag === 'string')
      : typeof post.hashtags === 'string'
        ? post.hashtags.split(' ').filter(tag => tag.startsWith('#'))
        : [];

    return {
      userId,
      brandProfileId,
      platform: cleanValue(post.platform, 'instagram') as GeneratedPostDocument['platform'],
      postType: cleanValue(post.postType, 'post') as GeneratedPostDocument['postType'],
      content: {
        text: sanitizeForFirestore(post.content) || 'Generated content',
        hashtags: hashtags.map(tag => String(tag)), // Ensure all hashtags are strings
        mentions: [], // Not in current GeneratedPost type
        imageUrl: sanitizeForFirestore(post.imageUrl || post.variants?.[0]?.imageUrl || ''),
        videoUrl: sanitizeForFirestore(post.videoUrl || ''),
      },
      metadata: {
        businessType: sanitizeForFirestore(post.businessType || ''),
        visualStyle: sanitizeForFirestore(post.visualStyle || ''),
        targetAudience: sanitizeForFirestore(post.targetAudience || ''),
        generationPrompt: sanitizeForFirestore(post.generationPrompt || ''),
        aiModel: sanitizeForFirestore(post.aiModel || ''),
      },
      analytics: {
        qualityScore: Math.max(0, cleanValue(post.qualityScore, 75)),
        engagementPrediction: Math.max(0, cleanValue(post.engagementPrediction, 70)),
        brandAlignmentScore: Math.max(0, cleanValue(post.brandAlignmentScore, 80)),
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
      },
      status: post.status === 'posted' ? 'published' : 'draft',
    };
  }

  // Convert from Firestore document to app GeneratedPost
  private fromFirestoreDocument(doc: GeneratedPostDocument): GeneratedPost {
    return {
      id: doc.id,
      platform: doc.platform as Platform,
      postType: doc.postType,
      content: doc.content.text,
      hashtags: doc.content.hashtags || [],
      imageUrl: doc.content.imageUrl,
      videoUrl: doc.content.videoUrl,
      businessType: doc.metadata.businessType,
      visualStyle: doc.metadata.visualStyle,
      targetAudience: doc.metadata.targetAudience,
      generationPrompt: doc.metadata.generationPrompt,
      aiModel: doc.metadata.aiModel,
      qualityScore: doc.analytics?.qualityScore,
      engagementPrediction: doc.analytics?.engagementPrediction,
      brandAlignmentScore: doc.analytics?.brandAlignmentScore,
      date: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
      // Legacy fields for backward compatibility
      status: doc.status === 'published' ? 'posted' : 'generated',
      variants: [{
        platform: doc.platform as Platform,
        imageUrl: doc.content.imageUrl || '',
      }],
      imageText: '', // Not stored in Firestore, legacy field
    };
  }

  // Save generated post
  async saveGeneratedPost(
    post: GeneratedPost,
    userId: string,
    brandProfileId: string
  ): Promise<string> {
    try {
      console.log('🔄 Starting post save process...');
      console.log('👤 User ID:', userId);
      console.log('🏢 Brand Profile ID:', brandProfileId);
      console.log('📝 Original post data:', JSON.stringify(post, null, 2));

      const firestoreData = this.toFirestoreDocument(post, userId, brandProfileId);
      console.log('🔧 Converted Firestore data:', JSON.stringify(firestoreData, null, 2));

      // Additional validation to catch nested entities
      const validateNoNestedEntities = (obj: any, path: string = ''): void => {
        if (obj === null || obj === undefined) return;

        if (typeof obj === 'object' && !Array.isArray(obj) && !(obj instanceof Date)) {
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;

            if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
              // Check if this is a simple object with only primitive values
              const hasComplexNesting = Object.values(value).some(v =>
                v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
              );

              if (hasComplexNesting) {
                console.error(`❌ Complex nested entity found at ${currentPath}:`, value);
                throw new Error(`Property ${currentPath} contains an invalid nested entity`);
              }
            }

            validateNoNestedEntities(value, currentPath);
          });
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            validateNoNestedEntities(item, `${path}[${index}]`);
          });
        }
      };

      console.log('🔍 Validating for nested entities...');
      validateNoNestedEntities(firestoreData);
      console.log('✅ No nested entities found');

      // Validate data with schema
      console.log('📋 Validating with schema...');
      const validatedData = GeneratedPostDocumentSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }).parse(firestoreData);

      console.log('💾 Attempting to save to Firestore...');
      const result = await this.create(validatedData);
      console.log('✅ Successfully saved to Firestore with ID:', result);

      return result;
    } catch (error) {
      console.error('❌ Failed to save post:', error);
      console.error('📊 Post data that failed:', JSON.stringify(post, null, 2));
      throw error;
    }
  }

  // Get user's generated posts as app format
  async getUserGeneratedPosts(
    userId: string,
    options?: {
      limit?: number;
      platform?: Platform;
      brandProfileId?: string;
    }
  ): Promise<GeneratedPost[]> {
    let q = query(
      collection(db, COLLECTIONS.GENERATED_POSTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (options?.platform) {
      q = query(q, where('platform', '==', options.platform));
    }

    if (options?.brandProfileId) {
      q = query(q, where('brandProfileId', '==', options.brandProfileId));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeneratedPostDocument[];

    return docs.map(doc => this.fromFirestoreDocument(doc));
  }

  // Get recent posts for a specific brand profile
  async getRecentPostsForBrand(
    userId: string,
    brandProfileId: string,
    limitCount: number = 10
  ): Promise<GeneratedPost[]> {
    const q = query(
      collection(db, COLLECTIONS.GENERATED_POSTS),
      where('userId', '==', userId),
      where('brandProfileId', '==', brandProfileId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeneratedPostDocument[];

    return docs.map(doc => this.fromFirestoreDocument(doc));
  }

  // Update post analytics
  async updatePostAnalytics(
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
  ): Promise<void> {
    const updateData: Partial<GeneratedPostDocument> = {};

    if (analytics.views !== undefined ||
      analytics.likes !== undefined ||
      analytics.shares !== undefined ||
      analytics.comments !== undefined ||
      analytics.qualityScore !== undefined ||
      analytics.engagementPrediction !== undefined ||
      analytics.brandAlignmentScore !== undefined) {

      // Get current document to merge analytics
      const currentDoc = await this.getById(postId);
      if (currentDoc) {
        updateData.analytics = {
          ...currentDoc.analytics,
          ...analytics,
        };
      }
    }

    await this.update(postId, updateData);
  }

  // Update post status
  async updatePostStatus(
    postId: string,
    status: GeneratedPostDocument['status'],
    scheduledAt?: Date,
    publishedAt?: Date
  ): Promise<void> {
    const updateData: Partial<GeneratedPostDocument> = { status };

    if (scheduledAt) {
      updateData.scheduledAt = scheduledAt;
    }

    if (publishedAt) {
      updateData.publishedAt = publishedAt;
    }

    await this.update(postId, updateData);
  }

  // Get posts by status
  async getPostsByStatus(
    userId: string,
    status: GeneratedPostDocument['status']
  ): Promise<GeneratedPost[]> {
    const q = query(
      collection(db, COLLECTIONS.GENERATED_POSTS),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GeneratedPostDocument[];

    return docs.map(doc => this.fromFirestoreDocument(doc));
  }

  // Delete old posts (cleanup utility)
  async deleteOldPosts(userId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const q = query(
      collection(db, COLLECTIONS.GENERATED_POSTS),
      where('userId', '==', userId),
      where('createdAt', '<', cutoffDate)
    );

    const querySnapshot = await getDocs(q);
    const batch = this.createBatch();

    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await this.executeBatch(batch);
    return querySnapshot.docs.length;
  }
}

// Export singleton instance
export const generatedPostFirebaseService = new GeneratedPostService();
