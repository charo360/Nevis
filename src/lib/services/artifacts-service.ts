// src/lib/services/artifacts-service.ts
/**
 * Service for managing artifacts - upload, storage, retrieval, and metadata management
 */

import {
  Artifact,
  ArtifactMetadata,
  ArtifactSearchFilters,
  ArtifactSearchResult,
  ArtifactUploadConfig,
  GenerationDirective,
  TextOverlayDirective,
  StyleReferenceDirective,
  ArtifactType,
  ArtifactCategory,
  // New enhanced types
  ArtifactFolder,
  ArtifactUploadType,
  ArtifactUsageType,
  ArtifactTextOverlay,
  EnhancedArtifactUploadConfig,
  FolderCreateRequest,
  FolderUpdateRequest,
  ArtifactActivationState,
  EnhancedArtifactSearchFilters,
  FolderType
} from '@/lib/types/artifacts';

// Default upload configuration
const DEFAULT_UPLOAD_CONFIG: ArtifactUploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
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

class ArtifactsService {
  private artifacts: Map<string, Artifact> = new Map();
  private folders: Map<string, ArtifactFolder> = new Map();
  private config: ArtifactUploadConfig = DEFAULT_UPLOAD_CONFIG;
  // Temporary file storage for previews (not persisted to avoid quota issues)
  private fileCache: Map<string, File> = new Map();

  constructor(config?: Partial<ArtifactUploadConfig>) {
    if (config) {
      this.config = { ...DEFAULT_UPLOAD_CONFIG, ...config };
    }
    this.loadArtifactsFromStorage();
    this.initializeDefaultFolders();
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
    const uploadedArtifacts: Artifact[] = [];

    for (const file of files) {
      try {
        // Validate file
        this.validateFile(file);

        // Generate unique ID
        const id = this.generateId();

        // Process file and extract metadata
        const metadata = await this.extractMetadata(file);

        // Generate file path
        const filePath = await this.saveFile(file, id);

        // Generate thumbnail path (don't store actual data to avoid quota issues)
        const thumbnailPath = metadata.mimeType.startsWith('image/')
          ? `/uploads/artifacts/thumbnails/${id}_thumb.jpg`
          : undefined;

        // Auto-generate directives based on file analysis
        const directives = this.config.performImageAnalysis
          ? await this.generateDirectives(file, metadata)
          : [];

        // Create artifact with enhanced configuration
        const artifact: Artifact = {
          id,
          name: options?.customName?.trim() || file.name,
          type: this.determineArtifactType(file),
          category: category || this.determineCategoryFromFile(file),
          usageType: options?.usageType || 'reference',
          uploadType: options?.uploadType || this.determineUploadType(file),
          folderId: options?.folderId || this.getDefaultFolderId(file),
          isActive: options?.isActive || false,
          instructions: options?.instructions,
          textOverlay: options?.textOverlay,
          filePath,
          thumbnailPath,
          metadata,
          directives,
          tags: this.generateTags(file, metadata),
          usage: {
            usageCount: 0,
            usedInContexts: []
          },
          timestamps: {
            created: new Date(),
            modified: new Date(),
            uploaded: new Date()
          }
        };

        // Add artifact to folder if specified
        if (artifact.folderId) {
          const folder = this.folders.get(artifact.folderId);
          if (folder) {
            folder.artifactIds.push(id);
            folder.metadata.modified = new Date();
            this.folders.set(artifact.folderId, folder);
          }
        }

        // Store artifact
        this.artifacts.set(id, artifact);
        uploadedArtifacts.push(artifact);

        // Cache the file temporarily for preview generation (not persisted)
        if (file.type.startsWith('image/')) {
          this.fileCache.set(id, file);
        }

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }

    // Save to persistent storage
    await this.saveArtifactsToStorage();

    return uploadedArtifacts;
  }

  /**
   * Search artifacts with filters
   */
  searchArtifacts(filters: ArtifactSearchFilters): ArtifactSearchResult {
    const startTime = Date.now();
    let results = Array.from(this.artifacts.values());

    // Apply filters
    if (filters.types?.length) {
      results = results.filter(a => filters.types!.includes(a.type));
    }

    if (filters.categories?.length) {
      results = results.filter(a => filters.categories!.includes(a.category));
    }

    if (filters.tags?.length) {
      results = results.filter(a =>
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      results = results.filter(a =>
        a.name.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower) ||
        a.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters.usageContext) {
      results = results.filter(a =>
        a.usage.usedInContexts.includes(filters.usageContext!)
      );
    }

    if (filters.dateRange) {
      results = results.filter(a =>
        a.timestamps.created >= filters.dateRange!.start &&
        a.timestamps.created <= filters.dateRange!.end
      );
    }

    if (filters.fileSizeRange) {
      results = results.filter(a =>
        a.metadata.fileSize >= filters.fileSizeRange!.min &&
        a.metadata.fileSize <= filters.fileSizeRange!.max
      );
    }

    if (filters.dimensionsRange && filters.dimensionsRange.minWidth) {
      results = results.filter(a =>
        a.metadata.dimensions &&
        a.metadata.dimensions.width >= filters.dimensionsRange!.minWidth! &&
        (!filters.dimensionsRange!.maxWidth || a.metadata.dimensions.width <= filters.dimensionsRange!.maxWidth) &&
        (!filters.dimensionsRange!.minHeight || a.metadata.dimensions.height >= filters.dimensionsRange!.minHeight) &&
        (!filters.dimensionsRange!.maxHeight || a.metadata.dimensions.height <= filters.dimensionsRange!.maxHeight)
      );
    }

    const executionTime = Date.now() - startTime;

    return {
      artifacts: results,
      totalCount: results.length,
      searchMetadata: {
        query: filters,
        executionTime,
        suggestions: this.generateSearchSuggestions(filters, results)
      }
    };
  }

  /**
   * Get artifact by ID
   */
  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Update artifact
   */
  async updateArtifact(id: string, updates: Partial<Artifact>): Promise<Artifact> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      throw new Error(`Artifact ${id} not found`);
    }

    const updatedArtifact = {
      ...artifact,
      ...updates,
      timestamps: {
        ...artifact.timestamps,
        modified: new Date()
      }
    };

    this.artifacts.set(id, updatedArtifact);
    await this.saveArtifactsToStorage();

    return updatedArtifact;
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(id: string): Promise<void> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      throw new Error(`Artifact ${id} not found`);
    }

