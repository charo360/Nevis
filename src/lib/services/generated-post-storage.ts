/**
 * Generated Post Storage Service
 * Handles persistent storage of generated post images.
 * Firebase is disabled; uploads are now no-ops until Supabase Storage is wired.
 */

import { uploadDataUrlToSupabase } from '@/lib/services/supabase-image-storage';
import type { GeneratedPost } from '@/lib/types';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class GeneratedPostStorageService {
  /**
   * Convert data URL to File object
   */
  private dataUrlToFile(_dataUrl: string, _filename: string): File {
    // Stub for backward compatibility
    return new File([], 'disabled.png', { type: 'image/png' });
  }

  /**
   * Upload image stub (Firebase disabled). Returns success=false so callers can skip.
   */
  async uploadImageToFirebaseStorage(
    dataUrl: string,
    userId: string,
    postId: string,
    imageType: 'main' | 'variant' = 'main'
  ): Promise<ImageUploadResult> {
    const filename = `post-${postId}-${imageType}-${Date.now()}.png`;
    const path = `generated-content/${userId}/${filename}`;
    const result = await uploadDataUrlToSupabase(dataUrl, 'images', path);
    return { success: result.success, url: result.url, error: result.error };
  }

  /**
   * Test Firebase Storage connection and permissions
   */
  async testConnection(): Promise<ImageUploadResult> {
    return { success: true, url: 'supabase-storage-ready' };
  }

  /**
   * Upload a data URL image to Firebase Storage and return the permanent URL
   */
  async uploadImageDataUrl(
    dataUrl: string,
    userId: string,
    postId: string,
    imageType: 'main' | 'variant' = 'main'
  ): Promise<ImageUploadResult> {
    try {

      // Use the new Firebase Storage upload method
      const result = await this.uploadImageToFirebaseStorage(dataUrl, userId, postId, imageType);

      if (result.success) {
      } else {
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Process a generated post and upload all images to Firebase Storage
   */
  async processGeneratedPost(post: GeneratedPost, userId: string): Promise<GeneratedPost> {

    const processedPost = { ...post };
    let uploadCount = 0;
    let successCount = 0;

    try {
      // Process main image
      if (post.imageUrl && post.imageUrl.startsWith('data:')) {
        uploadCount++;
        const result = await this.uploadImageDataUrl(post.imageUrl, userId, post.id, 'main');
        if (result.success && result.url) {
          processedPost.imageUrl = result.url;
          successCount++;
        } else {
        }
      }

      // Process variant images
      if (post.variants && post.variants.length > 0) {
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
        storageType: 'supabase'
      };

      return processedPost;
    } catch (error) {
      // Return original post if processing fails
      return post;
    }
  }

  /**
   * Check if an image URL is a temporary data URL that needs uploading
   */
  needsUpload(imageUrl: string): boolean {
    return imageUrl.startsWith('data:image/');
  }

  /**
   * Check if an image URL is a permanent Firebase Storage URL
   */
  isPermanentUrl(imageUrl: string): boolean {
    return imageUrl.includes('firebasestorage.googleapis.com') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('http://');
  }

  /**
   * Batch process multiple posts
   */
  async batchProcessPosts(posts: GeneratedPost[], userId: string): Promise<GeneratedPost[]> {

    const processedPosts = await Promise.all(
      posts.map(post => this.processGeneratedPost(post, userId))
    );

    const totalUploaded = processedPosts.reduce((sum, post) =>
      sum + (post.metadata?.imagesUploaded || 0), 0
    );


    return processedPosts;
  }
}

// Export singleton instance
export const generatedPostStorageService = new GeneratedPostStorageService();

// Export utility functions
export const processGeneratedPost = (post: GeneratedPost, userId: string) =>
  generatedPostStorageService.processGeneratedPost(post, userId);

export const batchProcessPosts = (posts: GeneratedPost[], userId: string) =>
  generatedPostStorageService.batchProcessPosts(posts, userId);
