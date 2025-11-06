/**
 * Document Types for Brand Profile Documents Feature
 * 
 * This file contains all TypeScript types and interfaces related to
 * business document uploads and processing.
 */

/**
 * Supported document types
 */
export type DocumentType = 
  | 'pitch-deck'
  | 'pricing-sheet'
  | 'product-catalog'
  | 'service-brochure'
  | 'brand-guidelines'
  | 'marketing-materials'
  | 'business-plan'
  | 'case-study'
  | 'other';

/**
 * Supported file formats
 */
export type DocumentFileFormat = 
  | 'pdf'
  | 'ppt'
  | 'pptx'
  | 'xls'
  | 'xlsx'
  | 'csv'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp';

/**
 * Document processing status
 */
export type DocumentProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

/**
 * Pricing information extracted from documents
 */
export interface ExtractedPricing {
  item: string;
  price: string;
  currency?: string;
  description?: string;
  category?: string;
  discount?: string;
  validUntil?: string;
}

/**
 * Product information extracted from documents
 */
export interface ExtractedProduct {
  name: string;
  description?: string;
  features?: string[];
  specifications?: Record<string, string>;
  category?: string;
  sku?: string;
  images?: string[];
}

/**
 * Service information extracted from documents
 */
export interface ExtractedService {
  name: string;
  description?: string;
  benefits?: string[];
  duration?: string;
  deliverables?: string[];
  targetAudience?: string;
}

/**
 * Brand messaging extracted from documents
 */
export interface ExtractedBrandMessaging {
  tagline?: string;
  missionStatement?: string;
  visionStatement?: string;
  keyMessages?: string[];
  valuePropositions?: string[];
  brandStory?: string;
}

/**
 * Visual brand elements extracted from documents
 */
export interface ExtractedVisualElements {
  colors?: string[];
  fonts?: string[];
  logoGuidelines?: string;
  imageStyle?: string;
  designPrinciples?: string[];
}

/**
 * Complete extracted data structure
 */
export interface ExtractedDocumentData {
  pricing?: ExtractedPricing[];
  products?: ExtractedProduct[];
  services?: ExtractedService[];
  valuePropositions?: string[];
  targetAudience?: string;
  competitiveAdvantages?: string[];
  brandMessaging?: ExtractedBrandMessaging;
  visualElements?: ExtractedVisualElements;
  keyInsights?: string[];
  rawText?: string; // Full extracted text for reference
}

/**
 * Document metadata and content
 */
export interface BrandDocument {
  id: string;
  filename: string;
  fileType: DocumentType;
  fileFormat: DocumentFileFormat;
  fileSize: number;
  url: string;
  path: string;
  uploadDate: string;
  processingStatus: DocumentProcessingStatus;
  extractedData?: ExtractedDocumentData;
  errorMessage?: string;
}

/**
 * Document upload request
 */
export interface DocumentUploadRequest {
  file: File;
  documentType: DocumentType;
  brandProfileId: string;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  success: boolean;
  document?: BrandDocument;
  error?: string;
}

/**
 * Document extraction request
 */
export interface DocumentExtractionRequest {
  documentId: string;
  documentUrl: string;
  fileFormat: DocumentFileFormat;
  businessType?: string;
}

/**
 * Document extraction response
 */
export interface DocumentExtractionResponse {
  success: boolean;
  extractedData?: ExtractedDocumentData;
  error?: string;
}

/**
 * Business-type specific document suggestions
 */
