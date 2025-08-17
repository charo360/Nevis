// Firebase-first brand profile service
// This service uses Firebase as the single source of truth with localStorage as cache only

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config';
import type { CompleteBrandProfile } from '@/components/cbrand/cbrand-wizard';

const COLLECTION_NAME = 'brandProfiles';
const CACHE_KEY_PREFIX = 'brandProfileCache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: CompleteBrandProfile;
  timestamp: number;
}

// Cache management functions
function getCachedProfile(userId: string): CompleteBrandProfile | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}_${userId}`);
    if (!cached) return null;
    
    const { data, timestamp }: CachedData = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}_${userId}`);
      return null;
    }
    
    console.log('📦 Using cached profile for user:', userId);
    return data;
  } catch (error) {
    console.warn('Failed to get cached profile:', error);
    return null;
  }
}

function setCachedProfile(userId: string, profile: CompleteBrandProfile): void {
  try {
    const cacheData: CachedData = {
      data: profile,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}_${userId}`, JSON.stringify(cacheData));
    console.log('📦 Cached profile for user:', userId);
  } catch (error) {
    console.warn('Failed to cache profile:', error);
  }
}

function clearCachedProfile(userId: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}_${userId}`);
    console.log('🗑️ Cleared cached profile for user:', userId);
  } catch (error) {
    console.warn('Failed to clear cached profile:', error);
  }
}

// Helper function to clean undefined values and empty objects
function cleanObject(obj: any): any {
  if (obj === null || obj === undefined) return '';
  if (typeof obj === 'string') return obj.trim();
  if (typeof obj !== 'object') return obj;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = typeof value === 'object' ? cleanObject(value) : value;
    }
  }
  return Object.keys(cleaned).length > 0 ? cleaned : '';
}

// Helper function to clean URLs
function cleanUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  // Add https:// if no protocol is specified
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

