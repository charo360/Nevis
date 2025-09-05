/**
 * Feature Storage Service
 * Provides completely isolated localStorage for different features
 * Ensures Quick Content and Creative Studio never interfere with each other
 */

export interface FeatureStorageConfig {
  brandId: string;
  feature: 'quick-content' | 'creative-studio';
  subFeature?: string; // Optional sub-categorization
}

// Feature-specific storage prefixes to ensure complete isolation
export const FEATURE_STORAGE_PREFIXES = {
  QUICK_CONTENT: 'qc', // Quick Content
  CREATIVE_STUDIO: 'cs', // Creative Studio
} as const;

// Storage categories for each feature
export const STORAGE_CATEGORIES = {
  QUICK_CONTENT: {
    POSTS: 'posts',
    SETTINGS: 'settings',
    DRAFTS: 'drafts',
    TEMPLATES: 'templates',
    HISTORY: 'history',
  },
  CREATIVE_STUDIO: {
    PROJECTS: 'projects',
    ASSETS: 'assets',
    DESIGNS: 'designs',
    ITERATIONS: 'iterations',
    SETTINGS: 'settings',
    CHAT_HISTORY: 'chat-history',
  },
} as const;

export class FeatureStorageService {
  private brandId: string;
  private feature: 'quick-content' | 'creative-studio';
  private subFeature?: string;

  constructor(config: FeatureStorageConfig) {
    this.brandId = config.brandId || 'default';
    this.feature = config.feature;
    this.subFeature = config.subFeature;
  }

  /**
   * Generate a unique storage key for this feature
   * Format: {prefix}-{brandId}-{category}-{subFeature?}
   */
  private getStorageKey(category: string): string {
    const prefix = this.feature === 'quick-content'
      ? FEATURE_STORAGE_PREFIXES.QUICK_CONTENT
      : FEATURE_STORAGE_PREFIXES.CREATIVE_STUDIO;

    const parts = [prefix, this.brandId, category];

    if (this.subFeature) {
      parts.push(this.subFeature);
    }

    return parts.join('-');
  }

