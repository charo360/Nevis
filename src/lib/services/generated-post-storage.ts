/**
 * Generated Post Storage Service
 * Handles persistent storage of generated post images to Firebase Storage
 */

import { uploadDataUrlAsImage } from '@/lib/firebase/storage-service';
import { testFirebaseStorageConnection, getFirebaseStorageStatus } from '@/lib/firebase/storage-test';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
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
  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Upload image to Firebase Storage following official documentation
   */
  async uploadImageToFirebaseStorage(
    dataUrl: string,
    userId: string,
    postId: string,
    imageType: 'main' | 'variant' = 'main'
  ): Promise<ImageUploadResult> {
    try {

      // Convert data URL to File
      const filename = `post-${postId}-${imageType}-${Date.now()}.png`;
      const file = this.dataUrlToFile(dataUrl, filename);


      // Create storage reference
      const storageRef = ref(storage, `generated-content/${userId}/${filename}`);

      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url: downloadURL
      };
    } catch (error) {

      // Log detailed error information
      if (error instanceof Error) {
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Test Firebase Storage connection and permissions
   */
  async testConnection(): Promise<ImageUploadResult> {
    try {

      const testResult = await testFirebaseStorageConnection();

      if (testResult.success) {
        return {
          success: true,
          url: 'test-connection-successful'
        };
      } else {

        return {
          success: false,
          error: `Connection test failed: ${testResult.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown connection test error'
      };
    }
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
        storageType: 'firebase'
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