    // Delete files
    await this.deleteFile(artifact.filePath);
    if (artifact.thumbnailPath) {
      await this.deleteFile(artifact.thumbnailPath);
    }

    // Remove from memory
    this.artifacts.delete(id);

    // Save to storage
    await this.saveArtifactsToStorage();
  }

  /**
   * Track artifact usage
   */
  async trackUsage(id: string, context: string): Promise<void> {
    const artifact = this.artifacts.get(id);
    if (!artifact) return;

    artifact.usage.usageCount++;
    artifact.usage.lastUsed = new Date();

    if (!artifact.usage.usedInContexts.includes(context as any)) {
      artifact.usage.usedInContexts.push(context as any);
    }

    await this.saveArtifactsToStorage();
  }

  /**
   * Get all artifacts
   */
  getAllArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  /**
   * Get artifacts by category
   */
  getArtifactsByCategory(category: ArtifactCategory): Artifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.category === category);
  }

  /**
   * Get recently used artifacts
   */
  getRecentlyUsed(limit: number = 10): Artifact[] {
    return Array.from(this.artifacts.values())
      .filter(a => a.usage.lastUsed)
      .sort((a, b) => b.usage.lastUsed!.getTime() - a.usage.lastUsed!.getTime())
      .slice(0, limit);
  }

  /**
   * Create a text-only artifact
   */
  async createTextArtifact(options: {
    name: string;
    content: string;
    usageType: ArtifactUsageType;
    category?: ArtifactCategory;
    folderId?: string;
    isActive?: boolean;
  }): Promise<Artifact> {
    const id = this.generateId();

    // Parse structured text content if it's JSON
    let textOverlay: ArtifactTextOverlay | undefined;
    let instructions: string | undefined;
    try {
      const parsedContent = JSON.parse(options.content);
      if (parsedContent.headline || parsedContent.message) {
        textOverlay = {
          headline: parsedContent.headline,
          message: parsedContent.message,
          cta: parsedContent.cta,
          contact: parsedContent.contact,
          discount: parsedContent.discount,
          instructions: parsedContent.instructions
        };

        // Use provided instructions or auto-generate from content
        instructions = parsedContent.instructions?.trim() || this.generateInstructionsFromTextOverlay(parsedContent);
      }
    } catch {
      // Not JSON, treat as plain text
    }

    const artifact: Artifact = {
      id,
      name: options.name,
      type: 'text',
      category: options.category || 'uncategorized',
      usageType: options.usageType,
      uploadType: 'text',
      folderId: options.folderId || '',
      isActive: options.isActive || false,
      instructions,
      textOverlay,
      filePath: '', // No file for text artifacts
      metadata: {
        fileSize: new Blob([options.content]).size,
        mimeType: 'text/plain',
        extractedText: options.content
      },
      directives: [],
      tags: this.generateTagsFromText(options.content),
      usage: {
        usageCount: 0,
        usedInContexts: []
      },
      timestamps: {
        created: new Date(),
        modified: new Date(),
        uploaded: new Date()
      }
    };

    this.artifacts.set(id, artifact);
    await this.saveArtifactsToStorage();
    return artifact;
  }

  // Private helper methods
  private validateFile(file: File): void {
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }

  private generateId(): string {
    return `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async extractMetadata(file: File): Promise<ArtifactMetadata> {
    const metadata: ArtifactMetadata = {
      fileSize: file.size,
      mimeType: file.type
    };

    // Extract image dimensions and colors for images
    if (file.type.startsWith('image/')) {
      const dimensions = await this.getImageDimensions(file);
      metadata.dimensions = dimensions;

      if (this.config.performImageAnalysis) {
        metadata.colorPalette = await this.extractColorPalette(file);
        metadata.imageAnalysis = await this.analyzeImage(file);
      }
    }

    // Extract text for text files or OCR for images
    if (file.type === 'text/plain') {
      metadata.extractedText = await file.text();
    } else if (file.type.startsWith('image/') && this.config.performImageAnalysis) {
      metadata.extractedText = await this.performOCR(file);
    }

    return metadata;
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async extractColorPalette(file: File): Promise<string[]> {
    // Simplified color extraction - in production, use a proper library
    return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
  }

  private async analyzeImage(file: File): Promise<any> {
    // Simplified image analysis - in production, use AI vision APIs
    return {
      hasText: Math.random() > 0.5,
      hasPeople: Math.random() > 0.7,
      hasProducts: Math.random() > 0.6,
      style: 'modern',
      mood: 'professional'
    };
  }

  private async performOCR(file: File): Promise<string> {
    // Placeholder for OCR functionality
    return '';
  }

  private async saveFile(file: File, id: string): Promise<string> {
    // In production, implement actual file saving logic
    return `/uploads/artifacts/${id}_${file.name}`;
  }

  private async generateThumbnail(file: File, id: string): Promise<string> {
    // Return a placeholder path - actual thumbnails will be generated on-demand
    return `/uploads/artifacts/thumbnails/${id}_thumb.jpg`;
  }

  /**
   * Generate a thumbnail data URL from a file (for display purposes)
   * This is called on-demand to avoid localStorage quota issues
   */
  async generateThumbnailDataUrl(file: File): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Failed to generate thumbnail data URL:', error);
      throw error;
    }
  }

  /**
   * Get thumbnail data URL for an artifact (on-demand generation)
   */
  async getArtifactThumbnail(artifactId: string): Promise<string | null> {
    const file = this.fileCache.get(artifactId);
    if (!file) {
      return null;
    }

    try {
      return await this.generateThumbnailDataUrl(file);
    } catch (error) {
      console.error('Failed to generate thumbnail for artifact:', artifactId, error);
      return null;
    }
  }

  /**
   * Generate instructions from text overlay content
   */
  private generateInstructionsFromTextOverlay(content: any): string {
    const instructions: string[] = [];

    if (content.headline?.trim()) {
      instructions.push(`Use "${content.headline.trim()}" as the main headline with large, bold text`);
    }

    if (content.message?.trim()) {
      instructions.push(`Include the message "${content.message.trim()}" as supporting text`);
    }

    if (content.cta?.trim()) {
      instructions.push(`Add a prominent call-to-action button with "${content.cta.trim()}"`);
    }

    if (content.contact?.trim()) {
      instructions.push(`Display contact information "${content.contact.trim()}" clearly`);
    }

    if (content.discount?.trim()) {
      instructions.push(`Highlight the discount offer "${content.discount.trim()}" prominently`);
    }

    return instructions.length > 0
      ? instructions.join(', ')
      : 'Use this text content in the design as appropriate';
  }

  /**
   * Fix existing artifacts that don't have instructions
   */
  fixMissingInstructions(): void {
    console.log('🔧 Fixing artifacts with missing instructions...');
    let fixedCount = 0;

    for (const [id, artifact] of this.artifacts.entries()) {
      if (artifact.type === 'text' && artifact.textOverlay && (!artifact.instructions || artifact.instructions.trim() === '')) {
        const generatedInstructions = this.generateInstructionsFromTextOverlay(artifact.textOverlay);
        artifact.instructions = generatedInstructions;
        this.artifacts.set(id, artifact);
        fixedCount++;
        console.log(`✅ Fixed instructions for artifact: ${artifact.name} -> "${generatedInstructions}"`);
      }
    }

    if (fixedCount > 0) {
      this.saveArtifactsToStorage();
      console.log(`🎯 Fixed ${fixedCount} artifacts with missing instructions`);
    } else {
      console.log('📋 No artifacts needed instruction fixes');
    }
  }

  /**
   * Set an artifact as active or inactive
   */
  setArtifactActive(artifactId: string, isActive: boolean): void {
    console.log(`🔧 setArtifactActive called: ${artifactId} -> ${isActive}`);
    const artifact = this.artifacts.get(artifactId);
    if (artifact) {
      console.log(`✅ Artifact found: ${artifact.name}, current isActive: ${artifact.isActive}`);
      artifact.isActive = isActive;
      this.artifacts.set(artifactId, artifact);
      this.saveArtifactsToStorage();
      console.log(`💾 Artifact updated and saved: ${artifact.name} isActive: ${artifact.isActive}`);
    } else {
      console.error(`❌ Artifact not found: ${artifactId}`);
    }
  }

  private async deleteFile(filePath: string): Promise<void> {
    // In production, implement file deletion
    console.log(`Would delete file: ${filePath}`);
  }

  private determineArtifactType(file: File): ArtifactType {
    if (file.type.startsWith('image/')) {
      if (file.name.toLowerCase().includes('logo')) return 'logo';
      if (file.name.toLowerCase().includes('screenshot')) return 'screenshot';
      return 'image';
    }
    return 'document';
  }

  private determineCategoryFromFile(file: File): ArtifactCategory {
    const name = file.name.toLowerCase();
    if (name.includes('logo')) return 'logos';
    if (name.includes('screenshot')) return 'screenshots';
    if (name.includes('template')) return 'templates';
    if (name.includes('product')) return 'product-images';
    if (name.includes('brand')) return 'brand-assets';
    return 'uncategorized';
  }

  private generateTags(file: File, metadata: ArtifactMetadata): string[] {
    const tags: string[] = [];

    // Add type-based tags
    if (file.type.startsWith('image/')) tags.push('image');
    if (metadata.dimensions) {
      if (metadata.dimensions.width > metadata.dimensions.height) tags.push('landscape');
      else if (metadata.dimensions.height > metadata.dimensions.width) tags.push('portrait');
      else tags.push('square');
    }

    // Add size-based tags
    if (metadata.fileSize > 5 * 1024 * 1024) tags.push('large');
    else if (metadata.fileSize > 1024 * 1024) tags.push('medium');
    else tags.push('small');

    return tags;
  }

  private generateTagsFromText(content: string): string[] {
    const tags: string[] = ['text'];

    // Try to parse structured content
    try {
      const parsed = JSON.parse(content);
      if (parsed.headline) tags.push('headline');
      if (parsed.message) tags.push('message');
      if (parsed.cta) tags.push('call-to-action');
      if (parsed.contact) tags.push('contact-info');
      if (parsed.discount) tags.push('discount');
    } catch {
      // Plain text
      tags.push('plain-text');
    }

    return tags;
  }

  private getDefaultFolderId(file?: File): string {
    // Return the ID of the default folder for the artifact type
    const defaultFolder = Array.from(this.folders.values()).find(f => f.isDefault);
    return defaultFolder?.id || '';
  }

  private async generateDirectives(file: File, metadata: ArtifactMetadata): Promise<GenerationDirective[]> {
    const directives: GenerationDirective[] = [];

    // Generate style reference directive for images
    if (file.type.startsWith('image/')) {
      const styleDirective: StyleReferenceDirective = {
        id: `style_${this.generateId()}`,
        type: 'style-reference',
        label: 'Use as style reference',
        instruction: `Use this image as a style reference for layout, color scheme, and overall aesthetic`,
        priority: 7,
        active: true,
        styleElements: {
          layout: true,
          colorScheme: true,
          composition: true,
          mood: true
        },
        adaptationLevel: 'moderate'
      };
      directives.push(styleDirective);
    }

    // Generate text overlay directive if text is detected
    if (metadata.extractedText && metadata.extractedText.trim()) {
      const textDirective: TextOverlayDirective = {
        id: `text_${this.generateId()}`,
        type: 'text-overlay',
        label: 'Include extracted text',
        instruction: `Include this exact text in the generated design: "${metadata.extractedText.trim()}"`,
        priority: 9,
        active: false, // Disabled by default, user can enable
        exactText: metadata.extractedText.trim(),
        positioning: {
          horizontal: 'center',
          vertical: 'center'
        },
        styling: {
          fontSize: 'large',
          fontWeight: 'bold'
        }
      };
      directives.push(textDirective);
    }

    return directives;
  }

  private generateSearchSuggestions(filters: ArtifactSearchFilters, results: Artifact[]): string[] {
    // Generate helpful search suggestions based on current results
    const suggestions: string[] = [];

    if (results.length === 0) {
      suggestions.push('Try removing some filters');
      suggestions.push('Check different categories');
    } else if (results.length > 50) {
      suggestions.push('Add more specific filters');
      suggestions.push('Filter by category or type');
    }

    return suggestions;
  }

  private loadArtifactsFromStorage(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('🚫 Not in browser environment, skipping artifact loading');
        return;
      }

      const stored = localStorage.getItem('artifacts');
      console.log(`📂 Loading artifacts from localStorage key 'artifacts'`);
      if (stored) {
        const artifacts = JSON.parse(stored);
        console.log(`✅ Found ${artifacts.length} artifacts in storage`);
        artifacts.forEach((artifact: Artifact) => {
          // Convert date strings back to Date objects
          artifact.timestamps.created = new Date(artifact.timestamps.created);
          artifact.timestamps.modified = new Date(artifact.timestamps.modified);
          artifact.timestamps.uploaded = new Date(artifact.timestamps.uploaded);
          if (artifact.usage.lastUsed) {
            artifact.usage.lastUsed = new Date(artifact.usage.lastUsed);
          }
          this.artifacts.set(artifact.id, artifact);
          console.log(`📋 Loaded artifact: ${artifact.name}, isActive: ${artifact.isActive}, usageType: ${artifact.usageType}`);
        });
        console.log(`🎯 Total artifacts loaded into service: ${this.artifacts.size}`);
      } else {
        console.log(`📂 No artifacts found in localStorage`);
      }
    } catch (error) {
      console.error('Failed to load artifacts from storage:', error);
    }
  }

  private async saveArtifactsToStorage(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        console.log('🚫 Not in browser environment, skipping artifact saving');
        return;
      }

      const artifacts = Array.from(this.artifacts.values());
      console.log(`💾 Saving ${artifacts.length} artifacts to localStorage`);
      console.log(`📋 Artifacts being saved:`, artifacts.map(a => ({
        id: a.id,
        name: a.name,
        isActive: a.isActive,
        usageType: a.usageType
      })));
      localStorage.setItem('artifacts', JSON.stringify(artifacts));
      console.log(`✅ Artifacts saved successfully`);

      const folders = Array.from(this.folders.values());
      localStorage.setItem('artifact-folders', JSON.stringify(folders));
    } catch (error) {
      console.error('Failed to save artifacts to storage:', error);
    }
  }

  // === NEW ENHANCED METHODS ===

  /**
   * Initialize default folders
   */
  private initializeDefaultFolders(): void {
    const defaultFolders = [
      { id: 'previous-posts', name: 'Previous Posts', description: 'Previously created social media posts for reference', color: '#3B82F6' },
      { id: 'products', name: 'Products', description: 'Product images and screenshots for exact use', color: '#10B981' },
      { id: 'discounts', name: 'Discounts', description: 'Discount and promotional materials', color: '#F59E0B' },
      { id: 'references', name: 'References', description: 'Style references and inspiration materials', color: '#8B5CF6' }
    ];

    defaultFolders.forEach(folderData => {
      if (!this.folders.has(folderData.id)) {
        const folder: ArtifactFolder = {
          ...folderData,
          type: 'default',
          artifactIds: [],
          metadata: {
            created: new Date(),
            modified: new Date()
          },
          isDefault: true
        };
        this.folders.set(folder.id, folder);
      }
    });

    this.loadFoldersFromStorage();
  }

  /**
   * Load folders from storage
   */
  private loadFoldersFromStorage(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }

      const stored = localStorage.getItem('artifact-folders');
      if (stored) {
        const folders = JSON.parse(stored);
        folders.forEach((folder: ArtifactFolder) => {
          folder.metadata.created = new Date(folder.metadata.created);
          folder.metadata.modified = new Date(folder.metadata.modified);
          this.folders.set(folder.id, folder);
        });
      }
    } catch (error) {
      console.error('Failed to load folders from storage:', error);
    }
  }

  /**
   * Determine upload type from file
   */
  private determineUploadType(file: File): ArtifactUploadType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'text/plain') return 'text';
    return 'document';
  }

  /**
   * Get default folder ID based on file type
   */
  private getDefaultFolderId(file: File): string {
    if (file.name.toLowerCase().includes('product')) return 'products';
    if (file.name.toLowerCase().includes('discount') || file.name.toLowerCase().includes('sale')) return 'discounts';
    if (file.name.toLowerCase().includes('post')) return 'previous-posts';
    return 'references';
  }

  // === FOLDER MANAGEMENT METHODS ===

  /**
   * Create a new folder
   */
  async createFolder(request: FolderCreateRequest): Promise<ArtifactFolder> {
    const id = this.generateId();
    const folder: ArtifactFolder = {
      id,
      name: request.name,
      description: request.description,
      type: request.type,
      color: request.color,
      artifactIds: [],
      metadata: {
        created: new Date(),
        modified: new Date()
      },
      isDefault: false
    };

    this.folders.set(id, folder);
    await this.saveArtifactsToStorage();
    return folder;
  }

  /**
   * Update folder
   */
  async updateFolder(folderId: string, request: FolderUpdateRequest): Promise<ArtifactFolder | null> {
    const folder = this.folders.get(folderId);
    if (!folder) return null;

    if (request.name) folder.name = request.name;
    if (request.description !== undefined) folder.description = request.description;
    if (request.color) folder.color = request.color;
    folder.metadata.modified = new Date();

    this.folders.set(folderId, folder);
    await this.saveArtifactsToStorage();
    return folder;
  }

  /**
   * Delete folder (only custom folders)
   */
  async deleteFolder(folderId: string): Promise<boolean> {
    const folder = this.folders.get(folderId);
    if (!folder || folder.isDefault) return false;

    // Move artifacts to references folder
    const referencesFolder = this.folders.get('references');
    if (referencesFolder) {
      folder.artifactIds.forEach(artifactId => {
        const artifact = this.artifacts.get(artifactId);
        if (artifact) {
          artifact.folderId = 'references';
          this.artifacts.set(artifactId, artifact);
        }
        referencesFolder.artifactIds.push(artifactId);
      });
      this.folders.set('references', referencesFolder);
    }

    this.folders.delete(folderId);
    await this.saveArtifactsToStorage();
    return true;
  }

  /**
   * Get all folders
   */
  getFolders(): ArtifactFolder[] {
    return Array.from(this.folders.values());
  }

  /**
   * Get folder by ID
   */
  getFolder(folderId: string): ArtifactFolder | null {
    return this.folders.get(folderId) || null;
  }

  /**
   * Move artifact to folder
   */
  async moveArtifactToFolder(artifactId: string, folderId: string): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    const folder = this.folders.get(folderId);

    if (!artifact || !folder) return false;

    // Remove from old folder
    if (artifact.folderId) {
      const oldFolder = this.folders.get(artifact.folderId);
      if (oldFolder) {
        oldFolder.artifactIds = oldFolder.artifactIds.filter(id => id !== artifactId);
        this.folders.set(artifact.folderId, oldFolder);
      }
    }

    // Add to new folder
    artifact.folderId = folderId;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    if (!folder.artifactIds.includes(artifactId)) {
      folder.artifactIds.push(artifactId);
      folder.metadata.modified = new Date();
      this.folders.set(folderId, folder);
    }

    await this.saveArtifactsToStorage();
    return true;
  }

  // === ACTIVATION MANAGEMENT METHODS ===

  /**
   * Activate artifact for content generation
   */
  async activateArtifact(artifactId: string, context?: ArtifactUsageContext): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.isActive = true;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    await this.saveArtifactsToStorage();
    return true;
  }

  /**
   * Deactivate artifact
   */
  async deactivateArtifact(artifactId: string): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.isActive = false;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    await this.saveArtifactsToStorage();
    return true;
  }

  /**
   * Toggle artifact activation
   */
  async toggleArtifactActivation(artifactId: string): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.isActive = !artifact.isActive;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    await this.saveArtifactsToStorage();
    return artifact.isActive;
  }

  /**
   * Get all active artifacts
   */
  getActiveArtifacts(): Artifact[] {
    const allArtifacts = Array.from(this.artifacts.values());
    const activeArtifacts = allArtifacts.filter(artifact => artifact.isActive);

    console.log(`🔍 getActiveArtifacts called:`);
    console.log(`📊 Total artifacts: ${allArtifacts.length}`);
    console.log(`✅ Active artifacts: ${activeArtifacts.length}`);
    console.log(`📋 All artifacts status:`, allArtifacts.map(a => ({
      id: a.id,
      name: a.name,
      isActive: a.isActive,
      usageType: a.usageType
    })));

    return activeArtifacts;
  }

  /**
   * Get active artifacts by usage type
   */
  getActiveArtifactsByUsageType(usageType: ArtifactUsageType): Artifact[] {
    return this.getActiveArtifacts().filter(artifact => artifact.usageType === usageType);
  }

  /**
   * Deactivate all artifacts
   */
  async deactivateAllArtifacts(): Promise<void> {
    const artifacts = Array.from(this.artifacts.values());
    for (const artifact of artifacts) {
      if (artifact.isActive) {
        artifact.isActive = false;
        artifact.timestamps.modified = new Date();
        this.artifacts.set(artifact.id, artifact);
      }
    }
    await this.saveArtifactsToStorage();
  }

  // === TEXT OVERLAY MANAGEMENT ===

  /**
   * Update artifact text overlay
   */
  async updateArtifactTextOverlay(artifactId: string, textOverlay: ArtifactTextOverlay): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.textOverlay = textOverlay;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    await this.saveArtifactsToStorage();
    return true;
  }

  /**
   * Remove artifact text overlay
   */
  async removeArtifactTextOverlay(artifactId: string): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.textOverlay = undefined;
    artifact.timestamps.modified = new Date();
    this.artifacts.set(artifactId, artifact);

    await this.saveArtifactsToStorage();
    return true;
  }

  /**
   * Update artifact usage type
   */
  async updateArtifactUsageType(artifactId: string, usageType: ArtifactUsageType): Promise<boolean> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    artifact.usageType = usageType;
    artifact.timestamps.modified = new Date();

    // Clear text overlay if changing from exact-use to reference
    if (usageType === 'reference') {
      artifact.textOverlay = undefined;
    }

    this.artifacts.set(artifactId, artifact);
    await this.saveArtifactsToStorage();
    return true;
  }

  // === ENHANCED SEARCH METHODS ===

  /**
   * Enhanced search with new filters
   */
  async searchArtifactsEnhanced(filters: EnhancedArtifactSearchFilters): Promise<ArtifactSearchResult> {
    const startTime = Date.now();
    let artifacts = Array.from(this.artifacts.values());

    // Apply existing filters (from base search)
    if (filters.query) {
      const query = filters.query.toLowerCase();
      artifacts = artifacts.filter(artifact =>
        artifact.name.toLowerCase().includes(query) ||
        artifact.description?.toLowerCase().includes(query) ||
        artifact.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.type && filters.type !== 'all') {
      artifacts = artifacts.filter(artifact => artifact.type === filters.type);
    }

    if (filters.category && filters.category !== 'all') {
      artifacts = artifacts.filter(artifact => artifact.category === filters.category);
    }

    // Apply new enhanced filters
    if (filters.usageType) {
      artifacts = artifacts.filter(artifact => artifact.usageType === filters.usageType);
    }

    if (filters.uploadType) {
      artifacts = artifacts.filter(artifact => artifact.uploadType === filters.uploadType);
    }

    if (filters.folderId) {
      artifacts = artifacts.filter(artifact => artifact.folderId === filters.folderId);
    }

    if (filters.isActive !== undefined) {
      artifacts = artifacts.filter(artifact => artifact.isActive === filters.isActive);
    }

    if (filters.hasTextOverlay !== undefined) {
      artifacts = artifacts.filter(artifact =>
        filters.hasTextOverlay ? !!artifact.textOverlay : !artifact.textOverlay
      );
    }

    // Apply pagination
    const totalCount = artifacts.length;
    if (filters.limit) {
      const offset = filters.offset || 0;
      artifacts = artifacts.slice(offset, offset + filters.limit);
    }

    const executionTime = Date.now() - startTime;

    return {
      artifacts,
      totalCount,
      searchMetadata: {
        query: filters,
        executionTime,
        suggestions: [] // Could implement search suggestions here
      }
    };
  }

  /**
   * Get artifacts by folder
   */
  getArtifactsByFolder(folderId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter(artifact => artifact.folderId === folderId);
  }
}

// Export singleton instance
export const artifactsService = new ArtifactsService();
export default ArtifactsService;
