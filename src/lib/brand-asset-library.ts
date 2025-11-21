/**
 * Brand Asset Library Service
 * Manages logos, product images, and other visual assets extracted from e-commerce sites
 */

import { createClient } from '@/lib/supabase-client';
import { SupabaseStorageService } from './services/supabase-storage';

export type AssetType =
  | 'logo'
  | 'product_image'
  | 'hero_image'
  | 'banner'
  | 'icon'
  | 'favicon'
  | 'color_palette'
  | 'font'
  | 'other';

export type AssetSource =
  | 'ecommerce_scraper'
  | 'website_analysis'
  | 'manual_upload'
  | 'ai_generated';

export interface BrandAsset {
  id: string;
  userId: string;
  brandProfileId: string;
  name: string;
  type: AssetType;
  source: AssetSource;
  fileUrl: string;
  filePath: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandLibrary {
  logos: BrandAsset[];
  productImages: BrandAsset[];
  heroImages: BrandAsset[];
  banners: BrandAsset[];
  icons: BrandAsset[];
  colorPalettes: BrandAsset[];
  fonts: BrandAsset[];
  other: BrandAsset[];
}

export interface UploadAssetOptions {
  name?: string;
  type: AssetType;
  source?: AssetSource;
  metadata?: Record<string, any>;
  tags?: string[];
  isDefault?: boolean;
}

export interface SaveAssetFromUrlOptions {
  name: string;
  type: AssetType;
  source: AssetSource;
  originalUrl: string;
  metadata?: Record<string, any>;
  tags?: string[];
  width?: number;
  height?: number;
}

export class BrandAssetLibraryService {
  private static supabase = createClient();
  private static storage = new SupabaseStorageService();

  /**
   * Upload and store brand asset from File
   */
  static async uploadAsset(
    userId: string,
    brandProfileId: string,
    file: File,
    options: UploadAssetOptions
  ): Promise<BrandAsset> {
    try {
      // 1. Upload file to Supabase Storage
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      const folder = `brands/${brandProfileId}/assets/${options.type}`;

      const uploadResult = await this.storage.uploadImage(file, folder, filename);

      // 2. Store asset metadata in database
      const { data, error } = await this.supabase
        .from('brand_assets')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          name: options.name || file.name,
          type: options.type,
          source: options.source || 'manual_upload',
          file_url: uploadResult.url,
          file_path: uploadResult.path,
          file_size: uploadResult.size,
          mime_type: uploadResult.type,
          metadata: options.metadata || {},
          tags: options.tags || [],
          is_default: options.isDefault || false,
          is_active: true,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseAsset(data);
    } catch (error) {
      console.error('❌ Error uploading asset:', error);
      throw error;
    }
  }

