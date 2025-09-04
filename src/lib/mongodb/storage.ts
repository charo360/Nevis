// MongoDB GridFS storage service (replaces Firebase Storage)
import { GridFSBucket, ObjectId } from 'mongodb';
import { getDatabase } from './config';
import { Readable } from 'stream';

// Storage paths (similar to Firebase Storage structure)
export const STORAGE_PATHS = {
  ARTIFACTS: 'artifacts',
  BRAND_ASSETS: 'brand-assets',
  GENERATED_CONTENT: 'generated-content',
  TEMP: 'temp',
} as const;

// File upload options
export interface UploadOptions {
  metadata?: Record<string, any>;
  contentType?: string;
  userId: string;
  category?: string;
}

// Upload result
export interface UploadResult {
  fileId: string;
  filename: string;
  url: string;
  metadata: {
    size: number;
    contentType: string;
    uploadDate: Date;
    userId: string;
    category?: string;
  };
}

// File info
export interface FileInfo {
  _id: ObjectId;
  filename: string;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: Record<string, any>;
}

class GridFSStorageService {
  private bucket: GridFSBucket | null = null;

  // Get GridFS bucket
  private async getBucket(): Promise<GridFSBucket> {
    if (!this.bucket) {
      const db = await getDatabase();
      this.bucket = new GridFSBucket(db, { bucketName: 'nevis_files' });
    }
    return this.bucket;
  }

  // Upload file from buffer
  async uploadFromBuffer(
    buffer: Buffer,
    filename: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const bucket = await this.getBucket();
    
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: options.contentType,
      metadata: {
        userId: options.userId,
        category: options.category,
        uploadedAt: new Date(),
        ...options.metadata,
      },
    });

    return new Promise((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        const result: UploadResult = {
          fileId: uploadStream.id.toString(),
          filename: uploadStream.filename,
          url: `/api/files/${uploadStream.id}`,
          metadata: {
            size: buffer.length,
            contentType: options.contentType || 'application/octet-stream',
            uploadDate: new Date(),
            userId: options.userId,
            category: options.category,
          },
        };
        resolve(result);
      });

      // Create readable stream from buffer
      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  // Upload file from File object (browser)
  async uploadFile(
    file: File,
    basePath: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${basePath}/${options.userId}/${Date.now()}-${file.name}`;
    
    return this.uploadFromBuffer(buffer, filename, {
      ...options,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        originalSize: file.size,
        ...options.metadata,
      },
    });
  }

  // Upload data URL as image
  async uploadDataUrlAsImage(
    dataUrl: string,
    filename: string,
    options: UploadOptions
  ): Promise<UploadResult> {
    // Extract base64 data from data URL
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid data URL format');
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const fullFilename = `${STORAGE_PATHS.GENERATED_CONTENT}/${options.userId}/${Date.now()}-${filename}`;
    
    return this.uploadFromBuffer(buffer, fullFilename, {
      ...options,
      contentType,
      metadata: {
        source: 'data-url',
        originalFormat: contentType,
        ...options.metadata,
      },
    });
  }

  // Download file as buffer
  async downloadFile(fileId: string): Promise<{ buffer: Buffer; info: FileInfo }> {
    const bucket = await this.getBucket();
    const objectId = new ObjectId(fileId);

    // Get file info
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const fileInfo = files[0];

    // Download file
    const downloadStream = bucket.openDownloadStream(objectId);
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadStream.on('error', reject);
      
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, info: fileInfo });
      });
    });
  }

  // Get file info
  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    const bucket = await this.getBucket();
    const objectId = new ObjectId(fileId);

    const files = await bucket.find({ _id: objectId }).toArray();
    return files.length > 0 ? files[0] : null;
  }

  // Delete file
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const bucket = await this.getBucket();
      const objectId = new ObjectId(fileId);
      
      await bucket.delete(objectId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // List files by user
  async listFilesByUser(
    userId: string,
    category?: string,
    limit: number = 50
  ): Promise<FileInfo[]> {
    const bucket = await this.getBucket();
    
    const filter: any = { 'metadata.userId': userId };
    if (category) {
      filter['metadata.category'] = category;
    }

    return await bucket.find(filter).limit(limit).toArray();
  }

  // Get file URL (for serving files)
  getFileUrl(fileId: string): string {
    return `/api/files/${fileId}`;
  }

  // Upload artifact file
  async uploadArtifactFile(
    file: File,
    artifactId: string,
    userId: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.uploadFile(file, STORAGE_PATHS.ARTIFACTS, {
      userId,
      category: 'artifact',
      metadata: {
        artifactId,
        type: 'artifact',
        ...options?.metadata,
      },
      ...options,
    });
  }

  // Upload brand asset
  async uploadBrandAsset(
    file: File,
    assetType: 'logo' | 'design-example' | 'other',
    userId: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.uploadFile(file, STORAGE_PATHS.BRAND_ASSETS, {
      userId,
      category: 'brand-asset',
      metadata: {
        assetType,
        type: 'brand-asset',
        ...options?.metadata,
      },
      ...options,
    });
  }

  // Upload generated content
  async uploadGeneratedContent(
    file: File,
    contentType: 'image' | 'video',
    userId: string,
    postId?: string,
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return this.uploadFile(file, STORAGE_PATHS.GENERATED_CONTENT, {
      userId,
      category: 'generated-content',
      metadata: {
        contentType,
        postId: postId || '',
        type: 'generated-content',
        ...options?.metadata,
      },
      ...options,
    });
  }

  // Generate thumbnail (placeholder - you might want to use a library like sharp)
  async generateThumbnail(
    originalBuffer: Buffer,
    maxWidth: number = 300,
    maxHeight: number = 300
  ): Promise<Buffer> {
    // For now, return the original buffer
    // In a real implementation, you'd use a library like sharp to resize the image
    return originalBuffer;
  }

  // Compress image (placeholder - you might want to use a library like sharp)
  async compressImage(
    originalBuffer: Buffer,
    quality: number = 0.8
  ): Promise<Buffer> {
    // For now, return the original buffer
    // In a real implementation, you'd use a library like sharp to compress the image
    return originalBuffer;
  }
}

// Export singleton instance
export const storageService = new GridFSStorageService();

// Convenience functions (matching Firebase Storage API)
export async function uploadFile(
  file: File,
  basePath: string,
  userId: string,
  options?: Partial<UploadOptions>
): Promise<UploadResult> {
  return storageService.uploadFile(file, basePath, { userId, ...options });
}

export async function uploadDataUrlAsImage(
  dataUrl: string,
  filename: string,
  userId: string,
  postId?: string,
  options?: Partial<UploadOptions>
): Promise<UploadResult> {
  return storageService.uploadDataUrlAsImage(dataUrl, filename, {
    userId,
    metadata: { postId, ...options?.metadata },
    ...options,
  });
}

export async function deleteFile(fileId: string): Promise<boolean> {
  return storageService.deleteFile(fileId);
}

export function getFileUrl(fileId: string): string {
  return storageService.getFileUrl(fileId);
}
