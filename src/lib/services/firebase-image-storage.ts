/**
 * Enhanced Firebase Image Storage Service
 * Handles image uploads with proper error handling and public access
 */

import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { GeneratedPost } from '@/lib/types';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

export class FirebaseImageStorageService {
  
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
   * Upload image data URL to Firebase Storage with public access
   */
  async uploadImageDataUrl(
    dataUrl: string,
    userId: string,
    postId: string,
    imageType: 'main' | 'variant' | 'content' = 'main'
  ): Promise<ImageUploadResult> {
    try {
      console.log(`🔄 Uploading ${imageType} image to Firebase Storage...`);

      // Generate filename with timestamp
      const timestamp = Date.now();
      const filename = `post-${postId}-${imageType}-${timestamp}.png`;
      
      // Convert data URL to File
      const file = this.dataUrlToFile(dataUrl, filename);
      console.log(`📁 File size: ${(file.size / 1024).toFixed(2)} KB`);

      // Create storage reference in generated-content folder
      const storagePath = `generated-content/${userId}/${filename}`;
      const storageRef = ref(storage, storagePath);

      // Upload file to Firebase Storage
      console.log(`📤 Uploading to: ${storagePath}`);
      const snapshot = await uploadBytes(storageRef, file);
      console.log('✅ File uploaded successfully');

      // Get download URL (this will be publicly accessible due to our rules)
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 Download URL generated:', downloadURL.substring(0, 100) + '...');

      return {
        success: true,
        url: downloadURL,
        fileId: snapshot.ref.fullPath,
      };

    } catch (error) {
      console.error(`❌ Firebase upload error for ${imageType} image:`, error);
      
      // Provide specific error messages
      let errorMessage = 'Unknown upload error';
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized')) {
          errorMessage = 'Firebase Storage rules not deployed. Please deploy the updated rules.';
        } else if (error.message.includes('storage/quota-exceeded')) {
          errorMessage = 'Firebase Storage quota exceeded. Please upgrade your plan.';
        } else if (error.message.includes('storage/invalid-format')) {
          errorMessage = 'Invalid image format. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process a generated post and upload all images to Firebase Storage
   */
  async processGeneratedPost(post: GeneratedPost, userId: string): Promise<GeneratedPost> {
    console.log('🔄 Processing generated post images for Firebase Storage...');
    
    let processedPost = { ...post };
    let uploadCount = 0;
    let successCount = 0;

    // Process main image
    if (post.imageUrl && post.imageUrl.startsWith('data:')) {
      uploadCount++;
      console.log('📤 Uploading main image...');
      
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
        // Keep original data URL as fallback
      }
    }

    // Process content image URL
    if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:')) {
      uploadCount++;
      console.log('📤 Uploading content image...');
      
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
        // Keep original data URL as fallback
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
              return variant; // Keep original data URL as fallback
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
      storageType: 'firebase-storage',
      uploadSuccess: successCount === uploadCount
    };

    console.log(`✅ Firebase processing complete: ${successCount}/${uploadCount} images uploaded`);

    return processedPost;
  }

  /**
   * Test Firebase Storage connection and rules
   */
  async testConnection(userId: string): Promise<{
    success: boolean;
    canUpload: boolean;
    canRead: boolean;
    error?: string;
  }> {
    try {
      console.log('🧪 Testing Firebase Storage connection...');
      
      // Create test data
      const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const testFilename = `test-${Date.now()}.png`;
      
      // Test upload
      const uploadResult = await this.uploadImageDataUrl(testData, userId, 'test', 'main');
      
      if (uploadResult.success && uploadResult.url) {
        console.log('✅ Firebase Storage test successful');
        
        // Test if URL is accessible (public read)
        try {
          const response = await fetch(uploadResult.url);
          const canRead = response.ok;
          
          return {
            success: true,
            canUpload: true,
            canRead,
          };
        } catch (readError) {
          return {
            success: true,
            canUpload: true,
            canRead: false,
            error: 'Upload works but images may not be publicly readable'
          };
        }
      } else {
        return {
          success: false,
          canUpload: false,
          canRead: false,
          error: uploadResult.error
        };
      }
    } catch (error) {
      console.error('❌ Firebase Storage test failed:', error);
      return {
        success: false,
        canUpload: false,
        canRead: false,
        error: error instanceof Error ? error.message : 'Unknown test error'
      };
    }
  }
}

// Export singleton instance
export const firebaseImageStorage = new FirebaseImageStorageService();
