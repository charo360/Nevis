// Brand-scoped artifacts service
// This service ensures artifacts are properly scoped to the current brand

import { BrandScopedStorage, STORAGE_FEATURES } from './brand-scoped-storage';
import type {
  Artifact,
  ArtifactFolder,
  ArtifactUploadConfig,
  ArtifactCategory,
  ArtifactUploadType,
  ArtifactUsageType,
  ArtifactTextOverlay
} from '@/lib/types/artifacts';

// Default upload configuration
const DEFAULT_UPLOAD_CONFIG: ArtifactUploadConfig = {
  maxFileSize: 20 * 1024 * 1024, // 20MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'text/plain'
  ],
  generateThumbnails: true,
  extractMetadata: true,
  performImageAnalysis: true,
  storage: {
    provider: 'local',
    basePath: '/uploads/artifacts',
    publicUrl: '/api/artifacts'
  }
};

export class BrandScopedArtifactsService {
  private artifacts: Map<string, Artifact> = new Map();
  private folders: Map<string, ArtifactFolder> = new Map();
  private config: ArtifactUploadConfig = DEFAULT_UPLOAD_CONFIG;
  private fileCache: Map<string, File> = new Map();
  private brandId: string | null = null;
  private artifactsStorage: BrandScopedStorage | null = null;
  private foldersStorage: BrandScopedStorage | null = null;

  constructor(config?: Partial<ArtifactUploadConfig>) {
    if (config) {
      this.config = { ...DEFAULT_UPLOAD_CONFIG, ...config };
    }
  }

  /**
   * Set the current brand and reload artifacts for that brand
   */
  setBrand(brandId: string | null): void {
    if (this.brandId === brandId) {
      return; // No change needed
    }


    // Clear current data
    this.artifacts.clear();
    this.folders.clear();
    this.fileCache.clear();

    // Update brand ID and storage
    this.brandId = brandId;

    if (brandId) {
      this.artifactsStorage = new BrandScopedStorage({ brandId, feature: STORAGE_FEATURES.ARTIFACTS });
      this.foldersStorage = new BrandScopedStorage({ brandId, feature: STORAGE_FEATURES.ARTIFACT_FOLDERS });

      // Load artifacts for the new brand
      this.loadArtifactsFromStorage();
      this.initializeDefaultFolders();
    } else {
      this.artifactsStorage = null;
      this.foldersStorage = null;
    }
  }

  /**
   * Get current brand ID
   */
  getCurrentBrandId(): string | null {
    return this.brandId;
  }

  /**
   * Check if service is ready (has a brand selected)
   */
  isReady(): boolean {
    return this.brandId !== null && this.artifactsStorage !== null;
  }

  /**
   * Load artifacts from brand-scoped storage
   */
  private loadArtifactsFromStorage(): void {
    if (!this.artifactsStorage) {
      return;
    }

    try {
      const artifacts = this.artifactsStorage.getItem<Artifact[]>();

      if (artifacts && Array.isArray(artifacts)) {

        let validArtifacts = 0;
        artifacts.forEach((artifact: any) => {
          // Validate artifact structure before processing
          if (!artifact || typeof artifact !== 'object') {
            return;
          }

          // Ensure required properties exist
          if (!artifact.id || !artifact.name) {
            return;
          }

          // Validate and fix timestamps
          if (!artifact.timestamps || typeof artifact.timestamps !== 'object') {
            artifact.timestamps = {
              created: new Date(),
              modified: new Date(),
              uploaded: new Date()
            };
          } else {
            try {
              artifact.timestamps.created = artifact.timestamps.created ? new Date(artifact.timestamps.created) : new Date();
              artifact.timestamps.modified = artifact.timestamps.modified ? new Date(artifact.timestamps.modified) : new Date();
              artifact.timestamps.uploaded = artifact.timestamps.uploaded ? new Date(artifact.timestamps.uploaded) : new Date();
            } catch (dateError) {
              artifact.timestamps = {
                created: new Date(),
                modified: new Date(),
                uploaded: new Date()
              };
            }
          }

          // Validate and fix usage data
          if (!artifact.usage || typeof artifact.usage !== 'object') {
            artifact.usage = {
              count: 0,
              lastUsed: null
            };
          } else {
            if (artifact.usage.lastUsed) {
              try {
                artifact.usage.lastUsed = new Date(artifact.usage.lastUsed);
              } catch (dateError) {
                artifact.usage.lastUsed = null;
              }
            }
            if (typeof artifact.usage.count !== 'number') {
              artifact.usage.count = 0;
            }
          }

          // Ensure other required properties
          if (typeof artifact.isActive !== 'boolean') {
            artifact.isActive = false;
          }

          this.artifacts.set(artifact.id, artifact as Artifact);
          validArtifacts++;
        });

      } else {
      }
    } catch (error) {
      // Clear corrupted artifact data
      if (this.artifactsStorage) {
        this.artifactsStorage.removeItem();
      }
    }
  }

