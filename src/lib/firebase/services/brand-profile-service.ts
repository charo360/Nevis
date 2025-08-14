// Brand Profile Firebase service
import { query, where, orderBy, limit, getDocs, collection } from 'firebase/firestore';
import { db } from '../config';
import { DatabaseService } from '../database';
import { COLLECTIONS, BrandProfileDocument, BrandProfileDocumentSchema } from '../schema';
import type { BrandProfile, CompleteBrandProfile } from '@/lib/types';

export class BrandProfileService extends DatabaseService<BrandProfileDocument> {
  constructor() {
    super(COLLECTIONS.BRAND_PROFILES);
  }

  // Convert from app BrandProfile to Firestore document
  private toFirestoreDocument(
    profile: BrandProfile | CompleteBrandProfile,
    userId: string
  ): Omit<BrandProfileDocument, 'id' | 'createdAt' | 'updatedAt'> {
    // Helper function to clean undefined values and empty strings
    const cleanObject = (obj: any): any => {
      if (obj === null || obj === undefined || obj === '') return undefined;
      if (Array.isArray(obj)) return obj.filter(item => item !== undefined && item !== null && item !== '');
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          const cleanedValue = cleanObject(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      }
      return obj;
    };

    // Helper function to validate and clean URL
    const cleanUrl = (url: string | undefined): string | undefined => {
      if (!url || url.trim() === '') return undefined;
      const trimmed = url.trim();
      // Basic URL validation - must start with http:// or https://
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      // If it looks like a domain, add https://
      if (trimmed.includes('.') && !trimmed.includes(' ')) {
        return `https://${trimmed}`;
      }
      return undefined;
    };

    const data = {
      userId,
      name: profile.businessName || 'Untitled Business',
      businessType: profile.businessType || 'General',
      description: profile.businessDescription || profile.description || '',
      location: cleanObject(profile.location),
      website: cleanUrl(profile.website),
      socialMedia: cleanObject({
        instagram: profile.socialMedia?.instagram || '',
        facebook: profile.socialMedia?.facebook || '',
        twitter: profile.socialMedia?.twitter || '',
        linkedin: profile.socialMedia?.linkedin || '',
        tiktok: profile.socialMedia?.tiktok || '',
      }),
      brandColors: Array.isArray(profile.brandColors) ? profile.brandColors.filter(c => c) : [],
      brandFonts: Array.isArray(profile.brandFonts) ? profile.brandFonts.filter(f => f) : [],
      visualStyle: profile.visualStyle || '',
      targetAudience: profile.targetAudience || '',
      brandVoice: profile.brandVoice || '',
      services: Array.isArray(profile.services) ? profile.services.map(service => ({
        name: service?.name || '',
        description: service?.description || '',
        category: service?.category || '',
      })).filter(s => s.name) : [],
      designExamples: Array.isArray(profile.designExamples) ? profile.designExamples.map(example => ({
        url: cleanUrl(example?.url) || '',
        description: example?.description || '',
        type: (example?.type as 'logo' | 'banner' | 'post' | 'story' | 'other') || 'other',
      })).filter(e => e.url) : [],
      isComplete: 'services' in profile && Array.isArray(profile.services) && profile.services.length > 0,
      version: '1.0',
    };

    // Remove any remaining undefined values
    return cleanObject(data);
  }

  // Convert from Firestore document to app BrandProfile
  private fromFirestoreDocument(doc: BrandProfileDocument): CompleteBrandProfile {
    return {
      businessName: doc.name,
      businessType: doc.businessType,
      businessDescription: doc.description,
      location: doc.location,
      website: doc.website,
      socialMedia: {
        instagram: doc.socialMedia?.instagram || '',
        facebook: doc.socialMedia?.facebook || '',
        twitter: doc.socialMedia?.twitter || '',
        linkedin: doc.socialMedia?.linkedin || '',
        tiktok: doc.socialMedia?.tiktok || '',
      },
      brandColors: doc.brandColors || [],
      brandFonts: doc.brandFonts || [],
      visualStyle: doc.visualStyle,
      targetAudience: doc.targetAudience,
      brandVoice: doc.brandVoice,
      services: doc.services || [],
      designExamples: doc.designExamples || [],
      // Add required CompleteBrandProfile fields
      id: doc.id,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : new Date().toISOString(),
      version: doc.version || '1.0',
    };
  }

  // Save brand profile
  async saveBrandProfile(
    profile: BrandProfile | CompleteBrandProfile,
    userId: string
  ): Promise<string> {
    const firestoreData = this.toFirestoreDocument(profile, userId);

    // Validate data
    const validatedData = BrandProfileDocumentSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).parse(firestoreData);

    return await this.create(validatedData);
  }

  // Update brand profile
  async updateBrandProfile(
    id: string,
    profile: Partial<BrandProfile | CompleteBrandProfile>
  ): Promise<void> {
    const updateData: Partial<BrandProfileDocument> = {};

    if (profile.businessName) updateData.name = profile.businessName;
    if (profile.businessType) updateData.businessType = profile.businessType;
    if (profile.businessDescription) updateData.description = profile.businessDescription;
    if (profile.location) updateData.location = profile.location;
    if (profile.website) updateData.website = profile.website;
    if (profile.socialMedia) updateData.socialMedia = profile.socialMedia;
    if (profile.brandColors) updateData.brandColors = profile.brandColors;
    if (profile.brandFonts) updateData.brandFonts = profile.brandFonts;
    if (profile.visualStyle) updateData.visualStyle = profile.visualStyle;
    if (profile.targetAudience) updateData.targetAudience = profile.targetAudience;
    if (profile.brandVoice) updateData.brandVoice = profile.brandVoice;
    if (profile.services) {
      updateData.services = profile.services.map(service => ({
        name: service.name,
        description: service.description,
        category: service.category,
      }));
      updateData.isComplete = true;
    }
    if (profile.designExamples) {
      updateData.designExamples = profile.designExamples.map(example => ({
        url: example.url,
        description: example.description,
        type: example.type as 'logo' | 'banner' | 'post' | 'story' | 'other',
      }));
    }

    await this.update(id, updateData);
  }

  // Get user's brand profiles as app format
  async getUserBrandProfiles(userId: string): Promise<CompleteBrandProfile[]> {
    const docs = await this.getByUserId(userId, {
      orderBy: 'updatedAt',
      orderDirection: 'desc',
    });

    return docs.map(doc => this.fromFirestoreDocument(doc));
  }

  // Get the most recent complete brand profile
  async getLatestCompleteBrandProfile(userId: string): Promise<CompleteBrandProfile | null> {
    const q = query(
      collection(db, COLLECTIONS.BRAND_PROFILES),
      where('userId', '==', userId),
      where('isComplete', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const docData = {
      id: doc.id,
      ...doc.data(),
    } as BrandProfileDocument;

    return this.fromFirestoreDocument(docData);
  }

  // Get brand profile by ID as app format
  async getBrandProfileById(id: string): Promise<CompleteBrandProfile | null> {
    const doc = await this.getById(id);
    if (!doc) return null;

    return this.fromFirestoreDocument(doc);
  }
}

// Export singleton instance
export const brandProfileFirebaseService = new BrandProfileService();
