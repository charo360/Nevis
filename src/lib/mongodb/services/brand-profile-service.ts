// MongoDB Brand Profile Service (replaces Firebase brand profile service)
import { brandProfileService } from '../database';
import { BrandProfile } from '../schemas';
import type { BrandProfileDocument } from '../schemas';

// Brand profile interface (matching the existing interface)
export interface CompleteBrandProfile {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  description?: string;
  location?: {
    country: string;
    city: string;
    address?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
  };
  brandColors?: {
    primary: string;
    secondary?: string;
    accent?: string;
  };
  logoUrl?: string;
  designExamples?: string[];
  targetAudience?: string;
  brandVoice?: string;
  services?: Array<{
    name: string;
    description?: string;
    price?: number;
    currency?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class BrandProfileMongoService {
  // Convert MongoDB document to CompleteBrandProfile
  private documentToProfile(doc: BrandProfileDocument): CompleteBrandProfile {
    return {
      id: doc._id?.toString() || '',
      userId: doc.userId,
      businessName: doc.businessName,
      businessType: doc.businessType,
      description: doc.description,
      location: doc.location,
      contact: doc.contact,
      socialMedia: doc.socialMedia,
      brandColors: doc.brandColors,
      logoUrl: doc.logoUrl,
      designExamples: doc.designExamples,
      targetAudience: doc.targetAudience,
      brandVoice: doc.brandVoice,
      services: doc.services,
      isActive: doc.isActive,
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date,
    };
  }

  // Convert CompleteBrandProfile to MongoDB document data
  private profileToDocument(profile: Omit<CompleteBrandProfile, 'id' | 'createdAt' | 'updatedAt'>): Omit<BrandProfileDocument, '_id' | 'createdAt' | 'updatedAt'> {
    return {
      userId: profile.userId,
      businessName: profile.businessName,
      businessType: profile.businessType,
      description: profile.description,
      location: profile.location,
      contact: profile.contact,
      socialMedia: profile.socialMedia,
      brandColors: profile.brandColors,
      logoUrl: profile.logoUrl,
      designExamples: profile.designExamples,
      targetAudience: profile.targetAudience,
      brandVoice: profile.brandVoice,
      services: profile.services,
      isActive: profile.isActive,
    };
  }

  // Save brand profile
  async saveBrandProfile(profile: CompleteBrandProfile): Promise<string> {
    try {
      if (profile.id) {
        // Update existing profile
        const success = await brandProfileService.updateById(profile.id, this.profileToDocument(profile));
        if (!success) {
          throw new Error('Failed to update brand profile');
        }
        return profile.id;
      } else {
        // Create new profile
        const profileId = await brandProfileService.create(this.profileToDocument(profile));
        return profileId;
      }
    } catch (error) {
      console.error('Error saving brand profile:', error);
      throw error;
    }
  }

  // Load brand profile by ID
  async loadBrandProfile(profileId: string): Promise<CompleteBrandProfile | null> {
    try {
      const doc = await brandProfileService.getById(profileId);
      return doc ? this.documentToProfile(doc) : null;
    } catch (error) {
      console.error('Error loading brand profile:', error);
      return null;
    }
  }

  // Load all brand profiles for a user
  async loadBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {
      const docs = await brandProfileService.getByUserId(userId, {
        sort: { updatedAt: -1 }
      });
      return docs.map(doc => this.documentToProfile(doc));
    } catch (error) {
      console.error('Error loading brand profiles:', error);
      return [];
    }
  }

  // Load active brand profiles for a user
  async loadActiveBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    try {
      const docs = await brandProfileService.getAll(
        { userId, isActive: true },
        { sort: { updatedAt: -1 } }
      );
      return docs.map(doc => this.documentToProfile(doc));
    } catch (error) {
      console.error('Error loading active brand profiles:', error);
      return [];
    }
  }

  // Update brand profile
  async updateBrandProfile(profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> {
    try {
      const success = await brandProfileService.updateById(profileId, updates);
      if (!success) {
        throw new Error('Failed to update brand profile');
      }
    } catch (error) {
      console.error('Error updating brand profile:', error);
      throw error;
    }
  }

  // Delete brand profile
  async deleteBrandProfile(profileId: string): Promise<void> {
    try {
      const success = await brandProfileService.deleteById(profileId);
      if (!success) {
        throw new Error('Failed to delete brand profile');
      }
    } catch (error) {
      console.error('Error deleting brand profile:', error);
      throw error;
    }
  }

  // Set profile as active/inactive
  async setProfileActive(profileId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateBrandProfile(profileId, { isActive });
    } catch (error) {
      console.error('Error setting profile active status:', error);
      throw error;
    }
  }

  // Get profile count for user
  async getProfileCount(userId: string): Promise<number> {
    try {
      return await brandProfileService.count({ userId });
    } catch (error) {
      console.error('Error getting profile count:', error);
      return 0;
    }
  }

  // Check if profile exists
  async profileExists(profileId: string): Promise<boolean> {
    try {
      return await brandProfileService.exists({ _id: profileId });
    } catch (error) {
      console.error('Error checking if profile exists:', error);
      return false;
    }
  }

  // Search profiles by business name
  async searchProfiles(userId: string, searchTerm: string): Promise<CompleteBrandProfile[]> {
    try {
      const docs = await brandProfileService.getAll({
        userId,
        businessName: { $regex: searchTerm, $options: 'i' }
      });
      return docs.map(doc => this.documentToProfile(doc));
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  // Get profiles by business type
  async getProfilesByBusinessType(userId: string, businessType: string): Promise<CompleteBrandProfile[]> {
    try {
      const docs = await brandProfileService.getAll({
        userId,
        businessType
      });
      return docs.map(doc => this.documentToProfile(doc));
    } catch (error) {
      console.error('Error getting profiles by business type:', error);
      return [];
    }
  }
}

// Export singleton instance
export const brandProfileMongoService = new BrandProfileMongoService();

// Export functions that match the Firebase service API
export async function saveBrandProfileMongo(profile: CompleteBrandProfile): Promise<string> {
  return brandProfileMongoService.saveBrandProfile(profile);
}

export async function loadBrandProfileMongo(profileId: string): Promise<CompleteBrandProfile | null> {
  return brandProfileMongoService.loadBrandProfile(profileId);
}

export async function loadBrandProfilesMongo(userId: string): Promise<CompleteBrandProfile[]> {
  return brandProfileMongoService.loadBrandProfiles(userId);
}

export async function loadActiveBrandProfilesMongo(userId: string): Promise<CompleteBrandProfile[]> {
  return brandProfileMongoService.loadActiveBrandProfiles(userId);
}

export async function updateBrandProfileMongo(profileId: string, updates: Partial<CompleteBrandProfile>): Promise<void> {
  return brandProfileMongoService.updateBrandProfile(profileId, updates);
}

export async function deleteBrandProfileMongo(profileId: string): Promise<void> {
  return brandProfileMongoService.deleteBrandProfile(profileId);
}