  /**
   * Store data for this feature with quota management
   */
  setItem<T>(category: string, data: T): boolean {
    try {
      // ENHANCED APPROACH: Implement post rotation for Quick Content posts
      if (this.feature === 'quick-content' && category === 'posts' && Array.isArray(data)) {
        return this.setItemWithRotation(category, data);
      }

      // Original logic for other features
      const key = this.getStorageKey(category);
      const serialized = JSON.stringify(data);

      // Check storage quota before saving
      const estimatedSize = new Blob([serialized]).size;
      if (estimatedSize > 5 * 1024 * 1024) { // 5MB limit
        console.warn(`⚠️ ${this.feature} storage: Data too large (${estimatedSize} bytes)`);
        return false;
      }

      localStorage.setItem(key, serialized);
      console.log(`✅ ${this.feature} storage: Saved ${category} for brand ${this.brandId}`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.feature} storage: Failed to save ${category}:`, error);
      return false;
    }
  }

  /**
   * Set item with automatic post rotation for Quick Content
   * Keeps only the most recent posts to prevent quota issues
   */
  private setItemWithRotation(category: string, posts: any[]): boolean {
    try {
      const key = this.getStorageKey(category);
      const MAX_POSTS = 50; // Maximum posts to keep per brand

      // Sort posts by date (newest first) and limit to MAX_POSTS
      const sortedPosts = posts
        .sort((a, b) => new Date(b.date || b.generatedAt || 0).getTime() - new Date(a.date || a.generatedAt || 0).getTime())
        .slice(0, MAX_POSTS);

      // Optimize each post for storage
      const optimizedPosts = sortedPosts.map(post => this.optimizePostForStorage(post));

      const serialized = JSON.stringify(optimizedPosts);
      const dataSize = new Blob([serialized]).size;

      console.log(`📦 Quick Content Storage: ${optimizedPosts.length} posts, ${this.formatBytes(dataSize)}`);

      // If still too large, reduce further
      if (dataSize > 1024 * 1024) { // 1MB limit
        console.warn('⚠️ Posts still too large, reducing to 25 most recent');
        const reducedPosts = optimizedPosts.slice(0, 25);
        localStorage.setItem(key, JSON.stringify(reducedPosts));
      } else {
        localStorage.setItem(key, serialized);
      }

      console.log(`✅ ${this.feature} storage: Saved ${category} with rotation for brand ${this.brandId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to save posts with rotation:', error);

      // Emergency fallback: clear all posts and save just the newest 10
      try {
        const key = this.getStorageKey(category);
        const emergencyPosts = posts
          .sort((a, b) => new Date(b.date || b.generatedAt || 0).getTime() - new Date(a.date || a.generatedAt || 0).getTime())
          .slice(0, 10)
          .map(post => ({
            id: post.id,
            date: post.date || post.generatedAt,
            platform: post.platform,
            content: post.content?.substring(0, 200) + '...' || 'Generated content',
            hashtags: post.hashtags?.slice(0, 5) || [],
            status: post.status || 'generated'
          }));

        localStorage.setItem(key, JSON.stringify(emergencyPosts));
        console.log('✅ Emergency fallback: Saved 10 most recent posts');
        return true;
      } catch (emergencyError) {
        console.error('❌ Emergency fallback failed:', emergencyError);
        // Clear the key entirely
        localStorage.removeItem(key);
        return false;
      }
    }
  }

  /**
   * Optimize individual post for storage
   */
  private optimizePostForStorage(post: any): any {
    return {
      id: post.id,
      date: post.date || post.generatedAt,
      platform: post.platform,
      postType: post.postType || 'post',
      // Keep imageUrl but remove large base64 data
      imageUrl: post.imageUrl?.startsWith('data:') ? '' : post.imageUrl,
      // Truncate long content
      content: post.content?.length > 500 ? post.content.substring(0, 500) + '...' : post.content,
      // Limit hashtags
      hashtags: post.hashtags?.slice(0, 10) || [],
      status: post.status || 'generated',
      // Keep essential metadata only
      metadata: post.metadata ? {
        model: post.metadata.model,
        qualityScore: post.metadata.qualityScore
      } : undefined,
      // Remove variants to save space
      variants: undefined
    };
  }

  /**
   * Format bytes helper function
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Retrieve data for this feature
   */
  getItem<T>(category: string): T | null {
    try {
      const key = this.getStorageKey(category);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      console.log(`📖 ${this.feature} storage: Loaded ${category} for brand ${this.brandId}`);
      return parsed;
    } catch (error) {
      console.error(`❌ ${this.feature} storage: Failed to load ${category}:`, error);
      return null;
    }
  }

  /**
   * Remove data for this feature
   */
  removeItem(category: string): boolean {
    try {
      const key = this.getStorageKey(category);
      localStorage.removeItem(key);
      console.log(`🗑️ ${this.feature} storage: Removed ${category} for brand ${this.brandId}`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.feature} storage: Failed to remove ${category}:`, error);
      return false;
    }
  }

  /**
   * Check if data exists for this feature
   */
  hasItem(category: string): boolean {
    const key = this.getStorageKey(category);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Clear all data for this feature and brand
   */
  clearAll(): boolean {
    try {
      const prefix = this.getStorageKey('');
      const keysToRemove: string[] = [];

      // Find all keys that match this feature and brand
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix.slice(0, -1))) { // Remove trailing dash
          keysToRemove.push(key);
        }
      }

      // Remove all matching keys
      keysToRemove.forEach(key => localStorage.removeItem(key));

      console.log(`🧹 ${this.feature} storage: Cleared all data for brand ${this.brandId}`);
      return true;
    } catch (error) {
      console.error(`❌ ${this.feature} storage: Failed to clear all data:`, error);
      return false;
    }
  }

  /**
   * Get storage usage statistics for this feature
   */
  getStorageStats(): { totalKeys: number; estimatedSize: number; categories: string[] } {
    const prefix = this.getStorageKey('');
    const matchingKeys: string[] = [];
    let totalSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix.slice(0, -1))) {
        matchingKeys.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }

    const categories = matchingKeys.map(key => {
      const parts = key.split('-');
      return parts[2] || 'unknown'; // Extract category from key
    });

    return {
      totalKeys: matchingKeys.length,
      estimatedSize: totalSize,
      categories: [...new Set(categories)], // Remove duplicates
    };
  }
}

/**
 * Factory functions for creating feature-specific storage services
 */
export function createQuickContentStorage(brandId: string, subFeature?: string): FeatureStorageService {
  return new FeatureStorageService({
    brandId,
    feature: 'quick-content',
    subFeature,
  });
}

export function createCreativeStudioStorage(brandId: string, subFeature?: string): FeatureStorageService {
  return new FeatureStorageService({
    brandId,
    feature: 'creative-studio',
    subFeature,
  });
}

/**
 * Utility function to migrate existing data to the new storage system
 */
export function migrateToFeatureStorage(brandId: string): {
  quickContentMigrated: boolean;
  creativeStudioMigrated: boolean;
} {
  const results = {
    quickContentMigrated: false,
    creativeStudioMigrated: false,
  };

  try {
    // Migrate Quick Content data
    const oldQuickContentKey = `quick-content-${brandId}`;
    const oldQuickContentData = localStorage.getItem(oldQuickContentKey);

    if (oldQuickContentData) {
      const qcStorage = createQuickContentStorage(brandId);
      const parsedData = JSON.parse(oldQuickContentData);
      qcStorage.setItem(STORAGE_CATEGORIES.QUICK_CONTENT.POSTS, parsedData);
      localStorage.removeItem(oldQuickContentKey); // Remove old key
      results.quickContentMigrated = true;
      console.log(`✅ Migrated Quick Content data for brand ${brandId}`);
    }

    // Migrate Creative Studio data (if any exists)
    const oldCreativeStudioKey = `creative-studio-${brandId}`;
    const oldCreativeStudioData = localStorage.getItem(oldCreativeStudioKey);

    if (oldCreativeStudioData) {
      const csStorage = createCreativeStudioStorage(brandId);
      const parsedData = JSON.parse(oldCreativeStudioData);
      csStorage.setItem(STORAGE_CATEGORIES.CREATIVE_STUDIO.PROJECTS, parsedData);
      localStorage.removeItem(oldCreativeStudioKey); // Remove old key
      results.creativeStudioMigrated = true;
      console.log(`✅ Migrated Creative Studio data for brand ${brandId}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  return results;
}
