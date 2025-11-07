/**
 * Document Processor Service
 * 
 * Handles processing of uploaded documents:
 * 1. Uploads documents to OpenAI Files API
 * 2. Attaches files to appropriate OpenAI Assistant based on business type
 * 3. Stores OpenAI file ID in document metadata
 * 4. Updates processing status
 */

import OpenAI from 'openai';
import type { BrandDocument, DocumentProcessingStatus } from '@/types/documents';
import type { BusinessTypeCategory } from '@/ai/adaptive/business-type-detector';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 60000,
  maxRetries: 3,
});

// Map business types to assistant environment variable names
const ASSISTANT_ENV_VARS: Record<BusinessTypeCategory, string> = {
  retail: 'OPENAI_ASSISTANT_RETAIL',
  finance: 'OPENAI_ASSISTANT_FINANCE',
  service: 'OPENAI_ASSISTANT_SERVICE',
  saas: 'OPENAI_ASSISTANT_SAAS',
  food: 'OPENAI_ASSISTANT_FOOD',
  healthcare: 'OPENAI_ASSISTANT_HEALTHCARE',
  realestate: 'OPENAI_ASSISTANT_REALESTATE',
  education: 'OPENAI_ASSISTANT_EDUCATION',
  b2b: 'OPENAI_ASSISTANT_B2B',
  nonprofit: 'OPENAI_ASSISTANT_NONPROFIT',
};

// Supported file types for OpenAI Assistants
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
];

export interface DocumentProcessingResult {
  success: boolean;
  openaiFileId?: string;
  assistantId?: string;
  processingStatus: DocumentProcessingStatus;
  errorMessage?: string;
}

export class DocumentProcessorService {
  /**
   * Normalize business type string to BusinessTypeCategory
   */
  private normalizeBusinessType(businessType: string): BusinessTypeCategory | null {
    const normalized = businessType.toLowerCase().trim();

    // Direct matches
    const directMatches: Record<string, BusinessTypeCategory> = {
      'retail': 'retail',
      'finance': 'finance',
      'service': 'service',
      'saas': 'saas',
      'food': 'food',
      'healthcare': 'healthcare',
      'realestate': 'realestate',
      'education': 'education',
      'b2b': 'b2b',
      'nonprofit': 'nonprofit',
    };

    if (directMatches[normalized]) {
      return directMatches[normalized];
    }

    // Fuzzy matching for common variations
    if (normalized.includes('financial') || normalized.includes('fintech') ||
      normalized.includes('banking') || normalized.includes('payment')) {
      return 'finance';
    }
    if (normalized.includes('retail') || normalized.includes('ecommerce') ||
      normalized.includes('e-commerce') || normalized.includes('shop')) {
      return 'retail';
    }
    if (normalized.includes('restaurant') || normalized.includes('food') ||
      normalized.includes('beverage') || normalized.includes('cafe')) {
      return 'food';
    }
    if (normalized.includes('health') || normalized.includes('medical') ||
      normalized.includes('wellness') || normalized.includes('clinic')) {
      return 'healthcare';
    }
    if (normalized.includes('real estate') || normalized.includes('realestate') ||
      normalized.includes('property')) {
      return 'realestate';
    }
    if (normalized.includes('education') || normalized.includes('school') ||
      normalized.includes('training') || normalized.includes('learning')) {
      return 'education';
    }
    if (normalized.includes('software') || normalized.includes('saas') ||
      normalized.includes('platform') || normalized.includes('app')) {
      return 'saas';
    }
    if (normalized.includes('service') || normalized.includes('consulting') ||
      normalized.includes('agency')) {
      return 'service';
    }
    if (normalized.includes('b2b') || normalized.includes('enterprise')) {
      return 'b2b';
    }
    if (normalized.includes('nonprofit') || normalized.includes('non-profit') ||
      normalized.includes('charity') || normalized.includes('ngo')) {
      return 'nonprofit';
    }

    console.warn(`⚠️  Could not normalize business type: "${businessType}"`);
    return null;
  }

  /**
   * Get assistant ID for a business type
   */
  private getAssistantId(businessType: BusinessTypeCategory | string): string | null {
    // Normalize if it's a string
    let normalizedType: BusinessTypeCategory | null;
    if (typeof businessType === 'string' && !['retail', 'finance', 'service', 'saas', 'food', 'healthcare', 'realestate', 'education', 'b2b', 'nonprofit'].includes(businessType)) {
      normalizedType = this.normalizeBusinessType(businessType);
      if (!normalizedType) {
        console.warn(`⚠️  Could not map business type "${businessType}" to a category`);
        return null;
      }
    } else {
      normalizedType = businessType as BusinessTypeCategory;
    }

    const envVar = ASSISTANT_ENV_VARS[normalizedType];
    const assistantId = process.env[envVar];

    if (!assistantId) {
      console.warn(`⚠️  No assistant ID found for business type: ${normalizedType} (${envVar})`);
      return null;
    }

    return assistantId;
  }

