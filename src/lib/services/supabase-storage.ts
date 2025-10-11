/**
 * Supabase Storage Service
 * Provides large storage capacity for images and files
 * Works alongside MongoDB for metadata storage
 */

import { createClient } from '@/lib/supabase-client';

export interface SupabaseUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export class SupabaseStorageService {
  private readonly bucketName = 'nevis-storage';

  /**
   * Check if Supabase storage is available
   */
  isAvailable(): boolean {
    return isSupabaseAvailable();
  }

  /**
   * Upload file to Supabase storage
   */
  async uploadFile(
    file: File | Buffer,
    path: string,
    options?: {
      contentType?: string;
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<SupabaseUploadResult> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          contentType: options?.contentType,
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        size: file instanceof File ? file.size : file.length,
        type: options?.contentType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
  }

  /**
   * Upload image with automatic optimization
   */
  async uploadImage(
    file: File | Buffer,
    folder: string = 'images',
    filename?: string
  ): Promise<SupabaseUploadResult> {
    const timestamp = Date.now();
    const finalFilename = filename || `image_${timestamp}`;
    const path = `${folder}/${finalFilename}`;

    return this.uploadFile(file, path, {
      contentType: file instanceof File ? file.type : 'image/png',
      cacheControl: '31536000' // 1 year cache
    });
  }

  /**
   * Upload brand logo
   */
  async uploadBrandLogo(
    file: File | Buffer,
    brandId: string,
    filename?: string
  ): Promise<SupabaseUploadResult> {
    const timestamp = Date.now();
    const finalFilename = filename || `logo_${timestamp}`;
    const path = `brands/${brandId}/logos/${finalFilename}`;

    return this.uploadFile(file, path, {
      contentType: file instanceof File ? file.type : 'image/png',
      cacheControl: '31536000'
    });
  }

  /**
   * Upload generated design
   */
  async uploadGeneratedDesign(
    file: File | Buffer,
    brandId: string,
    postId: string,
    filename?: string
  ): Promise<SupabaseUploadResult> {
    const timestamp = Date.now();
    const finalFilename = filename || `design_${timestamp}`;
    const path = `brands/${brandId}/designs/${postId}/${finalFilename}`;

    return this.uploadFile(file, path, {
      contentType: file instanceof File ? file.type : 'image/png',
      cacheControl: '31536000'
    });
  }

  /**
   * Delete file from storage
   */
  async deleteFile(path: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  getPublicUrl(path: string): string {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * List files in a folder
   */
  async listFiles(folder: string): Promise<any[]> {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .list(folder);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService();
