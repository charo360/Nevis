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
      console.log(`🔄 Uploading ${imageType} image to Firebase Storage...`);

      // Convert data URL to File
      const filename = `post-${postId}-${imageType}-${Date.now()}.png`;
      const file = this.dataUrlToFile(dataUrl, filename);

      console.log(`📁 File created: ${filename}, size: ${file.size} bytes`);

      // Create storage reference
      const storageRef = ref(storage, `generated-content/${userId}/${filename}`);
      console.log(`📍 Storage path: generated-content/${userId}/${filename}`);

      // Upload file to Firebase Storage
      console.log('📤 Starting upload...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ Upload completed:', snapshot.ref.fullPath);

      // Get download URL
      console.log('🔗 Getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL obtained:', downloadURL.substring(0, 100) + '...');

      return {
        success: true,
        url: downloadURL
      };
    } catch (error) {
      console.error(`❌ Failed to upload ${imageType} image to Firebase Storage:`, error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
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
      console.log('🧪 Testing Firebase Storage connection...');

      const testResult = await testFirebaseStorageConnection();

      if (testResult.success) {
        console.log('✅ Firebase Storage connection test passed');
        return {
          success: true,
          url: 'test-connection-successful'
        };
      } else {
        console.error('❌ Firebase Storage connection test failed:', testResult.error);
        console.log('📊 Firebase Storage status:', getFirebaseStorageStatus());

        return {
          success: false,
          error: `Connection test failed: ${testResult.error}`
        };
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
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
      console.log(`🔄 Uploading ${imageType} image for post ${postId}...`);

      // Use the new Firebase Storage upload method
      const result = await this.uploadImageToFirebaseStorage(dataUrl, userId, postId, imageType);

      if (result.success) {
        console.log(`✅ Successfully uploaded ${imageType} image:`, result.url?.substring(0, 100) + '...');
      } else {
        console.error(`❌ Failed to upload ${imageType} image:`, result.error);
      }

      return result;
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
  async processGeneratedPost(post: GeneratedPost, userId: string): Promise<GeneratedPost> {
    console.log('🔄 Processing generated post images for permanent storage...');
    console.log('👤 User ID:', userId);
    console.log('📄 Post ID:', post.id);

    const processedPost = { ...post };
    let uploadCount = 0;
    let successCount = 0;

    try {
      // Process main image
      if (post.imageUrl && post.imageUrl.startsWith('data:')) {
        uploadCount++;
        console.log('🖼️ Processing main image...');
        const result = await this.uploadImageDataUrl(post.imageUrl, userId, post.id, 'main');
        if (result.success && result.url) {
          processedPost.imageUrl = result.url;
          successCount++;
          console.log('✅ Main image uploaded successfully');
        } else {
          console.warn('⚠️ Main image upload failed, keeping original data URL:', result.error);
        }
      }

      // Process variant images
      if (post.variants && post.variants.length > 0) {
        console.log(`🖼️ Processing ${post.variants.length} variant images...`);
        const processedVariants = await Promise.all(
          post.variants.map(async (variant, index) => {
            if (variant.imageUrl && variant.imageUrl.startsWith('data:')) {
              uploadCount++;
              console.log(`🖼️ Processing variant ${index}...`);
              const result = await this.uploadImageDataUrl(
                variant.imageUrl,
                userId,
                post.id,
                `variant-${index}`
              );
              if (result.success && result.url) {
                successCount++;
                console.log(`✅ Variant ${index} uploaded successfully`);
                return { ...variant, imageUrl: result.url };
              } else {
                console.warn(`⚠️ Variant ${index} image upload failed, keeping original data URL:`, result.error);
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
  async batchProcessPosts(posts: GeneratedPost[], userId: string): Promise<GeneratedPost[]> {
    console.log(`🔄 Batch processing ${posts.length} posts for user ${userId}...`);

    const processedPosts = await Promise.all(
      posts.map(post => this.processGeneratedPost(post, userId))
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
export const processGeneratedPost = (post: GeneratedPost, userId: string) =>
  generatedPostStorageService.processGeneratedPost(post, userId);

export const batchProcessPosts = (posts: GeneratedPost[], userId: string) =>
  generatedPostStorageService.batchProcessPosts(posts, userId);
