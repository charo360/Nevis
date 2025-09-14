// Supabase Brand Profile Service (replaces MongoDB service)
import { createClient } from '@supabase/supabase-js';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Database row type (matches Supabase table structure)
export interface BrandProfileRow {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  description?: string;
  location?: any;
  contact?: any;
  social_media?: any;
  brand_colors?: any;
  logo_url?: string;
  logo_data_url?: string;
  design_examples?: string[];
  target_audience?: string;
  brand_voice?: string;
  services?: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class BrandProfileSupabaseService {
  // Convert database row to CompleteBrandProfile
  private rowToProfile(row: BrandProfileRow): CompleteBrandProfile {
    console.log('🔄 Converting Supabase row to profile:', {
      businessName: row.business_name,
      hasLogoUrl: !!row.logo_url,
      hasLogoDataUrl: !!row.logo_data_url,
      logoUrlLength: row.logo_url?.length || 0,
      logoDataUrlLength: row.logo_data_url?.length || 0
    });

    const profile: CompleteBrandProfile = {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      businessType: row.business_type,
      description: row.description,
      
      // Extract location fields
      location: row.location?.country || '',
      city: row.location?.city || '',
      contactAddress: row.location?.address || '',
      
      // Extract contact fields
      contactEmail: row.contact?.email || '',
      contactPhone: row.contact?.phone || '',
      websiteUrl: row.contact?.website || '',
      
      // Extract social media fields
      facebookUrl: row.social_media?.facebook || '',
      instagramUrl: row.social_media?.instagram || '',
      twitterUrl: row.social_media?.twitter || '',
      linkedinUrl: row.social_media?.linkedin || '',
      
      // Extract brand colors
      primaryColor: row.brand_colors?.primary || '',
      accentColor: row.brand_colors?.accent || '',
      backgroundColor: row.brand_colors?.secondary || '',
      
      // Logo fields
      logoUrl: row.logo_url,
      logoDataUrl: row.logo_data_url,
      
      designExamples: row.design_examples || [],
      targetAudience: row.target_audience || '',
      brandVoice: row.brand_voice || '',
      
      // Services: normalize to an array of strings
      services: Array.isArray(row.services)
        ? row.services
            .map((s: any) => (typeof s === 'string' ? s : (s && s.name) || ''))
            .filter((s: string) => !!s)
        : [],
      keyFeatures: '', // Not stored in DB, keep empty for compatibility
      competitiveAdvantages: '', // Not stored in DB, keep empty for compatibility
      
      // Visual style fields (defaults for compatibility)
      visualStyle: '',
      writingTone: '',
      contentThemes: [],
      
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    console.log('✅ Profile conversion completed:', {
      businessName: profile.businessName,
      hasLogoUrl: !!profile.logoUrl,
      hasLogoDataUrl: !!profile.logoDataUrl,
      logoDataUrlPreview: profile.logoDataUrl ? profile.logoDataUrl.substring(0, 50) + '...' : 'None'
    });

    return profile;
  }

  // Convert CompleteBrandProfile to database row
  private profileToRow(profile: Omit<CompleteBrandProfile, 'id' | 'createdAt' | 'updatedAt'>): Omit<BrandProfileRow, 'id' | 'created_at' | 'updated_at'> {
    console.log('🔄 Converting profile to Supabase row:', {
      businessName: profile.businessName,
      hasLogoUrl: !!profile.logoUrl,
      hasLogoDataUrl: !!profile.logoDataUrl,
      logoUrlLength: profile.logoUrl?.length || 0,
      logoDataUrlLength: profile.logoDataUrl?.length || 0
    });

    const row = {
      user_id: profile.userId,
      business_name: profile.businessName,
      business_type: profile.businessType,
      description: profile.description,
      
      // Combine location fields
      location: {
        country: profile.location || '',
        city: profile.city || '',
        address: profile.contactAddress || ''
      },
      
      // Combine contact fields
      contact: {
        email: profile.contactEmail || '',
        phone: profile.contactPhone || '',
        website: profile.websiteUrl || ''
      },
      
      // Combine social media fields
      social_media: {
        facebook: profile.facebookUrl || '',
        instagram: profile.instagramUrl || '',
        twitter: profile.twitterUrl || '',
        linkedin: profile.linkedinUrl || ''
      },
      
      // Combine brand colors
      brand_colors: {
        primary: profile.primaryColor || '',
        accent: profile.accentColor || '',
        secondary: profile.backgroundColor || ''
      },
      
      // Logo fields
      logo_url: profile.logoUrl || '',
      logo_data_url: profile.logoDataUrl || '',
      
      design_examples: profile.designExamples || [],
      target_audience: profile.targetAudience || '',
      brand_voice: profile.brandVoice || '',
      
      // Services: accept string[] or comma-separated string, normalize to array of objects
      services:
        Array.isArray((profile as any).services)
          ? (profile as any).services
              .map((s: any) => (typeof s === 'string' ? s.trim() : s))
              .filter((s: any) => typeof s === 'string' && s.length > 0)
              .map((s: string) => ({ name: s }))
          : (typeof (profile as any).services === 'string' && (profile as any).services.length > 0)
            ? (profile as any).services
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0)
                .map((s: string) => ({ name: s }))
            : [],
      
      is_active: profile.isActive ?? true,
    };

    console.log('✅ Row conversion completed:', {
      businessName: row.business_name,
      hasLogoUrl: !!row.logo_url,
      hasLogoDataUrl: !!row.logo_data_url,
      logoUrlPreview: row.logo_url ? row.logo_url.substring(0, 50) + '...' : 'None',
      logoDataUrlPreview: row.logo_data_url ? row.logo_data_url.substring(0, 50) + '...' : 'None'
    });

    return row;
  }

  // Save brand profile
  async saveBrandProfile(profile: CompleteBrandProfile): Promise<string> {
    try {
      console.log('💾 Saving brand profile to Supabase:', {
        businessName: profile.businessName,
        hasId: !!profile.id,
        hasLogoUrl: !!profile.logoUrl,
        hasLogoDataUrl: !!profile.logoDataUrl
      });

      if (profile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('brand_profiles')
          .update(this.profileToRow(profile))
          .eq('id', profile.id);

        if (error) {
          console.error('❌ Supabase update error:', error);
          throw new Error(`Failed to update brand profile: ${error.message}`);
        }

        console.log('✅ Brand profile updated successfully');
        return profile.id;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('brand_profiles')
          .insert(this.profileToRow(profile))
          .select('id')
          .single();

        if (error) {
          console.error('❌ Supabase insert error:', error);
          throw new Error(`Failed to create brand profile: ${error.message}`);
        }

        console.log('✅ Brand profile created successfully with ID:', data.id);
        return data.id;
      }
    } catch (error) {
      console.error('❌ Error saving brand profile:', error);
      throw error;
    }
  }

  // Load brand profile by ID
  async loadBrandProfile(profileId: string): Promise<CompleteBrandProfile | null> {
    try {
      console.log('🔍 Loading brand profile from Supabase:', profileId);

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ Brand profile not found');
          return null;
        }
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to load brand profile: ${error.message}`);
      }

      console.log('✅ Brand profile loaded successfully');
      return this.rowToProfile(data);
    } catch (error) {
      console.error('❌ Error loading brand profile:', error);
      return null;
    }
  }

  // Load all brand profiles for a user
  async loadBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {
      console.log('🔍 Loading brand profiles for user:', userId);

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to load brand profiles: ${error.message}`);
      }

