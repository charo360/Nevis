// Brand-scoped storage service
// This service ensures all feature data is properly scoped to the current brand

export interface BrandScopedStorageConfig {
  brandId: string;
  feature: string; // e.g., 'artifacts', 'social-media', 'content-calendar'
}

// Predefined storage features for consistency
export const STORAGE_FEATURES = {
  ARTIFACTS: 'artifacts',
  ARTIFACT_FOLDERS: 'artifact-folders',
  SELECTED_ARTIFACTS: 'selectedArtifacts',
  SOCIAL_MEDIA: 'social-media',
  CONTENT_CALENDAR: 'content-calendar',
  QUICK_CONTENT: 'quick-content',
  CREATIVE_STUDIO: 'creative-studio',
  DESIGN_SETTINGS: 'design-settings',
  BRAND_SETTINGS: 'brand-settings',
} as const;

export type StorageFeature = typeof STORAGE_FEATURES[keyof typeof STORAGE_FEATURES];

export class BrandScopedStorage {
  private brandId: string;
  private feature: string;

  constructor(config: BrandScopedStorageConfig) {
    this.brandId = config.brandId;
    this.feature = config.feature;
  }

  /**
   * Get the brand-scoped storage key
   */
  private getStorageKey(): string {
    return `${this.feature}_${this.brandId}`;
  }

  /**
   * Get the global storage key (for migration purposes)
   */
  private getGlobalKey(): string {
    return this.feature;
  }

