/**
 * Creative Assets Service
 * Manages user-uploaded assets for Creative Studio
 * Provides persistent storage and reusability
 */

import { supabaseService } from './supabase-service';
import { createClient } from '@/lib/supabase-client';

export interface CreativeAsset {
  id: string;
  user_id: string;
  brand_profile_id?: string;
  asset_type: 'logo' | 'product' | 'background' | 'template' | 'other';
  filename: string;
  file_url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  category?: string;
  description?: string;
  usage_count: number;
  last_used_at?: string;
  width?: number;
  height?: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadAssetParams {
  file: File | Buffer;
  userId: string;
  brandProfileId?: string;
  assetType: CreativeAsset['asset_type'];
  tags?: string[];
  category?: string;
  description?: string;
  filename?: string;
}

export interface AssetFilters {
  assetType?: CreativeAsset['asset_type'];
  tags?: string[];
  category?: string;
  searchQuery?: string;
  brandProfileId?: string;
}

export class CreativeAssetsService {
  private supabase = createClient();

  constructor() {
    console.log('🚀 [CreativeAssetsService] v1.2 Initialized');
    
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'REPLACE_WITH_REAL_ANON_KEY_FROM_SUPABASE_DASHBOARD') {
      console.warn('⚠️ [CreativeAssetsService] Supabase not configured - Asset library features will be limited');
      console.warn('📝 To enable asset library:');
      console.warn('1. Go to: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv');
      console.warn('2. Navigate to Settings → API');
      console.warn('3. Copy the "Project URL" and "anon public" key');
      console.warn('4. Add to .env.local:');
      console.warn('   NEXT_PUBLIC_SUPABASE_URL=your_project_url');
      console.warn('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    } else {
      console.log('✅ [CreativeAssetsService] Supabase configured:', {
        url: supabaseUrl.substring(0, 30) + '...',
        hasAnonKey: true
      });
    }
  }

  /**
   * Upload a new asset
   */
  async uploadAsset(params: UploadAssetParams): Promise<CreativeAsset | null> {
    try {
      const {
        file,
        userId,
        brandProfileId,
        assetType,
        tags = [],
        category,
        description,
        filename
      } = params;

      // Generate filename if not provided
      const timestamp = Date.now();
      const extension = file instanceof File ? file.name.split('.').pop() : 'png';
      const finalFilename = filename || `${assetType}_${timestamp}.${extension}`;
      
      // Upload to Supabase storage
      const storagePath = `assets/${userId}/${brandProfileId || 'general'}/${assetType}/${finalFilename}`;
      
      const uploadResult = await supabaseService.uploadImage(
        file,
        storagePath,
        file instanceof File ? file.type : 'image/png'
      );

      if (!uploadResult) {
        throw new Error('Failed to upload asset to storage');
      }

      // Get file size and mime type from original file
      const fileSize = file instanceof File ? file.size : file.length;
      const mimeType = file instanceof File ? file.type : 'image/png';

      // Get image dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;
      
      if (file instanceof File && file.type.startsWith('image/')) {
        const dimensions = await this.getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Save metadata to database
      const { data, error } = await this.supabase
        .from('creative_assets')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          asset_type: assetType,
          filename: finalFilename,
          file_url: uploadResult.url,
          file_path: uploadResult.path,
          file_size: fileSize,
          mime_type: mimeType,
          tags,
          category,
          description,
          width,
          height,
          usage_count: 0
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [CreativeAssetsService] Failed to save asset metadata:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        });
        throw error;
      }

