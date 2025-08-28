/**
 * Generated Post Storage Service
 * Handles persistent storage of generated post images to Firebase Storage
 */

import { uploadDataUrlAsImage } from '@/lib/firebase/storage-service';
import type { GeneratedPost } from '@/lib/types';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class GeneratedPostStorageService {
  /**
   * Upload a data URL image to Firebase Storage and return the permanent URL
   */
  async uploadImageDataUrl(
    dataUrl: string, 
    postId: string, 
    imageType: 'main' | 'variant' = 'main'
  ): Promise<ImageUploadResult> {
    try {
      console.log(`🔄 Uploading ${imageType} image for post ${postId}...`);
      
      const fileName = `post-${postId}-${imageType}-${Date.now()}.png`;
      const result = await uploadDataUrlAsImage(dataUrl, fileName, postId, {
        customMetadata: {
          postId,
          imageType,
          uploadedAt: new Date().toISOString(),
        }
      });

      console.log(`✅ Successfully uploaded ${imageType} image:`, result.url);
      
      return {
        success: true,
        url: result.url
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${imageType} image:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Process a generated post and upload all images to Firebase Storage
   */
  async processGeneratedPost(post: GeneratedPost): Promise<GeneratedPost> {
    console.log('🔄 Processing generated post images for permanent storage...');
    
    const processedPost = { ...post };
    let uploadCount = 0;
    let successCount = 0;

    try {
      // Process main image
      if (post.imageUrl && post.imageUrl.startsWith('data:')) {
        uploadCount++;
        const result = await this.uploadImageDataUrl(post.imageUrl, post.id, 'main');
        if (result.success && result.url) {
          processedPost.imageUrl = result.url;
          successCount++;
          console.log('✅ Main image uploaded successfully');
        } else {
          console.warn('⚠️ Main image upload failed, keeping original data URL');
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
                post.id, 
                `variant-${index}`
              );
              if (result.success && result.url) {
                successCount++;
                return { ...variant, imageUrl: result.url };
              } else {
                console.warn(`⚠️ Variant ${index} image upload failed, keeping original data URL`);
                return variant;
              }
            }
            return variant;
          })
        );
        processedPost.variants = processedVariants;
      }

      console.log(`✅ Image processing complete: ${successCount}/${uploadCount} images uploaded successfully`);
      
      // Add metadata about the upload process
      processedPost.metadata = {
        ...processedPost.metadata,
        imagesUploaded: successCount,
        totalImages: uploadCount,
        uploadedAt: new Date().toISOString(),
        storageType: 'firebase'
      };

      return processedPost;
    } catch (error) {
      console.error('❌ Error processing generated post images:', error);
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
  async batchProcessPosts(posts: GeneratedPost[]): Promise<GeneratedPost[]> {
    console.log(`🔄 Batch processing ${posts.length} posts...`);
    
    const processedPosts = await Promise.all(
      posts.map(post => this.processGeneratedPost(post))
    );

    const totalUploaded = processedPosts.reduce((sum, post) => 
      sum + (post.metadata?.imagesUploaded || 0), 0
    );

    console.log(`✅ Batch processing complete: ${totalUploaded} total images uploaded`);
    
    return processedPosts;
  }
}

// Export singleton instance
export const generatedPostStorageService = new GeneratedPostStorageService();

// Export utility functions
export const processGeneratedPost = (post: GeneratedPost) => 
  generatedPostStorageService.processGeneratedPost(post);

export const batchProcessPosts = (posts: GeneratedPost[]) =>
  generatedPostStorageService.batchProcessPosts(posts);
