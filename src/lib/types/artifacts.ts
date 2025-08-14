// src/lib/types/artifacts.ts
/**
 * Comprehensive type definitions for the Artifacts system
 * Supports images, screenshots, documents, and custom generation directions
 */

export type ArtifactType =
  | 'image'
  | 'screenshot'
  | 'document'
  | 'logo'
  | 'template'
  | 'reference';

export type ArtifactCategory =
  | 'brand-assets'
  | 'product-images'
  | 'screenshots'
  | 'templates'
  | 'references'
  | 'logos'
  | 'backgrounds'
  | 'uncategorized';

// New enhanced types for the improved artifacts system
export type ArtifactUploadType = 'image' | 'text' | 'document';

export type ArtifactUsageType = 'reference' | 'exact-use';

export type FolderType = 'default' | 'custom';

export type ArtifactUsageContext =
  | 'quick-content'
  | 'creative-studio'
  | 'content-calendar'
  | 'brand-profile';

// Text overlay configuration for exact-use artifacts
export interface ArtifactTextOverlay {
  /** Main headline text (required for exact-use) */
  headline?: string;
  /** Concise message text (required for exact-use) */
  message?: string;
  /** Call to action text (optional) */
  cta?: string;
  /** Contact information (optional) */
  contact?: string;
  /** Discount information (optional) */
  discount?: string;
  /** Usage instructions (optional) - e.g., "put this in a phone", "this jacket be on this" */
  instructions?: string;
}

// Folder interface for organizing artifacts
export interface ArtifactFolder {
  /** Unique folder identifier */
  id: string;
  /** Folder display name */
  name: string;
  /** Folder description */
  description?: string;
  /** Folder type (default system folders vs custom user folders) */
  type: FolderType;
  /** Artifact IDs in this folder */
  artifactIds: string[];
  /** Folder metadata */
  metadata: {
    created: Date;
    modified: Date;
    createdBy?: string;
  };
  /** Folder color/theme for UI */
  color?: string;
  /** Whether this is a system default folder */
  isDefault: boolean;
}

export interface ArtifactMetadata {
  /** File size in bytes */
  fileSize: number;
  /** MIME type of the file */
  mimeType: string;
  /** Image dimensions (for images) */
  dimensions?: {
    width: number;
    height: number;
  };
  /** Color palette extracted from image */
  colorPalette?: string[];
  /** Dominant colors */
  dominantColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Text content (for OCR or document text) */
  extractedText?: string;
  /** Image analysis results */
  imageAnalysis?: {
    hasText: boolean;
    hasPeople: boolean;
    hasProducts: boolean;
    style: string;
    mood: string;
  };
}

export interface GenerationDirective {
  /** Unique identifier for the directive */
  id: string;
  /** Type of directive */
  type: 'text-overlay' | 'style-reference' | 'color-scheme' | 'composition' | 'custom';
  /** Human-readable label */
  label: string;
  /** Detailed instruction for AI */
  instruction: string;
  /** Priority level (1-10) */
  priority: number;
  /** Whether this directive is active */
  active: boolean;
  /** Context where this directive applies */
  context?: ArtifactUsageContext[];
}

export interface TextOverlayDirective extends GenerationDirective {
  type: 'text-overlay';
  /** Exact text to include */
  exactText: string;
  /** Text positioning preferences */
  positioning?: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  /** Text styling preferences */
  styling?: {
    fontSize: 'small' | 'medium' | 'large' | 'xl';
    fontWeight: 'normal' | 'bold' | 'extra-bold';
    color?: string;
    backgroundColor?: string;
  };
}

export interface StyleReferenceDirective extends GenerationDirective {
  type: 'style-reference';
  /** Reference style elements */
  styleElements: {
    layout?: boolean;
    colorScheme?: boolean;
    typography?: boolean;
    composition?: boolean;
    mood?: boolean;
  };
  /** Adaptation instructions */
  adaptationLevel: 'strict' | 'moderate' | 'loose' | 'inspiration-only';
}

export interface Artifact {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Optional description */
  description?: string;
  /** Artifact type */
  type: ArtifactType;
  /** Category for organization */
  category: ArtifactCategory;
  /** Usage type - reference for inspiration or exact-use for direct integration */
  usageType: ArtifactUsageType;
  /** Upload type classification */
  uploadType: ArtifactUploadType;
  /** Folder ID this artifact belongs to */
  folderId?: string;
  /** Whether this artifact is currently active for content generation */
  isActive: boolean;
  /** Usage instructions for exact-use artifacts (optional) - e.g., "put this in a phone", "this jacket be on this" */
  instructions?: string;
  /** Text overlay configuration for exact-use artifacts */
  textOverlay?: ArtifactTextOverlay;
  /** File path or URL */
  filePath: string;
  /** Thumbnail path (for images) */
  thumbnailPath?: string;
  /** File metadata */
  metadata: ArtifactMetadata;
  /** Generation directives associated with this artifact */
  directives: GenerationDirective[];
  /** Tags for searchability */
  tags: string[];
  /** Usage tracking */
  usage: {
    /** Number of times used in generation */
    usageCount: number;
    /** Last used timestamp */
    lastUsed?: Date;
    /** Contexts where it's been used */
    usedInContexts: ArtifactUsageContext[];
  };
  /** Creation and modification timestamps */
  timestamps: {
    created: Date;
    modified: Date;
    uploaded: Date;
  };
  /** User-defined custom properties */
  customProperties?: Record<string, any>;
}