      console.log('✅ Asset uploaded successfully:', data.id);
      return data as CreativeAsset;
    } catch (error: any) {
      console.error('❌ [CreativeAssetsService] Asset upload FULL ERROR:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        fullError: JSON.stringify(error, null, 2)
      });
      return null;
    }
  }

  /**
   * Get user's assets with optional filters
   */
  async getAssets(
    userId: string,
    filters?: AssetFilters,
    limit: number = 50
  ): Promise<CreativeAsset[]> {
    console.log(`🔍 [CreativeAssetsService] getAssets for user: ${userId}`);
    try {
      let query = this.supabase
        .from('creative_assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters
      if (filters?.assetType) {
        query = query.eq('asset_type', filters.assetType);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.brandProfileId) {
        query = query.eq('brand_profile_id', filters.brandProfileId);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.searchQuery) {
        query = query.or(
          `filename.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [CreativeAssetsService] getAssets FULL ERROR:', JSON.stringify(error, null, 2));
        console.error('❌ [CreativeAssetsService] getAssets error message:', error.message);
        console.error('❌ [CreativeAssetsService] getAssets error code:', error.code);
        return [];
      }

      return (data as CreativeAsset[]) || [];
    } catch (error) {
      console.error('❌ Get assets error:', error);
      return [];
    }
  }

  /**
   * Get recently used assets
   */
  async getRecentAssets(userId: string, limit: number = 10): Promise<CreativeAsset[]> {
    console.log(`🔍 [CreativeAssetsService] getRecentAssets for user: ${userId}`);
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('user_id', userId)
        .not('last_used_at', 'is', null)
        .order('last_used_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [CreativeAssetsService] getRecentAssets FULL ERROR:', JSON.stringify(error, null, 2));
        console.error('❌ [CreativeAssetsService] getRecentAssets error message:', error.message);
        console.error('❌ [CreativeAssetsService] getRecentAssets error code:', error.code);
        return [];
      }

      return (data as CreativeAsset[]) || [];
    } catch (error) {
      console.error('❌ Get recent assets error:', error);
      return [];
    }
  }

  /**
   * Get most used assets
   */
  async getPopularAssets(userId: string, limit: number = 10): Promise<CreativeAsset[]> {
    console.log(`🔍 [CreativeAssetsService] getPopularAssets for user: ${userId}`);
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('user_id', userId)
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        // Check if it's a "Failed to fetch" error (Supabase not configured)
        if (error.message?.includes('Failed to fetch')) {
          console.warn('⚠️ [CreativeAssetsService] Supabase connection failed - Check configuration');
          return [];
        }
        
        console.error('❌ [CreativeAssetsService] getPopularAssets FULL ERROR:', JSON.stringify(error, null, 2));
        console.error('❌ [CreativeAssetsService] getPopularAssets error message:', error.message);
        console.error('❌ [CreativeAssetsService] getPopularAssets error code:', error.code);
        return [];
      }

      return (data as CreativeAsset[]) || [];
    } catch (error: any) {
      // Silently handle fetch errors if Supabase is not configured
      if (error?.message?.includes('Failed to fetch')) {
        console.warn('⚠️ [CreativeAssetsService] Supabase not available - Asset library disabled');
        return [];
      }
      console.error('❌ Get popular assets error:', error);
      return [];
    }
  }

  /**
   * Update asset usage (increment count and update last_used_at)
   */
  async trackAssetUsage(assetId: string): Promise<boolean> {
    try {
      // In Supabase, for atomic increments we usually use RPC, 
      // but for now we'll do a fetch-then-update or just a simple update if RPC isn't setup.
      // Since we don't have a specific RPC for this yet, we'll use a simple update.
      // Note: This is not perfectly atomic without RPC.
      const { data: asset } = await this.supabase
        .from('creative_assets')
        .select('usage_count')
        .eq('id', assetId)
        .single();

      const newCount = (asset?.usage_count || 0) + 1;

      const { error } = await this.supabase
        .from('creative_assets')
        .update({
          usage_count: newCount,
          last_used_at: new Date().toISOString()
        })
        .eq('id', assetId);

      if (error) {
        console.error('Failed to track asset usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Track usage error:', error);
      return false;
    }
  }

  /**
   * Update asset metadata
   */
  async updateAsset(
    assetId: string,
    updates: Partial<Pick<CreativeAsset, 'tags' | 'category' | 'description' | 'filename'>>
  ): Promise<CreativeAsset | null> {
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .update(updates)
        .eq('id', assetId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update asset:', error);
        return null;
      }

      return data as CreativeAsset;
    } catch (error) {
      console.error('❌ Update asset error:', error);
      return null;
    }
  }

  /**
   * Delete asset (removes from storage and database)
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      // Get asset details first
      const { data: asset, error: fetchError } = await this.supabase
        .from('creative_assets')
        .select('file_path')
        .eq('id', assetId)
        .single();

      if (fetchError || !asset) {
        console.error('Failed to fetch asset for deletion:', fetchError);
        return false;
      }

      // Delete from storage
      try {
        await supabaseService.deleteImage(asset.file_path);
      } catch (storageError) {
        console.warn('Failed to delete from storage (continuing):', storageError);
      }

      // Delete from database
      const { error: deleteError } = await this.supabase
        .from('creative_assets')
        .delete()
        .eq('id', assetId);

      if (deleteError) {
        console.error('Failed to delete asset from database:', deleteError);
        return false;
      }

      console.log('✅ Asset deleted successfully:', assetId);
      return true;
    } catch (error) {
      console.error('❌ Delete asset error:', error);
      return false;
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetById(assetId: string): Promise<CreativeAsset | null> {
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) {
        console.error('Failed to fetch asset:', error);
        return null;
      }

      return data as CreativeAsset;
    } catch (error) {
      console.error('❌ Get asset by ID error:', error);
      return null;
    }
  }

  /**
   * Get all unique tags for user's assets
   */
  async getUserTags(userId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .select('tags')
        .eq('user_id', userId);

      if (error || !data) {
        return [];
      }

      // Flatten and deduplicate tags
      const allTags = data.flatMap(item => ((item as any).tags as string[]) || []);
      return Array.from(new Set(allTags)).sort();
    } catch (error) {
      console.error('❌ Get user tags error:', error);
      return [];
    }
  }

  /**
   * Get storage statistics for user
   */
  async getStorageStats(userId: string): Promise<{
    totalAssets: number;
    totalSize: number;
    byType: Record<string, number>;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('creative_assets')
        .select('asset_type, file_size')
        .eq('user_id', userId);

      if (error || !data) {
        return { totalAssets: 0, totalSize: 0, byType: {} };
      }

      const totalAssets = data.length;
      const totalSize = data.reduce((sum, item) => sum + (item.file_size || 0), 0);
      
      const byType: Record<string, number> = {};
      data.forEach(item => {
        byType[item.asset_type] = (byType[item.asset_type] || 0) + 1;
      });

      return { totalAssets, totalSize, byType };
    } catch (error) {
      console.error('❌ Get storage stats error:', error);
      return { totalAssets: 0, totalSize: 0, byType: {} };
    }
  }

  /**
   * Helper: Get image dimensions from File
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }
}

// Export singleton instance
export const creativeAssetsService = new CreativeAssetsService();
