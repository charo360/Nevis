/**
 * Improved Image Persistence Service
 * Ensures images are properly uploaded and stored
 */

import { supabaseService } from './supabase-service';
import type { GeneratedPost } from '@/lib/types';

export class ImprovedImagePersistence {
  /**
   * Process and upload all images in a generated post
   */
  async processPostImages(post: GeneratedPost, userId: string): Promise<GeneratedPost> {
    console.log('🖼️  Processing post images...', {
      hasMainImage: !!post.imageUrl,
      hasVariants: post.variants?.length || 0
    });

    const processedPost = { ...post };
    let uploadCount = 0;

    try {
      // 1. Process main image
      if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.startsWith('data:')) {
        console.log('📤 Uploading main image...');
        const result = await this.uploadDataUrl(
          post.imageUrl,
          userId,
          post.id || `temp_${Date.now()}`,
          'main'
        );

        if (result.success && result.url) {
          processedPost.imageUrl = result.url;
          uploadCount++;
          console.log('✅ Main image uploaded successfully');
        } else {
          console.error('❌ Main image upload failed:', result.error);
        }
      }

      // 2. Process variant images
      if (post.variants && post.variants.length > 0) {
        const processedVariants = [];

        for (let i = 0; i < post.variants.length; i++) {
          const variant = post.variants[i];

          if (variant.imageUrl && typeof variant.imageUrl === 'string' && variant.imageUrl.startsWith('data:')) {
            console.log(`📤 Uploading variant ${i + 1} image...`);
            const result = await this.uploadDataUrl(
              variant.imageUrl,
              userId,
              post.id || `temp_${Date.now()}`,
              `variant_${i}`
            );

            if (result.success && result.url) {
              processedVariants.push({
                ...variant,
                imageUrl: result.url
              });
              uploadCount++;
              console.log(`✅ Variant ${i + 1} image uploaded successfully`);
            } else {
              console.error(`❌ Variant ${i + 1} image upload failed:`, result.error);
              processedVariants.push(variant);
            }
          } else {
            processedVariants.push(variant);
          }
        }

        processedPost.variants = processedVariants;
      }

      // 3. Set fallback main image from first variant if needed
      if (!processedPost.imageUrl && processedPost.variants?.length > 0) {
        const firstVariantWithImage = processedPost.variants.find(v => v.imageUrl && typeof v.imageUrl === 'string' && !v.imageUrl.startsWith('data:'));
        if (firstVariantWithImage) {
          processedPost.imageUrl = firstVariantWithImage.imageUrl;
          console.log('🔄 Set main image from first variant');
        }
      }

      console.log(`✅ Image processing complete: ${uploadCount} images uploaded`);
      return processedPost;

    } catch (error) {
      console.error('❌ Image processing failed:', error);
      return post; // Return original post if processing fails
    }
  }

  /**
   * Upload data URL to Supabase Storage
   */
  private async uploadDataUrl(
    dataUrl: string,
    userId: string,
    postId: string,
    type: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Convert data URL to buffer
      const base64Data = dataUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `post-${postId}-${type}-${timestamp}.png`;
      const path = `generated-content/${userId}/${filename}`;

      // Upload to Supabase
      const result = await supabaseService.uploadImage(buffer, path, 'image/png');

      if (result) {
        return { success: true, url: result.url };
      } else {
        return { success: false, error: 'Upload failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate that all images in a post are properly uploaded
   */
  validatePostImages(post: GeneratedPost): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check main image
    if (post.imageUrl) {
      if (typeof post.imageUrl === 'string' && post.imageUrl.startsWith('data:')) {
        issues.push('Main image is a temporary data URL');
        recommendations.push('Upload main image to permanent storage');
      }
    } else {
      issues.push('No main image URL found');
      recommendations.push('Ensure image generation and upload completed successfully');
    }

    // Check variants
    if (post.variants) {
      post.variants.forEach((variant, index) => {
        if (variant.imageUrl && typeof variant.imageUrl === 'string' && variant.imageUrl.startsWith('data:')) {
          issues.push(`Variant ${index + 1} has temporary data URL`);
          recommendations.push(`Upload variant ${index + 1} image to permanent storage`);
        }
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }
}

export const improvedImagePersistence = new ImprovedImagePersistence();