  /**
   * Save artifacts to brand-scoped storage
   */
  private async saveArtifactsToStorage(): Promise<void> {
    if (!this.artifactsStorage) {
      return;
    }

    try {
      const artifacts = Array.from(this.artifacts.values());

      this.artifactsStorage.setItem(artifacts);
    } catch (error) {
    }
  }

  /**
   * Load folders from brand-scoped storage
   */
  private loadFoldersFromStorage(): void {
    if (!this.foldersStorage) {
      return;
    }

    try {
      const folders = this.foldersStorage.getItem<ArtifactFolder[]>();

      if (folders && Array.isArray(folders)) {
        let validFolders = 0;
        folders.forEach((folder: any) => {
          // Validate folder structure before processing
          if (!folder || typeof folder !== 'object') {
            return;
          }

          // Ensure required properties exist
          if (!folder.id || !folder.name) {
            return;
          }

          // Ensure metadata exists and has required properties
          if (!folder.metadata || typeof folder.metadata !== 'object') {
            folder.metadata = {
              created: new Date(),
              modified: new Date()
            };
          } else {
            // Validate and convert date properties
            try {
              folder.metadata.created = folder.metadata.created ? new Date(folder.metadata.created) : new Date();
              folder.metadata.modified = folder.metadata.modified ? new Date(folder.metadata.modified) : new Date();
            } catch (dateError) {
              folder.metadata.created = new Date();
              folder.metadata.modified = new Date();
            }
          }

          // Ensure other required properties
          if (!folder.artifactIds || !Array.isArray(folder.artifactIds)) {
            folder.artifactIds = [];
          }

          if (typeof folder.isDefault !== 'boolean') {
            folder.isDefault = false;
          }

          if (!folder.type) {
            folder.type = 'custom';
          }

          this.folders.set(folder.id, folder as ArtifactFolder);
          validFolders++;
        });
      }
    } catch (error) {
      // Clear corrupted folder data
      if (this.foldersStorage) {
        this.foldersStorage.removeItem();
      }
    }
  }

  /**
   * Save folders to brand-scoped storage
   */
  private async saveFoldersToStorage(): Promise<void> {
    if (!this.foldersStorage) {
      return;
    }

    try {
      const folders = Array.from(this.folders.values());
      this.foldersStorage.setItem(folders);
    } catch (error) {
    }
  }

  /**
   * Initialize default folders for the brand
   */
  private initializeDefaultFolders(): void {
    this.loadFoldersFromStorage();

    // Create default folders if they don't exist
    const defaultFolders = [
      { id: 'previous-posts', name: 'Previous Posts', description: 'Your past social media posts' },
      { id: 'products', name: 'Products', description: 'Product images and information' },
      { id: 'discounts', name: 'Discounts', description: 'Promotional materials and offers' },
      { id: 'references', name: 'References', description: 'Reference materials and inspiration' }
    ];

    let foldersAdded = false;
    defaultFolders.forEach(({ id, name, description }) => {
      if (!this.folders.has(id)) {
        const folder: ArtifactFolder = {
          id,
          name,
          description,
          artifactIds: [],
          metadata: {
            created: new Date(),
            modified: new Date()
          }
        };
        this.folders.set(id, folder);
        foldersAdded = true;
      }
    });

    if (foldersAdded) {
      this.saveFoldersToStorage();
    }
  }

  /**
   * Get all artifacts for the current brand
   */
  getAllArtifacts(): Artifact[] {
    if (!this.isReady()) {
      return [];
    }
    return Array.from(this.artifacts.values());
  }

  /**
   * Get active artifacts for the current brand
   */
  getActiveArtifacts(): Artifact[] {
    if (!this.isReady()) {
      return [];
    }

    const allArtifacts = this.getAllArtifacts();
    const activeArtifacts = allArtifacts.filter(artifact => artifact.isActive);


    return activeArtifacts;
  }

  /**
   * Set artifact active status
   */
  setArtifactActive(artifactId: string, isActive: boolean): void {
    if (!this.isReady()) {
      return;
    }


    const artifact = this.artifacts.get(artifactId);
    if (artifact) {
      artifact.isActive = isActive;
      artifact.timestamps.modified = new Date();
      this.artifacts.set(artifactId, artifact);

      // Save to storage
      this.saveArtifactsToStorage();
    } else {
    }
  }

