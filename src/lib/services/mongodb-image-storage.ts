/**
 * MongoDB-only Image Storage Service
 * Replaces Firebase Storage with MongoDB GridFS for image storage
 */

import { mongoStorage } from '@/lib/mongodb/storage';
import type { GeneratedPost } from '@/lib/types';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

export class MongoImageStorageService {
  
  /**
   * Upload image data URL to MongoDB GridFS
   */
  async uploadImageDataUrl(
    dataUrl: string,
    userId: string,
    postId: string,
    imageType: 'main' | 'variant' = 'main'
  ): Promise<ImageUploadResult> {
    try {
      console.log('🔄 Uploading image to MongoDB GridFS...');

      // Generate filename
      const filename = `post-${postId}-${imageType}-${Date.now()}.png`;
      
      // Upload to MongoDB GridFS
      const result = await mongoStorage.uploadDataUrlAsImage(dataUrl, filename, {
        userId,
        category: 'generated-content',
        metadata: {
          postId,
          imageType,
          source: 'ai-generation',
          uploadedAt: new Date().toISOString(),
        },
      });

      console.log('✅ Image uploaded to MongoDB GridFS:', result.fileId);

      // Return URL that points to our API endpoint
      const url = `/api/files/${result.fileId}`;

      return {
        success: true,
        url,
        fileId: result.fileId,
      };

    } catch (error) {
      console.error('❌ MongoDB image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Process a generated post and upload all images to MongoDB GridFS
   * This replaces the Firebase Storage processing
   */
  async processGeneratedPost(post: GeneratedPost, userId: string): Promise<GeneratedPost> {
    console.log('🔄 Processing generated post images for MongoDB storage...');
    
    let processedPost = { ...post };
    let uploadCount = 0;
    let successCount = 0;

    // Process main image
    if (post.imageUrl && post.imageUrl.startsWith('data:')) {
      uploadCount++;
      console.log('📤 Uploading main image to MongoDB...');
      
      const result = await this.uploadImageDataUrl(
        post.imageUrl,
        userId,
        post.id,
        'main'
      );
      
      if (result.success && result.url) {
        processedPost.imageUrl = result.url;
        successCount++;
        console.log('✅ Main image uploaded successfully');
      } else {
        console.error('❌ Failed to upload main image:', result.error);
      }
    }

    // Process content image URL
    if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:')) {
      uploadCount++;
      console.log('📤 Uploading content image to MongoDB...');
      
      const result = await this.uploadImageDataUrl(
        post.content.imageUrl,
        userId,
        post.id,
        'content'
      );
      
      if (result.success && result.url) {
        processedPost.content = {
          ...processedPost.content,
          imageUrl: result.url
        };
        successCount++;
        console.log('✅ Content image uploaded successfully');
      } else {
        console.error('❌ Failed to upload content image:', result.error);
      }
    }

    // Process variant images
    if (post.variants && post.variants.length > 0) {
      console.log(`📤 Processing ${post.variants.length} variant images...`);
      
      const processedVariants = await Promise.all(
        post.variants.map(async (variant, index) => {
          if (variant.imageUrl && variant.imageUrl.startsWith('data:')) {
            uploadCount++;
            const result = await this.uploadImageDataUrl(
              variant.imageUrl,
              userId,
              post.id,
              `variant-${index}`
            );
            if (result.success && result.url) {
              successCount++;
              return { ...variant, imageUrl: result.url };
            } else {
              console.error(`❌ Failed to upload variant ${index}:`, result.error);
              return variant;
            }
          }
          return variant;
        })
      );
      processedPost.variants = processedVariants;
    }

    // Add metadata about the upload process
    processedPost.metadata = {
      ...processedPost.metadata,
      imagesUploaded: successCount,
      totalImages: uploadCount,
      uploadedAt: new Date().toISOString(),
      storageType: 'mongodb-gridfs'
    };

    console.log(`✅ Image processing complete: ${successCount}/${uploadCount} images uploaded to MongoDB`);

    return processedPost;
  }

  /**
   * Clean up old images from MongoDB GridFS
   * This helps manage storage space
   */
  async cleanupOldImages(userId: string, daysOld: number = 30): Promise<number> {
    try {
      console.log(`🧹 Cleaning up images older than ${daysOld} days for user ${userId}...`);
      
      // This would require implementing a cleanup method in the storage service
      // For now, return 0 as placeholder
      console.log('⚠️ Image cleanup not yet implemented');
      return 0;
      
    } catch (error) {
      console.error('❌ Error cleaning up old images:', error);
      return 0;
    }
  }

  /**
   * Get storage statistics for a user
   */
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      // This would require implementing stats methods in the storage service
      // For now, return placeholder data
      return {
        totalFiles: 0,
        totalSize: 0,
      };
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
      };
    }
  }
}

// Export singleton instance
export const mongoImageStorage = new MongoImageStorageService();
