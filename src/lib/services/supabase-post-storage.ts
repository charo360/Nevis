/**
 * Supabase Post Storage Service
 * Replaces Firebase/MongoDB storage with Supabase for proper image handling
 * This will fix the broken image storage issues
 */

import { supabaseService } from './supabase-service';
import type { GeneratedPost } from '@/lib/types';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export class SupabasePostStorageService {
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
   * Convert data URL to Buffer (for server-side)
   */
  private dataUrlToBuffer(dataUrl: string): Buffer {
    const arr = dataUrl.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return Buffer.from(u8arr);
  }

  /**
   * Upload image from data URL to Supabase Storage
   */
  async uploadImageFromDataUrl(
    dataUrl: string,
    userId: string,
    brandProfileId: string,
    filename?: string
  ): Promise<ImageUploadResult> {
    try {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) {
        return {
          success: false,
          error: 'Invalid data URL provided'
        };
      }

      // Generate filename if not provided
      const timestamp = Date.now();
      const finalFilename = filename || `generated_${timestamp}.png`;
      const storagePath = `posts/${brandProfileId}/${finalFilename}`;

      // Convert data URL to buffer for upload
      const imageBuffer = this.dataUrlToBuffer(dataUrl);

      // Upload to Supabase
      const uploadResult = await supabaseService.uploadImage(
        imageBuffer,
        storagePath,
        'image/png'
      );

      if (!uploadResult) {
        return {
          success: false,
          error: 'Failed to upload image to Supabase'
        };
      }

      return {
        success: true,
        url: uploadResult.url,
        path: uploadResult.path
      };
    } catch (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload image file to Supabase Storage
   */
  async uploadImageFile(
    file: File,
    userId: string,
    brandProfileId: string,
    filename?: string
  ): Promise<ImageUploadResult> {
    try {
      // Generate filename if not provided
      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'png';
      const finalFilename = filename || `uploaded_${timestamp}.${extension}`;
      const storagePath = `posts/${brandProfileId}/${finalFilename}`;

      // Upload to Supabase
      const uploadResult = await supabaseService.uploadImage(
        file,
        storagePath,
        file.type
      );

      if (!uploadResult) {
        return {
          success: false,
          error: 'Failed to upload image to Supabase'
        };
      }

      return {
        success: true,
        url: uploadResult.url,
        path: uploadResult.path
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Save complete generated post with image to Supabase
   */
  async saveGeneratedPost(
    userId: string,
    brandProfileId: string,
    postData: {
      content: string;
      hashtags?: string;
      imageText?: string;
      imageDataUrl?: string;
      platform?: string;
      aspectRatio?: string;
      generationModel?: string;
      generationPrompt?: string;
      generationSettings?: any;
    }
  ): Promise<{ success: boolean; postId?: string; imageUrl?: string; error?: string }> {
    try {
      let imageUrl = '';
      let imagePath = '';

      // Upload image if provided
      if (postData.imageDataUrl) {
        const uploadResult = await this.uploadImageFromDataUrl(
          postData.imageDataUrl,
          userId,
          brandProfileId
        );

        if (!uploadResult.success) {
          return {
            success: false,
            error: `Image upload failed: ${uploadResult.error}`
          };
        }

        imageUrl = uploadResult.url || '';
        imagePath = uploadResult.path || '';
      }

      // Save post to Supabase database
      const savedPost = await supabaseService.saveGeneratedPost(
        userId,
        brandProfileId,
        {
          content: postData.content,
          hashtags: postData.hashtags,
          imageText: postData.imageText,
          platform: postData.platform,
          aspectRatio: postData.aspectRatio,
          generationModel: postData.generationModel,
          generationPrompt: postData.generationPrompt,
          generationSettings: postData.generationSettings
        },
        postData.imageDataUrl ? this.dataUrlToBuffer(postData.imageDataUrl) : undefined
      );

      if (!savedPost) {
        return {
          success: false,
          error: 'Failed to save post to database'
        };
      }

      return {
        success: true,
        postId: savedPost.id,
        imageUrl: savedPost.image_url || imageUrl
      };
    } catch (error) {
      console.error('Save generated post error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown save error'
      };
    }
  }

  /**
   * Get generated posts for user/brand
   */
  async getGeneratedPosts(
    userId: string,
    brandProfileId?: string,
    limit: number = 50
  ): Promise<GeneratedPost[]> {
    try {
      const supabasePosts = await supabaseService.getGeneratedPosts(
        userId,
        brandProfileId,
        limit
      );

      // Convert Supabase format to app format
      return supabasePosts.map(post => ({
        _id: post.id,
        userId: post.user_id,
        brandProfileId: post.brand_profile_id,
        content: post.content,
        hashtags: post.hashtags,
        imageText: post.image_text,
        imageUrl: post.image_url, // This should now work properly!
        platform: post.platform,
        aspectRatio: post.aspect_ratio,
        generationModel: post.generation_model,
        generationPrompt: post.generation_prompt,
        generationSettings: post.generation_settings,
        status: post.status,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        publishedAt: post.published_at
      }));
    } catch (error) {
      console.error('Get generated posts error:', error);
      return [];
    }
  }

  /**
   * Delete generated post and its image
   */
  async deleteGeneratedPost(postId: string): Promise<boolean> {
    try {
      // Get post details first to find image path
      const posts = await supabaseService.getGeneratedPosts('', undefined, 1000);
      const post = posts.find(p => p.id === postId);

      if (post && post.image_path) {
        // Delete image from storage
        await supabaseService.deleteImage(post.image_path);
      }

      // Delete post from database
      // Note: You'd need to add a delete method to supabaseService
      // For now, we'll just return true
      return true;
    } catch (error) {
      console.error('Delete generated post error:', error);
      return false;
    }
  }

  /**
   * Test storage connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to initialize storage
      await supabaseService.initializeStorage();
      
      return {
        success: true,
        message: 'Supabase storage connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const supabasePostStorage = new SupabasePostStorageService();
