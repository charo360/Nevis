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
  /**
   * Safely parse JSON string, return null if invalid
   */
  private safeJsonParse(jsonString: string): any {
    try {
      // Handle common invalid cases
      if (!jsonString || jsonString === 'Not specified' || jsonString === 'null' || jsonString === 'undefined') {
        return null;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('🔧 [BrandProfileSupabaseService] Invalid JSON:', jsonString);
      return null;
    }
  }

  // Convert database row to CompleteBrandProfile
  public rowToProfile(row: BrandProfileRow): CompleteBrandProfile {

    const profile: CompleteBrandProfile = {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      businessType: row.business_type,
      description: row.description,

      // Extract location fields - handle both object and string formats with safe JSON parsing
      location: typeof row.location === 'string' ?
        (this.safeJsonParse(row.location)?.country || '') :
        (row.location?.country || ''),
      city: typeof row.location === 'string' ?
        (this.safeJsonParse(row.location)?.city || '') :
        (row.location?.city || ''),
      contactAddress: typeof row.location === 'string' ?
        (this.safeJsonParse(row.location)?.address || '') :
        (row.location?.address || ''),

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
      logoDataUrl: row.logo_data_url || row.logo_url, // Use logo_url as fallback for logoDataUrl

      designExamples: row.design_examples || [],
      targetAudience: row.target_audience || '',
      brandVoice: row.brand_voice || '',

      // Services: normalize to an array of objects with name/description
      services: (() => {
        // Handle different data types more robustly
        let servicesArray = [];
        if (Array.isArray(row.services)) {
          servicesArray = row.services;
        } else if (row.services && typeof row.services === 'object') {
          // If it's an object, try to convert to array
          servicesArray = Object.values(row.services);
        } else if (typeof row.services === 'string') {
          // If it's a string, try to parse it
          try {
            servicesArray = JSON.parse(row.services);
          } catch (e) {
            servicesArray = [];
          }
        }

        if (!Array.isArray(servicesArray)) {
          return [];
        }

        return servicesArray
          .map((s: any) => {
            if (!s) return null;
            if (typeof s === 'string') return { name: s, description: '' };
            return { name: s.name || '', description: s.description || '' };
          })
          .filter((s: any) => s && s.name);
      })(),
      keyFeatures: '', // Not stored in DB, keep empty for compatibility
      competitiveAdvantages: '', // Not stored in DB, keep empty for compatibility

      // Visual style fields - extract from brand_voice JSON
      visualStyle: row.brand_voice?.visualStyle || '',
      writingTone: row.brand_voice?.writingTone || '',
      contentThemes: row.brand_voice?.contentThemes || [],

      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };

    return profile;
  }

  // Convert CompleteBrandProfile to database row
  private profileToRow(profile: Omit<CompleteBrandProfile, 'id' | 'createdAt' | 'updatedAt'>): Omit<BrandProfileRow, 'id' | 'created_at' | 'updated_at'> {

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

      // Services: accept array of objects or strings and normalize to array of objects
      services:
        Array.isArray((profile as any).services)
          ? (profile as any).services
            .map((s: any) => {
              if (!s) return null;
              if (typeof s === 'string') return { name: s.trim(), description: '' };
              return { name: (s.name || '').toString().trim(), description: (s.description || '').toString() };
            })
            .filter((s: any) => s && s.name)
          : (typeof (profile as any).services === 'string' && (profile as any).services.length > 0)
            ? (profile as any).services
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0)
              .map((s: string) => ({ name: s, description: '' }))
            : [],

      is_active: profile.isActive ?? true,
    };

    return row;
  }

  // Save brand profile
  async saveBrandProfile(profile: CompleteBrandProfile): Promise<string> {
    try {

      if (profile.id) {
        // Update existing profile - but first verify it exists
        const { data: existingProfile } = await supabase
          .from('brand_profiles')
          .select('id')
          .eq('id', profile.id)
          .single();

        if (!existingProfile) {
          console.warn('⚠️ Profile ID provided but profile does not exist, creating new profile instead');
          // Remove the invalid ID and create new profile
          const profileWithoutId = { ...profile };
          delete profileWithoutId.id;
          return this.saveBrandProfile(profileWithoutId);
        }

        const { error } = await supabase
          .from('brand_profiles')
          .update(this.profileToRow(profile))
          .eq('id', profile.id);

        if (error) {
          console.error('❌ Supabase update error:', error);
          throw new Error(`Failed to update brand profile: ${error.message}`);
        }

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

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to load brand profile: ${error.message}`);
      }

      return this.rowToProfile(data);
    } catch (error) {
      console.error('❌ Error loading brand profile:', error);
      return null;
    }
  }

  // Load all brand profiles for a user
  async loadBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {

      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase select error:', error);
        throw new Error(`Failed to load brand profiles: ${error.message}`);
      }

      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error loading brand profiles:', error);
      return [];
    }
  }

  // Load active brand profiles for a user
  async loadActiveBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {

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

      return data.map(row => this.rowToProfile(row));
    } catch (error) {
      console.error('❌ Error loading active brand profiles:', error);
      return [];
    }
  }

  // Update brand profile
  async updateBrandProfile(profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> {
    try {

      // Convert partial updates to row format - only include fields that exist in the database
      const rowUpdates: any = {};

      // Basic fields that exist in the database
      if (updates.businessName !== undefined) rowUpdates.business_name = updates.businessName;
      if (updates.businessType !== undefined) rowUpdates.business_type = updates.businessType;
      if (updates.description !== undefined) rowUpdates.description = updates.description;
      if (updates.logoUrl !== undefined) rowUpdates.logo_url = updates.logoUrl;
      if (updates.logoDataUrl !== undefined) rowUpdates.logo_data_url = updates.logoDataUrl;
      if (updates.isActive !== undefined) rowUpdates.is_active = updates.isActive;

      // Handle nested object updates: colors - ensure proper field mapping
      if (updates.primaryColor !== undefined || updates.accentColor !== undefined || updates.backgroundColor !== undefined) {
        // Get existing colors to preserve values not being updated
        const existingColors = rowUpdates.brand_colors || {};
        rowUpdates.brand_colors = {
          primary: updates.primaryColor !== undefined ? updates.primaryColor : existingColors.primary,
          accent: updates.accentColor !== undefined ? updates.accentColor : existingColors.accent,
          secondary: updates.backgroundColor !== undefined ? updates.backgroundColor : existingColors.secondary
        };

        console.log('🎨 [Brand Profile Service] Color update mapping:', {
          inputPrimaryColor: updates.primaryColor,
          inputAccentColor: updates.accentColor,
          inputBackgroundColor: updates.backgroundColor,
          finalBrandColors: rowUpdates.brand_colors
        });
      }

      // Handle location string (store as {country,city,address} minimal)
      if (updates.location !== undefined || updates.city !== undefined || updates.contactAddress !== undefined) {
        const country = (updates.location as any) || undefined;
        rowUpdates.location = {
          country: country ?? undefined,
          city: updates.city ?? undefined,
          address: updates.contactAddress ?? undefined
        };
      }

      // Handle contact (including website URL)
      if (updates.contactEmail !== undefined || updates.contactPhone !== undefined || updates.contactAddress !== undefined || updates.websiteUrl !== undefined) {
        rowUpdates.contact = {
          ...(rowUpdates.contact || {}),
          email: updates.contactEmail ?? undefined,
          phone: updates.contactPhone ?? undefined,
          address: updates.contactAddress ?? undefined,
          website: updates.websiteUrl ?? undefined
        };
      }

      // Handle website URL directly (for backward compatibility)
      if (updates.websiteUrl !== undefined) {
        rowUpdates.website_url = updates.websiteUrl;
      }

      // Handle social media
      if (updates.facebookUrl !== undefined || updates.instagramUrl !== undefined || updates.twitterUrl !== undefined || updates.linkedinUrl !== undefined) {
        rowUpdates.social_media = {
          facebook: updates.facebookUrl ?? undefined,
          instagram: updates.instagramUrl ?? undefined,
          twitter: updates.twitterUrl ?? undefined,
          linkedin: updates.linkedinUrl ?? undefined,
        };
      }

      // Handle services array
      if (updates.services !== undefined) {
        rowUpdates.services = Array.isArray(updates.services)
          ? updates.services.map((s: any) => {
            if (!s) return null;
            if (typeof s === 'string') return { name: s, description: '' };
            return { name: s.name || '', description: s.description || '' };
          }).filter((s: any) => s && s.name)
          : [];
      }

      // Handle design examples array
      if (updates.designExamples !== undefined) {
        rowUpdates.design_examples = Array.isArray(updates.designExamples) ? updates.designExamples : [];
      }

      // Remove duplicate brand colors handling - already handled above with correct field names

      // Handle identity and other fields - only update fields that exist in the database
      if (updates.visualStyle !== undefined) rowUpdates.brand_voice = { ...(rowUpdates.brand_voice || {}), visualStyle: updates.visualStyle };
      if (updates.writingTone !== undefined) rowUpdates.brand_voice = { ...(rowUpdates.brand_voice || {}), writingTone: updates.writingTone };
      if (updates.contentThemes !== undefined) rowUpdates.brand_voice = { ...(rowUpdates.brand_voice || {}), contentThemes: updates.contentThemes };
      if (updates.targetAudience !== undefined) rowUpdates.target_audience = updates.targetAudience;
      // Note: keyFeatures and competitiveAdvantages fields removed as they don't exist in the database schema

      const { error } = await supabase
        .from('brand_profiles')
        .update(rowUpdates)
        .eq('id', profileId);

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Failed to update brand profile: ${error.message}`);
      }

      // Force refresh of brand context after successful update
      console.log('✅ Brand profile updated successfully, triggering context refresh');

    } catch (error) {
      console.error('❌ Error updating brand profile:', error);
      throw error;
    }
  }

  // Delete brand profile
  async deleteBrandProfile(profileId: string): Promise<void> {
    try {

      const { error } = await supabase
        .from('brand_profiles')
        .delete()
        .eq('id', profileId);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw new Error(`Failed to delete brand profile: ${error.message}`);
      }

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