export interface ArtifactCollection {
  /** Collection identifier */
  id: string;
  /** Collection name */
  name: string;
  /** Collection description */
  description?: string;
  /** Artifacts in this collection */
  artifactIds: string[];
  /** Collection metadata */
  metadata: {
    created: Date;
    modified: Date;
    createdBy: string;
  };
  /** Collection tags */
  tags: string[];
}

export interface ArtifactSearchFilters {
  /** Filter by type */
  types?: ArtifactType[];
  /** Filter by category */
  categories?: ArtifactCategory[];
  /** Filter by tags */
  tags?: string[];
  /** Text search in name/description */
  searchText?: string;
  /** Filter by usage context */
  usageContext?: ArtifactUsageContext;
  /** Filter by date range */
  dateRange?: {
    start: Date;
    end: Date;
  };
  /** Filter by file size range */
  fileSizeRange?: {
    min: number;
    max: number;
  };
  /** Filter by dimensions (for images) */
  dimensionsRange?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
}

export interface ArtifactSearchResult {
  /** Matching artifacts */
  artifacts: Artifact[];
  /** Total count (for pagination) */
  totalCount: number;
  /** Search metadata */
  searchMetadata: {
    query: ArtifactSearchFilters;
    executionTime: number;
    suggestions?: string[];
  };
}

export interface ArtifactUploadConfig {
  /** Maximum file size in bytes */
  maxFileSize: number;
  /** Allowed file types */
  allowedTypes: string[];
  /** Whether to generate thumbnails */
  generateThumbnails: boolean;
  /** Whether to extract metadata */
  extractMetadata: boolean;
  /** Whether to perform image analysis */
  performImageAnalysis: boolean;
  /** Storage configuration */
  storage: {
    provider: 'local' | 'cloudinary' | 's3' | 'firebase';
    basePath: string;
    publicUrl: string;
  };
}

// Enhanced upload configuration with new fields
export interface EnhancedArtifactUploadConfig extends ArtifactUploadConfig {
  /** Default folder for new uploads */
  defaultFolderId?: string;
  /** Whether to require text overlay for exact-use artifacts */
  requireTextOverlayForExactUse: boolean;
  /** Auto-activate artifacts after upload */
  autoActivateAfterUpload: boolean;
}

// Folder management interfaces
export interface FolderCreateRequest {
  name: string;
  description?: string;
  color?: string;
  type: FolderType;
}

export interface FolderUpdateRequest {
  name?: string;
  description?: string;
  color?: string;
}

// Artifact activation management
export interface ArtifactActivationState {
  artifactId: string;
  isActive: boolean;
  activatedAt?: Date;
  activatedFor?: ArtifactUsageContext;
}

// Enhanced search filters
export interface EnhancedArtifactSearchFilters extends ArtifactSearchFilters {
  /** Filter by usage type */
  usageType?: ArtifactUsageType;
  /** Filter by upload type */
  uploadType?: ArtifactUploadType;
  /** Filter by folder */
  folderId?: string;
  /** Filter by activation status */
  isActive?: boolean;
  /** Filter by artifacts with text overlays */
  hasTextOverlay?: boolean;
}

export interface GenerationRequest {
  /** Request identifier */
  id: string;
  /** Context where generation is happening */
  context: ArtifactUsageContext;
  /** Base generation parameters */
  baseParams: {
    businessType: string;
    platform: string;
    contentType: string;
    visualStyle: string;
  };
  /** Referenced artifacts */
  referencedArtifacts: {
    artifactId: string;
    role: 'primary-reference' | 'style-guide' | 'text-source' | 'background' | 'overlay';
    weight: number; // 0-1, how much influence this artifact should have
  }[];
  /** Active directives from artifacts */
  activeDirectives: GenerationDirective[];
  /** Custom generation instructions */
  customInstructions?: string;
  /** Generation preferences */
  preferences: {
    prioritizeArtifacts: boolean;
    allowArtifactModification: boolean;
    maintainBrandConsistency: boolean;
  };
}

// Utility types for component props
export type ArtifactCardProps = {
  artifact: Artifact;
  onSelect?: (artifact: Artifact) => void;
  onEdit?: (artifact: Artifact) => void;
  onDelete?: (artifactId: string) => void;
  selected?: boolean;
  showUsageStats?: boolean;
};

export type ArtifactGalleryProps = {
  artifacts: Artifact[];
  filters?: ArtifactSearchFilters;
  onFilterChange?: (filters: ArtifactSearchFilters) => void;
  onArtifactSelect?: (artifact: Artifact) => void;
  selectionMode?: 'single' | 'multiple' | 'none';
  selectedArtifacts?: string[];
  layout?: 'grid' | 'list' | 'masonry';
};

export type ArtifactUploadProps = {
  onUploadComplete?: (artifacts: Artifact[]) => void;
  onUploadError?: (error: Error) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  category?: ArtifactCategory;
  autoGenerateDirectives?: boolean;
};
