/**
 * OpenAI File Service
 * 
 * Handles uploading files to OpenAI for use with Assistants API
 * Supports file_search tool for document understanding
 */

import OpenAI from 'openai';
import type { BrandDocument } from '@/types/documents';
import { EnhancedOpenAIClient } from './openai-client-enhanced';

/**
 * Supported file types for OpenAI file_search
 * Based on: https://platform.openai.com/docs/assistants/tools/file-search
 */
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
];

/**
 * File size limits
 * OpenAI has a 512MB limit per file, but we'll use a more conservative limit
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * OpenAI File Upload Result
 */
export interface OpenAIFileUploadResult {
  fileId: string;
  filename: string;
  bytes: number;
  purpose: string;
  status: string;
  createdAt: number;
}

/**
 * Vector Store Result
 */
export interface VectorStoreResult {
  vectorStoreId: string;
  name: string;
  fileIds: string[];
  status: string;
  createdAt: number;
}

/**
 * OpenAI File Service Class
 */
export class OpenAIFileService {
  /**
   * Upload a file to OpenAI for use with Assistants
   */
  async uploadFile(fileUrl: string, filename: string, mimeType: string): Promise<OpenAIFileUploadResult> {
    try {
      // Validate file type
      if (!SUPPORTED_FILE_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported file type: ${mimeType}. Only PDF, DOCX, TXT, CSV, XLSX, PPTX are supported.`);
      }

      // Download file from URL
      console.log(`📥 [OpenAI File Service] Downloading file from: ${fileUrl}`);
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate file size
      if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      console.log(`📤 [OpenAI File Service] Uploading file to OpenAI: ${filename} (${(buffer.length / 1024).toFixed(2)}KB)`);

      // Create a File object from buffer
      const file = new File([buffer], filename, { type: mimeType });

      // Upload to OpenAI using enhanced client
      const openai = EnhancedOpenAIClient.getDirectClient();
      const uploadedFile = await openai.files.create({
        file: file,
        purpose: 'assistants',
      });

      console.log(`✅ [OpenAI File Service] File uploaded successfully: ${uploadedFile.id}`);

      return {
        fileId: uploadedFile.id,
        filename: uploadedFile.filename,
        bytes: uploadedFile.bytes,
        purpose: uploadedFile.purpose,
        status: uploadedFile.status,
        createdAt: uploadedFile.created_at,
      };

    } catch (error) {
      console.error(`❌ [OpenAI File Service] Upload failed:`, error);
      throw error;
    }
  }

  /**
   * Upload multiple files to OpenAI
   */
  async uploadMultipleFiles(documents: BrandDocument[]): Promise<OpenAIFileUploadResult[]> {
    const results: OpenAIFileUploadResult[] = [];

    for (const doc of documents) {
      try {
        // Only upload supported file types
        const mimeType = this.getMimeType(doc.fileFormat);
        if (!SUPPORTED_FILE_TYPES.includes(mimeType)) {
          console.warn(`⚠️  [OpenAI File Service] Skipping unsupported file type: ${doc.fileFormat}`);
          continue;
        }

        const result = await this.uploadFile(doc.url, doc.filename, mimeType);
        results.push(result);

      } catch (error) {
        console.error(`❌ [OpenAI File Service] Failed to upload ${doc.filename}:`, error);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  /**
   * Create a vector store with uploaded files
   * Vector stores are used by the file_search tool
   */
  async createVectorStore(
    fileIds: string[],
    name: string = 'Brand Documents'
  ): Promise<VectorStoreResult> {
    try {
      console.log(`📚 [OpenAI File Service] Creating vector store with ${fileIds.length} files`);

      const openai = EnhancedOpenAIClient.getDirectClient();
      const vectorStore = await openai.beta.vectorStores.create({
        name: name,
        file_ids: fileIds,
      });

      console.log(`✅ [OpenAI File Service] Vector store created: ${vectorStore.id}`);

      return {
        vectorStoreId: vectorStore.id,
        name: vectorStore.name || name,
        fileIds: fileIds,
        status: vectorStore.status,
        createdAt: vectorStore.created_at,
      };

    } catch (error) {
      console.error(`❌ [OpenAI File Service] Vector store creation failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from OpenAI
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log(`🗑️  [OpenAI File Service] Deleting file: ${fileId}`);
      const openai = EnhancedOpenAIClient.getDirectClient();
      await openai.files.del(fileId);
      console.log(`✅ [OpenAI File Service] File deleted successfully`);
    } catch (error) {
      console.error(`❌ [OpenAI File Service] File deletion failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a vector store from OpenAI
   */
  async deleteVectorStore(vectorStoreId: string): Promise<void> {
    try {
      console.log(`🗑️  [OpenAI File Service] Deleting vector store: ${vectorStoreId}`);
      const openai = EnhancedOpenAIClient.getDirectClient();
      await openai.beta.vectorStores.del(vectorStoreId);
      console.log(`✅ [OpenAI File Service] Vector store deleted successfully`);
    } catch (error) {
      console.error(`❌ [OpenAI File Service] Vector store deletion failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a file type is supported by OpenAI file_search
   */
  isFileTypeSupported(mimeType: string): boolean {
    return SUPPORTED_FILE_TYPES.includes(mimeType);
  }

  /**
   * Get MIME type from file format
   */
  private getMimeType(fileFormat: string): string {
    const mimeTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'ppt': 'application/vnd.ms-powerpoint',
    };

    return mimeTypeMap[fileFormat.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get file size limit in MB
   */
  getMaxFileSizeMB(): number {
    return MAX_FILE_SIZE / 1024 / 1024;
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): string[] {
    return SUPPORTED_FILE_TYPES;
  }
}

// Export singleton instance
export const openAIFileService = new OpenAIFileService();

