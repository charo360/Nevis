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
      const key = this.getStorageKey();
      const serialized = JSON.stringify(data);

      // Check if data is too large before attempting to store
      const dataSize = new Blob([serialized]).size;
      const maxSize = 4 * 1024 * 1024; // 4MB limit per item

      if (dataSize > maxSize) {
        console.warn(`⚠️ Data too large for ${this.feature} (${this.formatBytes(dataSize)}), applying compression...`);

        // Try to compress the data by removing large base64 images
        const compressedData = this.compressDataForStorage(data);
        const compressedSerialized = JSON.stringify(compressedData);
        const compressedSize = new Blob([compressedSerialized]).size;

        if (compressedSize > maxSize) {
          throw new Error(`Data still too large after compression: ${this.formatBytes(compressedSize)}`);
        }

        localStorage.setItem(key, compressedSerialized);
        console.log(`💾 Saved compressed ${this.feature} data for brand ${this.brandId} (${this.formatBytes(compressedSize)})`);
        return;
      }

      localStorage.setItem(key, serialized);
      console.log(`💾 Saved ${this.feature} data for brand ${this.brandId} (${this.formatBytes(dataSize)})`);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error(`🚨 Storage quota exceeded for ${this.feature} data for brand ${this.brandId}`);
        this.handleQuotaExceeded(data);
      } else {
        console.error(`Failed to save ${this.feature} data for brand ${this.brandId}:`, error);
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
        console.log(`📂 Loaded ${this.feature} data for brand ${this.brandId}`);
        return JSON.parse(stored);
      }

      // Try to migrate from global storage if brand-scoped data doesn't exist
      const globalData = this.migrateFromGlobalStorage<T>();
      if (globalData) {
        console.log(`🔄 Migrated ${this.feature} data from global to brand-scoped storage`);
        return globalData;
      }

      console.log(`📂 No ${this.feature} data found for brand ${this.brandId}`);
      return null;
    } catch (error) {
      console.error(`Failed to load ${this.feature} data for brand ${this.brandId}:`, error);
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
      console.log(`🗑️ Removed ${this.feature} data for brand ${this.brandId}`);
    } catch (error) {
      console.error(`Failed to remove ${this.feature} data for brand ${this.brandId}:`, error);
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
          console.log(`🚫 Migration already completed for ${this.feature}, skipping for brand ${this.brandId}`);
          return null;
        }

        const parsed = JSON.parse(globalData);

        // Save to brand-scoped storage
        this.setItem(parsed);

        // Mark migration as completed to prevent future duplications
        localStorage.setItem(migrationKey, 'true');

        // Remove global data after migration to prevent future conflicts
        localStorage.removeItem(globalKey);

        console.log(`✅ Successfully migrated ${this.feature} data from global to brand ${this.brandId} and cleared global data`);
        return parsed;
      }

      return null;
    } catch (error) {
      console.error(`Failed to migrate ${this.feature} data from global storage:`, error);
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
      console.error(`Failed to get brand IDs for ${feature}:`, error);
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
        console.log(`🗑️ Removed ${key}`);
      });

      console.log(`🗑️ Cleared all data for brand ${brandId}`);
    } catch (error) {
      console.error(`Failed to clear data for brand ${brandId}:`, error);
    }
  }

  /**
   * Get storage usage statistics for the current brand
   */
  getStorageStats(): { key: string; size: number; sizeFormatted: string } {
    const key = this.getStorageKey();
    const data = localStorage.getItem(key);
    const size = data ? new Blob([data]).size : 0;

    return {
      key,
      size,
      sizeFormatted: this.formatBytes(size)
    };
  }

  /**
   * Reset migration flag for this feature (admin/debug use only)
   */
  static resetMigrationFlag(feature: string): void {
    const migrationKey = `${feature}_migration_completed`;
    localStorage.removeItem(migrationKey);
    console.log(`🔄 Reset migration flag for ${feature}`);
  }

  /**
   * Handle quota exceeded error by cleaning up old data
   */
  private handleQuotaExceeded(data: any): void {
    console.log(`🧹 Handling quota exceeded for ${this.feature} brand ${this.brandId}`);

    try {
      // Try to clean up old data first
      this.cleanupOldData();

      // Try to compress and save again
      const compressedData = this.compressDataForStorage(data);
      const key = this.getStorageKey();
      const serialized = JSON.stringify(compressedData);

      localStorage.setItem(key, serialized);
      console.log(`✅ Successfully saved after cleanup and compression for ${this.feature}`);
    } catch (retryError) {
      console.error(`❌ Failed to save even after cleanup: ${retryError.message}`);

      // Last resort: save only essential data
      const essentialData = this.extractEssentialData(data);
      const key = this.getStorageKey();
      const serialized = JSON.stringify(essentialData);

      try {
        localStorage.setItem(key, serialized);
        console.log(`⚠️ Saved only essential data for ${this.feature} due to quota limits`);
      } catch (finalError) {
        console.error(`💥 Complete storage failure for ${this.feature}:`, finalError);
      }
    }
  }

  /**
   * Compress data by removing or reducing large elements
   */
  private compressDataForStorage(data: any): any {
    if (!data) return data;

    // Handle arrays (like posts)
    if (Array.isArray(data)) {
      return data.map(item => this.compressItem(item));
    }

    // Handle single items
    return this.compressItem(data);
  }

  /**
   * Compress individual data items
   */
  private compressItem(item: any): any {
    if (!item || typeof item !== 'object') return item;

    const compressed = { ...item };

    // Remove or compress large base64 images
    if (compressed.variants && Array.isArray(compressed.variants)) {
      compressed.variants = compressed.variants.map((variant: any) => ({
        ...variant,
        imageUrl: variant.imageUrl && variant.imageUrl.startsWith('data:')
          ? '[COMPRESSED_IMAGE]' // Replace base64 with placeholder
          : variant.imageUrl
      }));
    }

    // Remove large content fields if they exist
    if (compressed.content && typeof compressed.content === 'string' && compressed.content.length > 1000) {
      compressed.content = compressed.content.substring(0, 1000) + '...[TRUNCATED]';
    }

    return compressed;
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
        content: item.content ? item.content.substring(0, 200) + '...' : '',
        hashtags: item.hashtags,
        status: item.status
      }));
    }

    // For single items, keep only essential fields
    return {
      id: data.id,
      date: data.date,
      content: data.content ? data.content.substring(0, 200) + '...' : '',
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
        console.log(`🧹 Cleaned up old data, kept ${recentData.length} of ${currentData.length} items`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old data:', error);
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
    console.warn(`Cannot create brand-scoped storage for ${feature}: brandId is null`);
    return null;
  }

  return createBrandScopedStorage(brandId, feature);
}

/**
 * Utility to migrate all global storage to brand-scoped storage
 */
export function migrateAllGlobalStorage(brandId: string, features: string[]): void {
  console.log(`🔄 Starting migration of global storage to brand-scoped for brand ${brandId}`);

  features.forEach(feature => {
    const storage = createBrandScopedStorage(brandId, feature);

    // This will automatically migrate if brand-scoped data doesn't exist
    storage.getItem();
  });

  console.log(`✅ Migration completed for brand ${brandId}`);
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
    console.warn('Failed to calculate storage usage:', error);
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
  console.log('🧹 Starting comprehensive storage cleanup...');

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
          console.log(`🧹 Cleaned up ${key}: ${data.length} → ${recentData.length} items`);
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${key}:`, error);
      }
    }
  });

  console.log('✅ Storage cleanup completed');
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