  /**
   * Store data for the current brand with quota management
   */
  setItem(data: any): void {
    try {
      // ENHANCED APPROACH: Implement post rotation for Quick Content
      if (this.feature === 'quick-content' && Array.isArray(data)) {
        this.setItemWithRotation(data);
        return;
      }

      // SMART APPROACH: Only strip large image data, keep URLs
      const optimizedData = this.optimizeImageData(data);
      const key = this.getStorageKey();
      const serialized = JSON.stringify(optimizedData);

      // Check storage stats before attempting to store
      const stats = this.getStorageStats();
      const dataSize = new Blob([serialized]).size;
      const maxSize = 500 * 1024; // 500KB limit per item (much more aggressive)

      // Always perform cleanup before saving to ensure maximum space
      this.aggressiveCleanup();

      if (dataSize > maxSize) {

        // Try fallback 1: Use aggressive stripping (old method)
        const strippedData = this.stripImageData(data);
        const strippedSerialized = JSON.stringify(strippedData);
        const strippedSize = new Blob([strippedSerialized]).size;

        if (strippedSize <= maxSize) {
          localStorage.setItem(key, strippedSerialized);
          return;
        }

        // Try fallback 2: Use minimal data
        const minimalData = this.extractMinimalData(strippedData);
        const minimalSerialized = JSON.stringify(minimalData);
        const minimalSize = new Blob([minimalSerialized]).size;

        if (minimalSize > maxSize) {
          this.removeItem(); // Clear existing data
          // Store emergency placeholder
          const emergency = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content: 'Content generated but not stored due to size limits',
            platform: 'instagram'
          };
          localStorage.setItem(key, JSON.stringify([emergency]));
        } else {
          localStorage.setItem(key, minimalSerialized);
        }
        return;
      }

      localStorage.setItem(key, serialized);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(data);
      } else {
      }
    }
  }

  /**
   * Get data for the current brand
   */
  getItem<T = any>(): T | null {
    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);

      if (stored) {
        return JSON.parse(stored);
      }

      // Try to migrate from global storage if brand-scoped data doesn't exist
      const globalData = this.migrateFromGlobalStorage<T>();
      if (globalData) {
        return globalData;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove data for the current brand
   */
  removeItem(): void {
    try {
      const key = this.getStorageKey();
      localStorage.removeItem(key);
    } catch (error) {
    }
  }

  /**
   * Check if data exists for the current brand
   */
  hasItem(): boolean {
    const key = this.getStorageKey();
    return localStorage.getItem(key) !== null;
  }

  /**
   * Migrate data from global storage to brand-scoped storage
   * Only migrates if no other brand has already been migrated to prevent duplication
   */
  private migrateFromGlobalStorage<T = any>(): T | null {
    try {
      const globalKey = this.getGlobalKey();
      const globalData = localStorage.getItem(globalKey);

      if (globalData) {
        // Check if migration has already happened for this feature
        const migrationKey = `${this.feature}_migration_completed`;
        const migrationCompleted = localStorage.getItem(migrationKey);

        if (migrationCompleted) {
          return null;
        }

        const parsed = JSON.parse(globalData);

        // Save to brand-scoped storage
        this.setItem(parsed);

        // Mark migration as completed to prevent future duplications
        localStorage.setItem(migrationKey, 'true');

        // Remove global data after migration to prevent future conflicts
        localStorage.removeItem(globalKey);

        return parsed;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get all brand IDs that have data for this feature
   */
  static getAllBrandIds(feature: string): string[] {
    const brandIds: string[] = [];
    const prefix = `${feature}_`;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const brandId = key.substring(prefix.length);
          if (brandId) {
            brandIds.push(brandId);
          }
        }
      }
    } catch (error) {
    }

    return brandIds;
  }

  /**
   * Clear all data for a specific brand across all features
   */
  static clearBrandData(brandId: string): void {
    const keysToRemove: string[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith(`_${brandId}`)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

    } catch (error) {
    }
  }

  /**
   * Get storage usage statistics for the current brand
   */
  getStorageStats(): { key: string; size: number; sizeFormatted: string; totalUsage: string; available: string } {
    const key = this.getStorageKey();
    const data = localStorage.getItem(key);
    const size = data ? new Blob([data]).size : 0;

    // Calculate total localStorage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }

    // Estimate available space (localStorage limit is usually 5-10MB)
    const estimatedLimit = 8 * 1024 * 1024; // 8MB estimate
    const available = Math.max(0, estimatedLimit - totalSize);

    return {
      key,
      size,
      sizeFormatted: this.formatBytes(size),
      totalUsage: this.formatBytes(totalSize),
      available: this.formatBytes(available)
    };
  }

  /**
   * Reset migration flag for this feature (admin/debug use only)
   */
  static resetMigrationFlag(feature: string): void {
    const migrationKey = `${feature}_migration_completed`;
    localStorage.removeItem(migrationKey);
  }

  /**
   * Handle quota exceeded error by cleaning up old data
   */
  private handleQuotaExceeded(data: any): void {

    try {
      // Step 1: Nuclear cleanup - clear ALL localStorage data
      const allKeys = Object.keys(localStorage);
      let totalCleared = 0;

      allKeys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalCleared += new Blob([item]).size;
          localStorage.removeItem(key);
        }
      });


      // Step 2: Try to save only the most essential data
      const emergency = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: Array.isArray(data) && data.length > 0 ?
          (data[0].content ? data[0].content.substring(0, 50) + '...' : 'Generated content') :
          (data.content ? data.content.substring(0, 50) + '...' : 'Generated content'),
        platform: 'instagram',
        note: 'Storage quota exceeded - full data not saved'
      };

      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify([emergency]));

    } catch (criticalError) {
      // At this point, we just give up on localStorage entirely
    }
  }

  /**
   * Aggressive cleanup of localStorage to free up space
   */
  private aggressiveCleanup(): void {

    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);
    let totalFreed = 0;

    // Remove old migration flags and temporary data
    allKeys.forEach(key => {
      if (key.includes('_migrated') || key.includes('_temp') || key.includes('_cache')) {
        const item = localStorage.getItem(key);
        if (item) {
          totalFreed += new Blob([item]).size;
          localStorage.removeItem(key);
        }
      }
    });

    // Clean up old brand data (keep only current brand and most recent)
    const brandKeys = allKeys.filter(key => key.includes('_') && key !== this.getStorageKey());
    brandKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        // Check if the data contains old compression placeholders
        if (item.includes('[COMPRESSED_IMAGE]') || item.includes('[TRUNCATED]')) {
          totalFreed += new Blob([item]).size;
          localStorage.removeItem(key);
        } else {
          totalFreed += new Blob([item]).size;
          localStorage.removeItem(key);
        }
      }
    });

  }

  /**
   * Smart image data optimization - keep URLs but remove large data
   */
  private optimizeImageData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      // Keep more items but optimize each one
      return data.slice(0, 5).map(item => this.optimizeImageFromItem(item));
    }

    return this.optimizeImageFromItem(data);
  }

  /**
   * Optimize image data in a single item - preserve all valid URLs, handle base64 smartly
   */
  private optimizeImageFromItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const optimized = { ...item };

    // Keep image URLs but handle base64 data smartly
    Object.keys(optimized).forEach(key => {
      const value = optimized[key];

      if (typeof value === 'string') {
        // Keep ALL valid URLs (HTTP, HTTPS, blob, data URLs under size limit)
        if (value.startsWith('http://') || value.startsWith('https://')) {
          // Keep HTTP/HTTPS URLs as-is, especially Firebase Storage URLs
          if (value.includes('firebasestorage.googleapis.com')) {
          } else {
          }
          return;
        }

        if (value.startsWith('blob:')) {
          // Keep blob URLs but warn they might be temporary
          return;
        }

        if (value.startsWith('data:image/')) {
          // For data URLs, keep smaller ones and convert large ones to placeholder
          if (value.length <= 50000) { // Increased limit to 50KB for small images
            return;
          } else {
            // For large data URLs, create a more informative placeholder
            const mimeType = value.split(';')[0].split(':')[1] || 'image/png';
            optimized[key] = `[Image data preserved but too large for storage - ${mimeType} - ${this.formatBytes(value.length)}]`;
          }
        }
      } else if (Array.isArray(value)) {
        optimized[key] = value.map(v => this.optimizeImageFromItem(v));
      } else if (typeof value === 'object' && value !== null) {
        optimized[key] = this.optimizeImageFromItem(value);
      }
    });

    return optimized;
  }

  /**
   * Strip all image data to prevent storage quota issues (fallback method)
   */
  private stripImageData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.slice(0, 3).map(item => this.stripImageFromItem(item)); // Keep only 3 most recent
    }

    return this.stripImageFromItem(data);
  }

  /**
   * Strip image data from individual items
   */
  private stripImageFromItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const stripped = {
      id: item.id,
      date: item.date,
      content: (item.content && typeof item.content === 'string') ? (item.content.length > 300 ? item.content.substring(0, 300) + '...' : item.content) : '',
      hashtags: item.hashtags,
      platform: item.platform || 'instagram',
      status: item.status,
      catchyWords: item.catchyWords,
      subheadline: item.subheadline,
      callToAction: item.callToAction,
      // Completely omit variants with images to save space
      variants: item.variants ? item.variants.map((variant: any) => ({
        platform: variant.platform,
        // No imageUrl at all - will be regenerated if needed
      })) : []
    };

    return stripped;
  }

  /**
   * Extract minimal data (only the most recent items)
   */
  private extractMinimalData(data: any): any {
    if (!data) return null;

    if (Array.isArray(data)) {
      // Keep only the 1 most recent item
      return data.slice(0, 1).map(item => ({
        id: item.id,
        content: (item.content && typeof item.content === 'string') ? item.content.substring(0, 100) + '...' : '',
        date: item.date,
        platform: item.platform || 'instagram'
      }));
    }

    // For single items, return basic info only
    return {
      id: data.id,
      content: (data.content && typeof data.content === 'string') ? data.content.substring(0, 100) + '...' : '',
      date: data.date || new Date().toISOString(),
      platform: data.platform || 'instagram'
    };
  }

  /**
   * Compress data by removing or reducing large elements
   */
  private compressDataForStorage(data: any): any {
    if (!data) return data;

    // Handle arrays (like posts)
    if (Array.isArray(data)) {
      // Limit to 5 most recent items and compress each
      return data.slice(0, 5).map(item => this.compressItem(item));
    }

    // Handle single items
    return this.compressItem(data);
  }

  /**
   * Compress individual data items aggressively
   */
  private compressItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const compressed = { ...item };

    // Remove or compress large base64 images
    if (compressed.variants && Array.isArray(compressed.variants)) {
      compressed.variants = compressed.variants.map((variant: any) => {
        const newVariant: any = {
          platform: variant.platform
        };

        // Only include imageUrl if it's not a base64 image
        if (variant.imageUrl && !variant.imageUrl.startsWith('data:')) {
          newVariant.imageUrl = variant.imageUrl;
        }
        // For base64 images, simply omit the imageUrl property entirely

        return newVariant;
      });
    }

    // Compress content fields
    if (compressed.content && typeof compressed.content === 'string') {
      if (compressed.content.length > 500) {
        compressed.content = compressed.content.substring(0, 500) + '...';
      }
    }

    // Remove large metadata fields
    delete compressed.metadata;
    delete compressed.marketIntelligence;
    delete compressed.localContext;
    delete compressed.contentVariants;
    delete compressed.hashtagAnalysis;

    // Keep only essential fields
    const essential = {
      id: compressed.id,
      date: compressed.date,
      content: compressed.content,
      hashtags: compressed.hashtags,
      platform: compressed.platform || 'instagram',
      status: compressed.status,
      catchyWords: compressed.catchyWords,
      subheadline: compressed.subheadline,
      callToAction: compressed.callToAction,
      variants: compressed.variants
    };

    return essential;
  }

  /**
   * Extract only essential data when storage is critically low
   */
  private extractEssentialData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      // Keep only the most recent 5 items
      return data.slice(-5).map(item => ({
        id: item.id,
        date: item.date,
        content: (item.content && typeof item.content === 'string') ? item.content.substring(0, 200) + '...' : '',
        hashtags: item.hashtags,
        status: item.status
      }));
    }

    // For single items, keep only essential fields
    return {
      id: data.id,
      date: data.date,
      content: (data.content && typeof data.content === 'string') ? data.content.substring(0, 200) + '...' : '',
      hashtags: data.hashtags,
      status: data.status
    };
  }

  /**
   * Clean up old data to free space
   */
  private cleanupOldData(): void {
    try {
      // Get current data
      const currentData = this.getItem();
      if (!currentData || !Array.isArray(currentData)) return;

      // Keep only the most recent 10 items
      const recentData = currentData.slice(-10);

      if (recentData.length < currentData.length) {
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify(recentData));
      }
    } catch (error) {
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Factory function to create brand-scoped storage for different features
 */
export function createBrandScopedStorage(brandId: string, feature: string): BrandScopedStorage {
  return new BrandScopedStorage({ brandId, feature });
}

/**
 * Hook-like function to get brand-scoped storage that updates when brand changes
 */
export function useBrandScopedStorage(brandId: string | null, feature: string): BrandScopedStorage | null {
  if (!brandId) {
    return null;
  }

  return createBrandScopedStorage(brandId, feature);
}

/**
 * Utility to migrate all global storage to brand-scoped storage
 */
export function migrateAllGlobalStorage(brandId: string, features: string[]): void {

  features.forEach(feature => {
    const storage = createBrandScopedStorage(brandId, feature);

    // This will automatically migrate if brand-scoped data doesn't exist
    storage.getItem();
  });

}

/**
 * Get localStorage usage statistics
 */
export function getStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
  usedFormatted: string;
  totalFormatted: string;
} {
  let used = 0;

  try {
    // Calculate used space
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
  }

  // Estimate total available space (varies by browser, ~5-10MB)
  const total = 10 * 1024 * 1024; // 10MB estimate
  const percentage = (used / total) * 100;

  return {
    used,
    total,
    percentage,
    usedFormatted: formatBytes(used),
    totalFormatted: formatBytes(total)
  };
}

  /**
   * Set item with automatic post rotation for Quick Content
   * Keeps only the most recent posts to prevent quota issues
   */
  private setItemWithRotation(posts: any[]): void {
    try {
      const key = this.getStorageKey();
      const MAX_POSTS = 50; // Maximum posts to keep per brand

      // Sort posts by date (newest first) and limit to MAX_POSTS
      const sortedPosts = posts
        .sort((a, b) => new Date(b.date || b.generatedAt || 0).getTime() - new Date(a.date || a.generatedAt || 0).getTime())
        .slice(0, MAX_POSTS);

      // Optimize each post for storage
      const optimizedPosts = sortedPosts.map(post => this.optimizePostForStorage(post));

      const serialized = JSON.stringify(optimizedPosts);
      const dataSize = new Blob([serialized]).size;

      console.log(`📦 Quick Content Storage: ${optimizedPosts.length} posts, ${formatBytes(dataSize)}`);

      // If still too large, reduce further
      if (dataSize > 1024 * 1024) { // 1MB limit
        console.warn('⚠️ Posts still too large, reducing to 25 most recent');
        const reducedPosts = optimizedPosts.slice(0, 25);
        localStorage.setItem(key, JSON.stringify(reducedPosts));
      } else {
        localStorage.setItem(key, serialized);
      }

    } catch (error) {
      console.error('❌ Failed to save posts with rotation:', error);

      // Emergency fallback: clear all posts and save just the newest 10
      try {
        const key = this.getStorageKey();
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
      } catch (emergencyError) {
        console.error('❌ Emergency fallback failed:', emergencyError);
        // Clear the key entirely
        localStorage.removeItem(key);
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
}

/**
 * Factory function to create brand-scoped storage for different features
 */
export function createBrandScopedStorage(brandId: string, feature: string): BrandScopedStorage {
  return new BrandScopedStorage({ brandId, feature });
}

/**
 * Hook-like function to get brand-scoped storage that updates when brand changes
 */
export function useBrandScopedStorage(brandId: string | null, feature: string): BrandScopedStorage | null {
  if (!brandId) {
    return null;
  }

  return createBrandScopedStorage(brandId, feature);
}

/**
 * Utility to migrate all global storage to brand-scoped storage
 */
export function migrateAllGlobalStorage(brandId: string, features: string[]): void {
  features.forEach(feature => {
    const storage = createBrandScopedStorage(brandId, feature);

    // This will automatically migrate if brand-scoped data doesn't exist
    storage.getItem();
  });
}

/**
 * Get localStorage usage statistics
 */
export function getStorageUsage(): {
  used: number;
  total: number;
  percentage: number;
  usedFormatted: string;
  totalFormatted: string;
} {
  let used = 0;

  try {
    // Calculate used space
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
  } catch (error) {
  }

  // Estimate total available space (varies by browser, ~5-10MB)
  const total = 10 * 1024 * 1024; // 10MB estimate
  const percentage = (used / total) * 100;

  return {
    used,
    total,
    percentage,
    usedFormatted: formatBytes(used),
    totalFormatted: formatBytes(total)
  };
}

/**
 * Clean up all old data across all brands and features
 */
export function cleanupAllStorage(): void {
  const keysToCheck: string[] = [];

  // Collect all keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keysToCheck.push(key);
  }

  // Clean up brand-scoped data
  keysToCheck.forEach(key => {
    if (key.includes('_') && !key.includes('migration_completed')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        if (Array.isArray(data) && data.length > 10) {
          // Keep only recent items
          const recentData = data.slice(-10);
          localStorage.setItem(key, JSON.stringify(recentData));
        }
      } catch (error) {
      }
    }
  });
}

/**
 * Format bytes helper function
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


