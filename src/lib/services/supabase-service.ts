/**
 * Supabase Service - Complete Database and Storage Solution
 * Replaces MongoDB for data storage and fixes image storage issues
 */

import { createClient as createServerSupabase } from '@/lib/supabase-server';
import type { BrandProfile } from '@/lib/types';

export interface SupabaseBrandProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type?: string;
  location?: string;
  website_url?: string;
  description?: string;
  target_audience?: string;
  services?: string;
  logo_url?: string;
  logo_data?: any;
  brand_colors?: any;
  contact_info?: any;
  social_handles?: any;
  website_analysis?: any;
  brand_voice?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseGeneratedPost {
  id: string;
  user_id: string;
  brand_profile_id: string;
  content: string;
  hashtags?: string;
  image_text?: string;
  image_url?: string;
  image_path?: string;
  image_metadata?: any;
  platform?: string;
  aspect_ratio?: string;
  generation_model?: string;
  generation_prompt?: string;
  generation_settings?: any;
  status: string;
  engagement_metrics?: any;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export class SupabaseService {
  private readonly bucketName = 'nevis-storage';
  private initialized = false;

  /**
   * Initialize storage bucket if it doesn't exist
   */
  async initializeStorage(): Promise<void> {
    if (this.initialized) return;

    try {
      const supabase = await createServerSupabase();

      // Check if we have a real Supabase client (not mock)
      if (!supabase.storage || typeof (supabase.storage as any).listBuckets !== 'function') {
        console.warn('Supabase storage not available - using mock client');
        this.initialized = true;
        return;
      }

      // Check if bucket exists
      const { data: buckets } = await (supabase.storage as any).listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error } = await (supabase.storage as any).createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 52428800 // 50MB
        });

        if (error) {
          console.error('Failed to create storage bucket:', error);
        } else {
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  /**
   * Upload image to Supabase storage
   */
  async uploadImage(
    file: File | Buffer,
    path: string,
    contentType?: string
  ): Promise<{ url: string; path: string } | null> {
    try {
      const supabase = await createServerSupabase();

      const { data, error } = await (supabase.storage as any)
        .from(this.bucketName)
        .upload(path, file, {
          contentType: contentType || 'image/png',
          cacheControl: '31536000', // 1 year
          upsert: true
        });

      if (error) {
        console.error('Image upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = (supabase.storage as any)
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }

  /**
   * Save brand profile to Supabase
   */
  async saveBrandProfile(
    userId: string,
    brandProfile: Partial<BrandProfile>,
    logoFile?: File | Buffer
  ): Promise<SupabaseBrandProfile | null> {
    // Client will be created per-operation

    try {
      let logoUrl = brandProfile.logoUrl;
      let logoPath = '';

      // Upload logo if provided
      if (logoFile) {
        const timestamp = Date.now();
        const logoUploadPath = `brands/${userId}/logos/logo_${timestamp}.png`;
        const uploadResult = await this.uploadImage(logoFile, logoUploadPath);

        if (uploadResult) {
          logoUrl = uploadResult.url;
          logoPath = uploadResult.path;
        }
      }

      // Prepare data for Supabase
      const supabaseData = {
        user_id: userId,
        business_name: brandProfile.businessName || '',
        business_type: brandProfile.businessType,
        location: brandProfile.location,
        website_url: brandProfile.websiteUrl,
        description: brandProfile.description,
        target_audience: brandProfile.targetAudience,
        services: (brandProfile as any).services ?? brandProfile.services,
        logo_url: logoUrl,
        logo_data: logoPath ? { path: logoPath, uploaded_at: new Date().toISOString() } : null,
        brand_colors: (brandProfile as any).brandColors,
        contact_info: (brandProfile as any).contactInfo,
        social_handles: (brandProfile as any).socialHandles,
        website_analysis: (brandProfile as any).websiteAnalysis,
        brand_voice: (brandProfile as any).brandVoice,
        is_active: true
      };

      // Insert or update brand profile
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('brand_profiles')
        .upsert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error('Brand profile save error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Save brand profile error:', error);
      return null;
    }
  }

  /**
   * Get brand profiles for user
   */
  async getBrandProfiles(userId: string): Promise<SupabaseBrandProfile[]> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get brand profiles error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get brand profiles error:', error);
      return [];
    }
  }

  /**
   * Save generated post with image
   */
  async saveGeneratedPost(
    userId: string,
    brandProfileId: string,
    postData: {
      content: string;
      hashtags?: string;
      imageText?: string;
      platform?: string;
      aspectRatio?: string;
      generationModel?: string;
      generationPrompt?: string;
      generationSettings?: any;
    },
    imageFile?: File | Buffer
  ): Promise<SupabaseGeneratedPost | null> {
    try {
      let imageUrl = '';
      let imagePath = '';
      let imageMetadata = {};

      // Upload image if provided
      if (imageFile) {
        const timestamp = Date.now();
        const imageUploadPath = `posts/${brandProfileId}/${timestamp}.png`;
        const uploadResult = await this.uploadImage(imageFile, imageUploadPath);

        if (uploadResult) {
          imageUrl = uploadResult.url;
          imagePath = uploadResult.path;
          imageMetadata = {
            size: imageFile instanceof File ? imageFile.size : imageFile.length,
            type: imageFile instanceof File ? imageFile.type : 'image/png',
            uploaded_at: new Date().toISOString()
          };
        }
      }

      // Save post data
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('generated_posts')
        .insert({
          user_id: userId,
          brand_profile_id: brandProfileId,
          content: postData.content,
          hashtags: postData.hashtags,
          image_text: postData.imageText,
          image_url: imageUrl,
          image_path: imagePath,
          image_metadata: imageMetadata,
          platform: postData.platform,
          aspect_ratio: postData.aspectRatio,
          generation_model: postData.generationModel,
          generation_prompt: postData.generationPrompt,
          generation_settings: postData.generationSettings,
          status: 'generated'
        })
        .select()
        .single();

      if (error) {
        console.error('Save generated post error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Save generated post error:', error);
      return null;
    }
  }

  /**
   * Get generated posts for user/brand
   */
  async getGeneratedPosts(
    userId: string,
    brandProfileId?: string,
    limit: number = 50
  ): Promise<SupabaseGeneratedPost[]> {
    try {
      const supabase = await createServerSupabase();
      let query = supabase
        .from('generated_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (brandProfileId) {
        query = query.eq('brand_profile_id', brandProfileId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get generated posts error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get generated posts error:', error);
      return [];
    }
  }

  /**
   * Delete image from storage
   */
  async deleteImage(path: string): Promise<boolean> {
    try {
      const supabase = await createServerSupabase();

      const { error } = await (supabase.storage as any)
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('Delete image error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete image error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
