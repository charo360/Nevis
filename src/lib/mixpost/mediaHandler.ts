/**
 * Mixpost Media Handler
 * Handles image/video upload and processing for Mixpost
 */

import { getMixpostClient, MixpostMedia } from './client';

export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  url?: string;
  error?: string;
}

export interface ProcessedMedia {
  originalUrl: string;
  processedUrl: string;
  mimeType: string;
  size: number;
  dimensions?: { width: number; height: number };
}

/**
 * Upload a single image to Mixpost
 */
export async function uploadImage(
  workspaceId: string,
  imageData: string, // Base64 data URL or HTTP URL
  filename?: string
): Promise<MediaUploadResult> {
  console.log(`📤 [MediaHandler] Uploading image to workspace ${workspaceId}`);

  try {
    const client = getMixpostClient();
    
    if (!client.isConfigured()) {
      return {
        success: false,
        error: 'Mixpost is not configured',
      };
    }

    // Process the image data
    const processedData = await processImageData(imageData);
    
    const media = await client.uploadMedia(
      workspaceId,
      processedData.base64,
      filename || `revo-image-${Date.now()}.${processedData.extension}`
    );

    console.log(`✅ [MediaHandler] Image uploaded: ${media.id}`);
    
    return {
      success: true,
      mediaId: media.id,
      url: media.url,
    };
  } catch (error) {
    console.error(`❌ [MediaHandler] Upload failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple images in batch
 */
export async function uploadBatch(
  workspaceId: string,
  images: { data: string; filename?: string }[]
): Promise<MediaUploadResult[]> {
  console.log(`📤 [MediaHandler] Batch uploading ${images.length} images`);

  const results: MediaUploadResult[] = [];

  for (const image of images) {
    const result = await uploadImage(workspaceId, image.data, image.filename);
    results.push(result);
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`✅ [MediaHandler] Batch complete: ${successCount}/${images.length} successful`);

  return results;
}

/**
 * Process image data for upload
 * Handles both base64 data URLs and HTTP URLs
 */
async function processImageData(imageData: string): Promise<{
  base64: string;
  mimeType: string;
  extension: string;
}> {
  // If it's already a data URL
  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const base64 = matches[2];
      const extension = mimeType.split('/')[1] || 'png';
      
      return { base64, mimeType, extension };
    }
  }

  // If it's an HTTP URL, fetch and convert
  if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
    const response = await fetch(imageData);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    
    return { base64, mimeType, extension };
  }

  // Assume it's raw base64
  return {
    base64: imageData,
    mimeType: 'image/png',
    extension: 'png',
  };
}

/**
 * Validate image for social media requirements
 */
export function validateImageForPlatform(
  imageData: string,
  platform: string
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Platform-specific requirements
  const requirements: Record<string, {
    maxSizeMB: number;
    minWidth: number;
    minHeight: number;
    aspectRatios: string[];
  }> = {
    instagram: {
      maxSizeMB: 8,
      minWidth: 320,
      minHeight: 320,
      aspectRatios: ['1:1', '4:5', '1.91:1'],
    },
    facebook: {
      maxSizeMB: 4,
      minWidth: 200,
      minHeight: 200,
      aspectRatios: ['1:1', '1.91:1', '4:5', '2:3', '9:16'],
    },
    twitter: {
      maxSizeMB: 5,
      minWidth: 600,
      minHeight: 335,
      aspectRatios: ['16:9', '1:1'],
    },
    linkedin: {
      maxSizeMB: 5,
      minWidth: 400,
      minHeight: 400,
      aspectRatios: ['1:1', '1.91:1', '4:5'],
    },
  };

  const req = requirements[platform] || requirements.instagram;

  // Check file size (estimate from base64)
  if (imageData.startsWith('data:')) {
    const base64Part = imageData.split(',')[1] || '';
    const sizeBytes = (base64Part.length * 3) / 4;
    const sizeMB = sizeBytes / (1024 * 1024);
    
    if (sizeMB > req.maxSizeMB) {
      issues.push(`Image size (${sizeMB.toFixed(1)}MB) exceeds ${platform} limit (${req.maxSizeMB}MB)`);
    }
  }

  // TODO: Add dimension validation when we have image processing library

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Optimize image for a specific platform
 * (Placeholder for future image processing)
 */
export async function optimizeForPlatform(
  imageData: string,
  platform: string
): Promise<string> {
  // TODO: Implement actual image optimization
  // - Resize to optimal dimensions
  // - Compress if too large
  // - Convert format if needed
  
  console.log(`🔧 [MediaHandler] Optimizing image for ${platform}`);
  
  // For now, return as-is
  return imageData;
}

/**
 * Get media library for a workspace
 */
export async function getMediaLibrary(workspaceId: string): Promise<MixpostMedia[]> {
  const client = getMixpostClient();
  
  if (!client.isConfigured()) {
    return [];
  }

  return client.getMedia(workspaceId);
}

export default {
  uploadImage,
  uploadBatch,
  validateImageForPlatform,
  optimizeForPlatform,
  getMediaLibrary,
};