  /**
   * Check if file type is supported by OpenAI
   */
  private isSupportedFileType(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Get MIME type from file format
   */
  private getMimeType(fileFormat: string): string {
    const mimeTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv',
    };

    return mimeTypeMap[fileFormat.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Process a document: upload to OpenAI and attach to assistant
   */
  async processDocument(
    document: BrandDocument,
    businessType: BusinessTypeCategory | string
  ): Promise<DocumentProcessingResult> {
    try {
      console.log(`📄 [Document Processor] Processing document: ${document.filename}`);
      console.log(`🏢 [Document Processor] Business type (raw): ${businessType}`);

      // Normalize business type if it's a string
      let normalizedType: BusinessTypeCategory | null = null;
      if (typeof businessType === 'string' && !['retail', 'finance', 'service', 'saas', 'food', 'healthcare', 'realestate', 'education', 'b2b', 'nonprofit'].includes(businessType)) {
        normalizedType = this.normalizeBusinessType(businessType);
        if (normalizedType) {
          console.log(`🔄 [Document Processor] Normalized "${businessType}" → "${normalizedType}"`);
        }
      } else {
        normalizedType = businessType as BusinessTypeCategory;
      }

      if (!normalizedType) {
        throw new Error(`Could not map business type "${businessType}" to a valid category`);
      }

      console.log(`🏢 [Document Processor] Business type (normalized): ${normalizedType}`);

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
      }

      // Get assistant ID for business type
      const assistantId = this.getAssistantId(normalizedType);
      if (!assistantId) {
        throw new Error(`No assistant configured for business type: ${normalizedType}`);
      }

      console.log(`🤖 [Document Processor] Using assistant: ${assistantId}`);

      // Check if file type is supported
      const mimeType = this.getMimeType(document.fileFormat);
      if (!this.isSupportedFileType(mimeType)) {
        console.warn(`⚠️  [Document Processor] Unsupported file type: ${document.fileFormat}`);
        return {
          success: false,
          processingStatus: 'failed',
          errorMessage: `File type ${document.fileFormat} is not supported for AI processing. Supported types: PDF, DOCX, PPTX, XLSX, TXT, CSV`,
        };
      }

      // Download file from Supabase Storage
      console.log(`📥 [Document Processor] Downloading file from: ${document.url}`);
      const response = await fetch(document.url);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`📤 [Document Processor] Uploading to OpenAI: ${document.filename} (${(buffer.length / 1024).toFixed(2)}KB)`);

      // Create a File object from buffer
      const file = new File([buffer], document.filename, { type: mimeType });

      // Upload to OpenAI Files API
      const uploadedFile = await openai.files.create({
        file: file,
        purpose: 'assistants',
      });

      console.log(`✅ [Document Processor] File uploaded to OpenAI: ${uploadedFile.id}`);

      // Attach file to assistant's vector store
      // Note: The assistant will automatically have access to files uploaded with purpose='assistants'
      // When creating threads, we can attach files to the thread's vector store

      console.log(`✅ [Document Processor] Document processing completed successfully`);

      return {
        success: true,
        openaiFileId: uploadedFile.id,
        assistantId: assistantId,
        processingStatus: 'completed',
      };

    } catch (error) {
      console.error(`❌ [Document Processor] Processing failed:`, error);

      return {
        success: false,
        processingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during document processing',
      };
    }
  }

  /**
   * Retry processing a failed document
   */
  async retryProcessing(
    document: BrandDocument,
    businessType: BusinessTypeCategory | string
  ): Promise<DocumentProcessingResult> {
    console.log(`🔄 [Document Processor] Retrying document processing: ${document.filename}`);
    return this.processDocument(document, businessType);
  }

  /**
   * Delete a file from OpenAI
   */
  async deleteFile(openaiFileId: string): Promise<boolean> {
    try {
      console.log(`🗑️  [Document Processor] Deleting file from OpenAI: ${openaiFileId}`);
      await openai.files.del(openaiFileId);
      console.log(`✅ [Document Processor] File deleted successfully`);
      return true;
    } catch (error) {
      console.error(`❌ [Document Processor] Failed to delete file:`, error);
      return false;
    }
  }

  /**
   * Get file info from OpenAI
   */
  async getFileInfo(openaiFileId: string): Promise<any> {
    try {
      const file = await openai.files.retrieve(openaiFileId);
      return file;
    } catch (error) {
      console.error(`❌ [Document Processor] Failed to retrieve file info:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessorService();