  /**
   * Save asset from URL (for e-commerce scraper)
   */
  static async saveAssetFromUrl(
    userId: string,
    brandProfileId: string,
    imageUrl: string,
    options: SaveAssetFromUrlOptions
  ): Promise<BrandAsset> {
    try {
      // 1. Download image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Upload to Supabase Storage
      const timestamp = Date.now();
      const extension = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${timestamp}_${options.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${extension}`;
      const folder = `brands/${brandProfileId}/assets/${options.type}`;
      const path = `${folder}/${filename}`;

      const uploadResult = await this.storage.uploadFile(buffer, path, {
        contentType: blob.type || 'image/jpeg'
      });

      // 3. Store asset metadata in database
      const { data, error } = await this.supabase
        .from('brand_assets')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          name: options.name,
          type: options.type,
          source: options.source,
          file_url: uploadResult.url,
          file_path: uploadResult.path,
          file_size: uploadResult.size,
          mime_type: uploadResult.type,
          width: options.width,
          height: options.height,
          metadata: {
            ...options.metadata,
            originalUrl: options.originalUrl
          },
          tags: options.tags || [],
          is_default: false,
          is_active: true,
          usage_count: 0
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseAsset(data);
    } catch (error) {
      console.error('❌ Error saving asset from URL:', error);
      throw error;
    }
  }

  /**
   * Get all assets for a brand
   */
  static async getBrandLibrary(userId: string, brandProfileId: string): Promise<BrandLibrary> {
    try {
      const { data, error } = await this.supabase
        .from('brand_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('brand_profile_id', brandProfileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assets = (data || []).map(this.mapDatabaseAsset);

      return {
        logos: assets.filter(a => a.type === 'logo'),
        productImages: assets.filter(a => a.type === 'product_image'),
        heroImages: assets.filter(a => a.type === 'hero_image'),
        banners: assets.filter(a => a.type === 'banner'),
        icons: assets.filter(a => a.type === 'icon'),
        colorPalettes: assets.filter(a => a.type === 'color_palette'),
        fonts: assets.filter(a => a.type === 'font'),
        other: assets.filter(a => a.type === 'other')
      };
    } catch (error) {
      console.error('❌ Error getting brand library:', error);
      throw error;
    }
  }

  /**
   * Get assets by type
   */
  static async getAssetsByType(
    userId: string,
    brandProfileId: string,
    type: AssetType
  ): Promise<BrandAsset[]> {
    try {
      const { data, error } = await this.supabase
        .from('brand_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('brand_profile_id', brandProfileId)
        .eq('type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDatabaseAsset);
    } catch (error) {
      console.error('❌ Error getting assets by type:', error);
      throw error;
    }
  }

  /**
   * Get asset by ID
   */
  static async getAssetById(assetId: string): Promise<BrandAsset | null> {
    try {
      const { data, error } = await this.supabase
        .from('brand_assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (error) throw error;

      return data ? this.mapDatabaseAsset(data) : null;
    } catch (error) {
      console.error('❌ Error getting asset by ID:', error);
      return null;
    }
  }

  /**
   * Update asset metadata
   */
  static async updateAsset(
    assetId: string,
    updates: Partial<Pick<BrandAsset, 'name' | 'tags' | 'metadata' | 'isDefault' | 'isActive'>>
  ): Promise<BrandAsset> {
    try {
      const { data, error } = await this.supabase
        .from('brand_assets')
        .update({
          name: updates.name,
          tags: updates.tags,
          metadata: updates.metadata,
          is_default: updates.isDefault,
          is_active: updates.isActive
        })
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;

      return this.mapDatabaseAsset(data);
    } catch (error) {
      console.error('❌ Error updating asset:', error);
      throw error;
    }
  }

  /**
   * Delete asset
   */
  static async deleteAsset(assetId: string): Promise<void> {
    try {
      // Get asset to get file path
      const asset = await this.getAssetById(assetId);
      if (!asset) throw new Error('Asset not found');

      // Delete from storage
      await this.storage.deleteFile(asset.filePath);
      if (asset.thumbnailPath) {
        await this.storage.deleteFile(asset.thumbnailPath);
      }

      // Delete from database
      const { error } = await this.supabase
        .from('brand_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error deleting asset:', error);
      throw error;
    }
  }

  /**
   * Set asset as default for its type
   */
  static async setAsDefault(assetId: string, userId: string, brandProfileId: string): Promise<void> {
    try {
      // Get the asset to know its type
      const asset = await this.getAssetById(assetId);
      if (!asset) throw new Error('Asset not found');

      // Unset all other assets of the same type as default
      await this.supabase
        .from('brand_assets')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('brand_profile_id', brandProfileId)
        .eq('type', asset.type);

      // Set this asset as default
      await this.supabase
        .from('brand_assets')
        .update({ is_default: true })
        .eq('id', assetId);
    } catch (error) {
      console.error('❌ Error setting asset as default:', error);
      throw error;
    }
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(assetId: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_asset_usage', { asset_id: assetId });
    } catch (error) {
      console.error('❌ Error incrementing usage:', error);
      // Don't throw - usage tracking is not critical
    }
  }

  /**
   * Search assets by tags or name
   */
  static async searchAssets(
    userId: string,
    brandProfileId: string,
    query: string
  ): Promise<BrandAsset[]> {
    try {
      const { data, error } = await this.supabase
        .from('brand_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('brand_profile_id', brandProfileId)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.mapDatabaseAsset);
    } catch (error) {
      console.error('❌ Error searching assets:', error);
      throw error;
    }
  }

  /**
   * Map database row to BrandAsset interface
   */
  private static mapDatabaseAsset(data: any): BrandAsset {
    return {
      id: data.id,
      userId: data.user_id,
      brandProfileId: data.brand_profile_id,
      name: data.name,
      type: data.type,
      source: data.source,
      fileUrl: data.file_url,
      filePath: data.file_path,
      thumbnailUrl: data.thumbnail_url,
      thumbnailPath: data.thumbnail_path,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      width: data.width,
      height: data.height,
      metadata: data.metadata || {},
      tags: data.tags || [],
      isDefault: data.is_default,
      isActive: data.is_active,
      usageCount: data.usage_count,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
}