// Save brand profile to Firebase (primary storage)
export async function saveBrandProfileFirebaseFirst(profile: CompleteBrandProfile, userId: string): Promise<string> {
  try {
    console.log('🔄 Saving brand profile to Firebase (Firebase-first):', profile.businessName);
    
    // Create the document data
    const data = {
      userId,
      name: profile.businessName || 'Untitled Business',
      businessType: profile.businessType || 'General',
      description: profile.businessDescription || profile.description || '',
      location: cleanObject(profile.location),
      website: cleanUrl(profile.websiteUrl || (profile as any).website),
      logoDataUrl: profile.logoDataUrl || '', // Logo support - this is key!
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
      
      // Services
      services: Array.isArray(profile.services) ? profile.services.map(service => ({
        name: service.name || '',
        description: service.description || '',
        price: service.price || '',
        category: service.category || ''
      })) : [],
      
      // Contact information
      contactPhone: profile.contactPhone || '',
      contactEmail: profile.contactEmail || '',
      contactAddress: profile.contactAddress || '',
      
      // Brand identity
      writingTone: profile.writingTone || '',
      contentThemes: profile.contentThemes || '',
      keyFeatures: profile.keyFeatures || '',
      competitiveAdvantages: profile.competitiveAdvantages || '',
      
      // Design examples
      designExamples: Array.isArray(profile.designExamples) ? profile.designExamples : [],
      
      // Metadata
      isComplete: true,
      version: profile.version || '1.0',
      createdAt: profile.createdAt ? Timestamp.fromDate(new Date(profile.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Use existing ID or generate new one
    const docId = profile.id || doc(collection(db, COLLECTION_NAME)).id;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    // Save to Firebase first (primary storage)
    await setDoc(docRef, data, { merge: true });
    console.log('✅ Brand profile saved to Firebase successfully');
    
    // Update the profile with the ID and timestamps
    const savedProfile: CompleteBrandProfile = {
      ...profile,
      id: docId,
      createdAt: data.createdAt.toDate().toISOString(),
      updatedAt: data.updatedAt.toDate().toISOString(),
    };
    
    // Cache the saved profile for performance
    setCachedProfile(userId, savedProfile);
    
    return docId;
  } catch (error) {
    console.error('❌ Failed to save brand profile to Firebase:', error);
    throw new Error(`Failed to save brand profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Load brand profile from Firebase (primary storage) with cache fallback
export async function loadBrandProfileFirebaseFirst(userId: string): Promise<CompleteBrandProfile | null> {
  try {
    console.log('🔄 Loading brand profile from Firebase (Firebase-first) for user:', userId);
    
    // Try to get from cache first for performance
    const cached = getCachedProfile(userId);
    if (cached) {
      // Still try to update from Firebase in background, but return cached data immediately
      loadFromFirebaseInBackground(userId);
      return cached;
    }
    
    // Load from Firebase (primary storage)
    return await loadFromFirebase(userId);
  } catch (error) {
    console.error('❌ Failed to load from Firebase, trying cache:', error);
    
    // Fallback to cache if Firebase fails
    const cached = getCachedProfile(userId);
    if (cached) {
      console.log('📦 Using cached profile as fallback');
      return cached;
    }
    
    console.error('❌ No cached profile available');
    return null;
  }
}

// Load from Firebase and update cache
async function loadFromFirebase(userId: string): Promise<CompleteBrandProfile | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    console.log('📭 No brand profile found in Firebase for user:', userId);
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  
  const profile = convertFirebaseToProfile(doc.id, data);
  
  // Cache the loaded profile
  setCachedProfile(userId, profile);
  
  console.log('✅ Brand profile loaded from Firebase:', profile.businessName);
  return profile;
}

// Background loading to update cache
async function loadFromFirebaseInBackground(userId: string): Promise<void> {
  try {
    await loadFromFirebase(userId);
  } catch (error) {
    console.warn('Background Firebase load failed:', error);
  }
}

// Convert Firebase document to CompleteBrandProfile
function convertFirebaseToProfile(id: string, data: any): CompleteBrandProfile {
  return {
    id,
    businessName: data.name || '',
    businessType: data.businessType || '',
    businessDescription: data.description || '',
    description: data.description || '',
    location: data.location || '',
    websiteUrl: data.website || '',
    logoDataUrl: data.logoDataUrl || '', // Important: preserve logo data
    
    // Social media
    socialMedia: data.socialMedia || {},
    
    // Brand identity
    brandColors: data.brandColors || [],
    brandFonts: data.brandFonts || [],
    visualStyle: data.visualStyle || '',
    targetAudience: data.targetAudience || '',
    brandVoice: data.brandVoice || '',
    writingTone: data.writingTone || '',
    contentThemes: data.contentThemes || '',
    keyFeatures: data.keyFeatures || '',
    competitiveAdvantages: data.competitiveAdvantages || '',
    
    // Services
    services: data.services || [],
    
    // Contact information
    contactPhone: data.contactPhone || '',
    contactEmail: data.contactEmail || '',
    contactAddress: data.contactAddress || '',
    
    // Design examples
    designExamples: data.designExamples || [],
    
    // Metadata
    isComplete: data.isComplete || false,
    version: data.version || '1.0',
    createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// Get all brand profiles for a user
export async function getUserBrandProfilesFirebaseFirst(userId: string): Promise<CompleteBrandProfile[]> {
  try {
    console.log('🔄 Loading all brand profiles from Firebase for user:', userId);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const profiles = querySnapshot.docs.map(doc => 
      convertFirebaseToProfile(doc.id, doc.data())
    );
    
    console.log(`✅ Loaded ${profiles.length} brand profiles from Firebase`);
    return profiles;
  } catch (error) {
    console.error('❌ Failed to load brand profiles from Firebase:', error);
    return [];
  }
}

// Delete brand profile from Firebase and clear cache
export async function deleteBrandProfileFirebaseFirst(profileId: string, userId: string): Promise<void> {
  try {
    console.log('🗑️ Deleting brand profile from Firebase:', profileId);
    
    // Delete from Firebase
    await deleteDoc(doc(db, COLLECTION_NAME, profileId));
    
    // Clear cache
    clearCachedProfile(userId);
    
    console.log('✅ Brand profile deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete brand profile:', error);
    throw error;
  }
}

// Clear all cached data (useful for logout)
export function clearAllCachedProfiles(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ Cleared all cached brand profiles');
  } catch (error) {
    console.warn('Failed to clear cached profiles:', error);
  }
}