export interface DocumentSuggestions {
  businessType: string;
  recommended: Array<{
    type: DocumentType;
    label: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Document validation rules
 */
export interface DocumentValidationRules {
  maxFileSize: number; // in bytes
  maxDocumentsPerProfile: number;
  allowedFormats: DocumentFileFormat[];
  allowedTypes: DocumentType[];
}

/**
 * Default validation rules
 */
export const DEFAULT_DOCUMENT_VALIDATION: DocumentValidationRules = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxDocumentsPerProfile: 10,
  allowedFormats: ['pdf', 'ppt', 'pptx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'webp'],
  allowedTypes: [
    'pitch-deck',
    'pricing-sheet',
    'product-catalog',
    'service-brochure',
    'brand-guidelines',
    'marketing-materials',
    'business-plan',
    'case-study',
    'other'
  ]
};

/**
 * Business-type specific document suggestions
 */
export const BUSINESS_TYPE_DOCUMENT_SUGGESTIONS: Record<string, DocumentSuggestions> = {
  retail: {
    businessType: 'retail',
    recommended: [
      { type: 'pricing-sheet', label: 'Pricing Sheet', description: 'Product prices, discounts, promotions', priority: 'high' },
      { type: 'product-catalog', label: 'Product Catalog', description: 'Product listings with descriptions', priority: 'high' },
      { type: 'marketing-materials', label: 'Marketing Materials', description: 'Promotional flyers, brochures', priority: 'medium' }
    ]
  },
  finance: {
    businessType: 'finance',
    recommended: [
      { type: 'service-brochure', label: 'Service Brochure', description: 'Financial services offered', priority: 'high' },
      { type: 'pricing-sheet', label: 'Rate Sheet', description: 'Interest rates, fees, charges', priority: 'high' },
      { type: 'case-study', label: 'Case Studies', description: 'Client success stories', priority: 'medium' }
    ]
  },
  saas: {
    businessType: 'saas',
    recommended: [
      { type: 'pitch-deck', label: 'Pitch Deck', description: 'Product overview and value proposition', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing Tiers', description: 'Subscription plans and features', priority: 'high' },
      { type: 'case-study', label: 'Case Studies', description: 'Customer success stories', priority: 'medium' }
    ]
  },
  food: {
    businessType: 'food',
    recommended: [
      { type: 'product-catalog', label: 'Menu', description: 'Food items with prices', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing List', description: 'Menu prices and specials', priority: 'high' },
      { type: 'marketing-materials', label: 'Promotional Materials', description: 'Special offers, events', priority: 'medium' }
    ]
  },
  healthcare: {
    businessType: 'healthcare',
    recommended: [
      { type: 'service-brochure', label: 'Service Brochure', description: 'Healthcare services offered', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing Information', description: 'Service costs and packages', priority: 'high' },
      { type: 'marketing-materials', label: 'Facility Information', description: 'Facility details and amenities', priority: 'medium' }
    ]
  },
  realestate: {
    businessType: 'realestate',
    recommended: [
      { type: 'product-catalog', label: 'Property Listings', description: 'Available properties', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing Sheet', description: 'Property prices and terms', priority: 'high' },
      { type: 'marketing-materials', label: 'Brochures', description: 'Property marketing materials', priority: 'medium' }
    ]
  },
  education: {
    businessType: 'education',
    recommended: [
      { type: 'product-catalog', label: 'Course Catalog', description: 'Available courses and programs', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing Information', description: 'Tuition and fees', priority: 'high' },
      { type: 'marketing-materials', label: 'Program Brochures', description: 'Program details and benefits', priority: 'medium' }
    ]
  },
  b2b: {
    businessType: 'b2b',
    recommended: [
      { type: 'pitch-deck', label: 'Pitch Deck', description: 'Company overview and solutions', priority: 'high' },
      { type: 'case-study', label: 'Case Studies', description: 'Client success stories', priority: 'high' },
      { type: 'service-brochure', label: 'Service Agreements', description: 'Service offerings and terms', priority: 'medium' }
    ]
  },
  service: {
    businessType: 'service',
    recommended: [
      { type: 'service-brochure', label: 'Service Catalog', description: 'Services offered with details', priority: 'high' },
      { type: 'pricing-sheet', label: 'Pricing Sheet', description: 'Service rates and packages', priority: 'high' },
      { type: 'marketing-materials', label: 'Portfolio Materials', description: 'Work samples and testimonials', priority: 'medium' }
    ]
  },
  nonprofit: {
    businessType: 'nonprofit',
    recommended: [
      { type: 'marketing-materials', label: 'Impact Reports', description: 'Program impact and results', priority: 'high' },
      { type: 'service-brochure', label: 'Program Materials', description: 'Program descriptions', priority: 'high' },
      { type: 'case-study', label: 'Success Stories', description: 'Beneficiary stories', priority: 'medium' }
    ]
  }
};

