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
   * Store data for the current brand
   */
  setItem(data: any): void {
    try {
      const key = this.getStorageKey();
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      console.log(`💾 Saved ${this.feature} data for brand ${this.brandId}`);
    } catch (error) {
      console.error(`Failed to save ${this.feature} data for brand ${this.brandId}:`, error);
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