      console.log('✅ Brand profiles loaded successfully:', data.length, 'profiles');
      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error loading brand profiles:', error);
      return [];
    }
  }

  // Load active brand profiles for a user
  async loadActiveBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {
      console.log('🔍 Loading active brand profiles for user:', userId);

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to load active brand profiles: ${error.message}`);
      }

      console.log('✅ Active brand profiles loaded successfully:', data.length, 'profiles');
      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error loading active brand profiles:', error);
      return [];
    }
  }

  // Update brand profile
  async updateBrandProfile(profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> {
    try {
      console.log('🔄 Updating brand profile:', profileId, Object.keys(updates));

      // Convert partial updates to row format
      const rowUpdates: any = {};

      if (updates.businessName !== undefined) rowUpdates.business_name = updates.businessName;
      if (updates.businessType !== undefined) rowUpdates.business_type = updates.businessType;
      if (updates.description !== undefined) rowUpdates.description = updates.description;
      if (updates.logoUrl !== undefined) rowUpdates.logo_url = updates.logoUrl;
      if (updates.logoDataUrl !== undefined) rowUpdates.logo_data_url = updates.logoDataUrl;
      if (updates.isActive !== undefined) rowUpdates.is_active = updates.isActive;
      
      // Handle nested object updates
      if (updates.primaryColor !== undefined || updates.accentColor !== undefined || updates.backgroundColor !== undefined) {
        rowUpdates.brand_colors = {
          primary: updates.primaryColor || '',
          accent: updates.accentColor || '',
          secondary: updates.backgroundColor || ''
        };
      }

      const { error } = await supabase
        .from('brand_profiles')
        .update(rowUpdates)
        .eq('id', profileId);

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Failed to update brand profile: ${error.message}`);
      }

      console.log('✅ Brand profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating brand profile:', error);
      throw error;
    }
  }

  // Delete brand profile
  async deleteBrandProfile(profileId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting brand profile:', profileId);

      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw new Error(`Failed to delete brand profile: ${error.message}`);
      }

      console.log('✅ Brand profile deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting brand profile:', error);
      throw error;
    }
  }

  // Set profile as active/inactive
  async setProfileActive(profileId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateBrandProfile(profileId, { isActive });
    } catch (error) {
      console.error('❌ Error setting profile active status:', error);
      throw error;
    }
  }

  // Get profile count for user
  async getProfileCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('brand_profiles')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Supabase count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Error getting profile count:', error);
      return 0;
    }
  }

  // Check if profile exists
  async profileExists(profileId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('brand_profiles')
        .select('id', { count: 'exact' })
        .eq('id', profileId);

      if (error) {
        console.error('❌ Supabase exists check error:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('❌ Error checking if profile exists:', error);
      return false;
    }
  }

  // Search profiles by business name
  async searchProfiles(userId: string, searchTerm: string): Promise<CompleteBrandProfile[]> {
    try {
      console.log('🔍 Searching profiles for:', searchTerm);

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .ilike('business_name', `%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase search error:', error);
        throw new Error(`Failed to search profiles: ${error.message}`);
      }

      console.log('✅ Search completed:', data.length, 'results');
      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error searching profiles:', error);
      return [];
    }
  }

  // Get profiles by business type
  async getProfilesByBusinessType(userId: string, businessType: string): Promise<CompleteBrandProfile[]> {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('business_type', businessType)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to get profiles by business type: ${error.message}`);
      }

      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error getting profiles by business type:', error);
      return [];
    }
  }
}

// Export singleton instance
export const brandProfileSupabaseService = new BrandProfileSupabaseService();

// Export functions that match the MongoDB service API for easy replacement
export async function saveBrandProfileSupabase(profile: CompleteBrandProfile): Promise<string> {
  return brandProfileSupabaseService.saveBrandProfile(profile);
}

export async function loadBrandProfileSupabase(profileId: string): Promise<CompleteBrandProfile | null> {
  return brandProfileSupabaseService.loadBrandProfile(profileId);
}

export async function loadBrandProfilesSupabase(userId: string): Promise<CompleteBrandProfile[]> {
  return brandProfileSupabaseService.loadBrandProfiles(userId);
}

export async function loadActiveBrandProfilesSupabase(userId: string): Promise<CompleteBrandProfile[]> {
  return brandProfileSupabaseService.loadActiveBrandProfiles(userId);
}

export async function updateBrandProfileSupabase(profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> {
  return brandProfileSupabaseService.updateBrandProfile(profileId, updates);
}

export async function deleteBrandProfileSupabase(profileId: string): Promise<void> {
  return brandProfileSupabaseService.deleteBrandProfile(profileId);
}