  /**
   * Get artifact by ID
   */
  getArtifact(artifactId: string): Artifact | undefined {
    if (!this.isReady()) {
      return undefined;
    }
    return this.artifacts.get(artifactId);
  }

  /**
   * Get all folders for the current brand
   */
  getAllFolders(): ArtifactFolder[] {
    if (!this.isReady()) {
      return [];
    }
    return Array.from(this.folders.values());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Upload and process new artifacts with enhanced configuration
   */
  async uploadArtifacts(
    files: File[],
    category?: ArtifactCategory,
    options?: {
      uploadType?: ArtifactUploadType;
      usageType?: ArtifactUsageType;
      folderId?: string;
      textOverlay?: ArtifactTextOverlay;
      isActive?: boolean;
      customName?: string;
      instructions?: string;
    }
  ): Promise<Artifact[]> {
    if (!this.isReady()) {
      throw new Error('Artifacts service not ready: no brand selected');
    }

    const uploadedArtifacts: Artifact[] = [];

    for (const file of files) {
      try {
        // Validate file
        this.validateFile(file);

        // Generate unique ID
        const id = this.generateId();

        // Process file and extract metadata
        const metadata = await this.extractMetadata(file);

        // Generate file path (simulate file storage)
        const filePath = `/uploads/artifacts/${this.brandId}/${id}_${file.name}`;

        // Generate thumbnail path for images
        const thumbnailPath = metadata.mimeType.startsWith('image/')
          ? `/uploads/artifacts/${this.brandId}/thumbnails/${id}_thumb.jpg`
          : undefined;

        // Create artifact object
        const artifact: Artifact = {
          id,
          name: options?.customName || file.name.replace(/\.[^/.]+$/, ''),
          type: this.getArtifactType(file),
          category: category || 'general',
          uploadType: options?.uploadType || 'image',
          usageType: options?.usageType || 'reference',
          folderId: options?.folderId || 'default',
          fileUrl: filePath,
          thumbnailUrl: thumbnailPath,
          filePath,
          thumbnailPath,
          metadata,
          instructions: options?.instructions || '',
          textOverlay: options?.textOverlay || {},
          isActive: options?.isActive ?? false,
          timestamps: {
            created: new Date(),
            modified: new Date(),
            uploaded: new Date()
          },
          usage: {
            count: 0,
            lastUsed: null
          },
          tags: [],
          directives: []
        };

        // Store file in cache (simulate file storage)
        this.fileCache.set(id, file);

        // Add to artifacts map
        this.artifacts.set(id, artifact);
        uploadedArtifacts.push(artifact);

      } catch (error) {
        throw error;
      }
    }

    // Save to storage
    await this.saveArtifactsToStorage();

    return uploadedArtifacts;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File ${file.name} is too large. Maximum size is ${this.config.maxFileSize / (1024 * 1024)}MB`);
    }

    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  /**
   * Extract metadata from file
   */
  private async extractMetadata(file: File): Promise<any> {
    const metadata: any = {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      lastModified: new Date(file.lastModified)
    };

    // Add image-specific metadata
    if (file.type.startsWith('image/')) {
      try {
        const dimensions = await this.getImageDimensions(file);
        metadata.dimensions = dimensions;
      } catch (error) {
      }
    }

    return metadata;
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  }

  /**
   * Get artifact type from file
   */
  private getArtifactType(file: File): string {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'document';
    if (file.type.startsWith('text/')) return 'text';
    return 'other';
  }

  /**
   * Clear all data for the current brand
   */
  clearBrandData(): void {
    if (!this.brandId) {
      return;
    }


    // Clear in-memory data
    this.artifacts.clear();
    this.folders.clear();
    this.fileCache.clear();

    // Clear storage
    if (this.artifactsStorage) {
      this.artifactsStorage.removeItem();
    }
    if (this.foldersStorage) {
      this.foldersStorage.removeItem();
    }

  }

  /**
   * Get storage statistics for the current brand
   */
  getStorageStats(): { artifacts: any; folders: any } | null {
    if (!this.isReady() || !this.artifactsStorage || !this.foldersStorage) {
      return null;
    }

    return {
      artifacts: this.artifactsStorage.getStorageStats(),
      folders: this.foldersStorage.getStorageStats()
    };
  }
}

// Create a singleton instance
export const brandScopedArtifactsService = new BrandScopedArtifactsService();
