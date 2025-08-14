// Artifacts Firebase service
import { query, where, orderBy, limit, getDocs, collection } from 'firebase/firestore';
import { db } from '../config';
import { DatabaseService } from '../database';
import { COLLECTIONS, ArtifactDocument, ArtifactDocumentSchema } from '../schema';
import {
  uploadArtifactFile,
  uploadThumbnail,
  deleteFile,
  generateThumbnail,
  compressImage
} from '../storage-service';
import type { Artifact, ArtifactCategory, ArtifactUsageType } from '@/lib/types/artifacts';

export class ArtifactFirebaseService extends DatabaseService<ArtifactDocument> {
  constructor() {
    super(COLLECTIONS.ARTIFACTS);
  }

  // Convert from app Artifact to Firestore document
  private toFirestoreDocument(
    artifact: Artifact,
    userId: string
  ): Omit<ArtifactDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      userId,
      name: artifact.name,
      type: artifact.type,
      category: artifact.category as ArtifactDocument['category'],
      usageType: artifact.usageType as ArtifactDocument['usageType'],
      uploadType: artifact.uploadType as ArtifactDocument['uploadType'],
      folderId: artifact.folderId,
      isActive: artifact.isActive,
      instructions: artifact.instructions,
      textOverlay: artifact.textOverlay,
      filePath: artifact.filePath,
      thumbnailPath: artifact.thumbnailPath,
      fileUrl: artifact.fileUrl,
      thumbnailUrl: artifact.thumbnailUrl,
      metadata: artifact.metadata,
      tags: artifact.tags,
      usage: artifact.usage,
      discountInfo: artifact.discountInfo,
    };
  }

  // Convert from Firestore document to app Artifact
  private fromFirestoreDocument(doc: ArtifactDocument): Artifact {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      category: doc.category as ArtifactCategory,
      usageType: doc.usageType as ArtifactUsageType,
      uploadType: doc.uploadType,
      folderId: doc.folderId,
      isActive: doc.isActive,
      instructions: doc.instructions,
      textOverlay: doc.textOverlay,
      filePath: doc.filePath,
      thumbnailPath: doc.thumbnailPath,
      fileUrl: doc.fileUrl,
      thumbnailUrl: doc.thumbnailUrl,
      metadata: doc.metadata,
      tags: doc.tags,
      usage: doc.usage,
      discountInfo: doc.discountInfo,
      timestamps: {
        created: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
        modified: doc.updatedAt instanceof Date ? doc.updatedAt : new Date(),
        uploaded: doc.createdAt instanceof Date ? doc.createdAt : new Date(),
      },
    };
  }

  // Enhanced file upload with compression and thumbnail generation
  private async uploadArtifactFiles(
    file: File,
    artifactId: string
  ): Promise<{
    fileUrl: string;
    filePath: string;
    thumbnailUrl?: string;
    thumbnailPath?: string;
    metadata: any;
  }> {
    // Compress image if it's too large
    let processedFile = file;
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) { // 2MB
      processedFile = await compressImage(file, 1920, 1080, 0.9);
    }

    // Upload main file
    const uploadResult = await uploadArtifactFile(processedFile, artifactId, {
      customMetadata: {
        originalName: file.name,
        originalSize: file.size.toString(),
        processedSize: processedFile.size.toString(),
      }
    });

    let thumbnailUrl: string | undefined;
    let thumbnailPath: string | undefined;

    // Generate and upload thumbnail for images
    if (file.type.startsWith('image/')) {
      try {
        const thumbnailFile = await generateThumbnail(processedFile, 200, 200, 0.8);
        const thumbnailResult = await uploadThumbnail(thumbnailFile, processedFile.name);
        thumbnailUrl = thumbnailResult.url;
        thumbnailPath = thumbnailResult.path;
      } catch (error) {
        console.warn('Failed to generate thumbnail:', error);
      }
    }

    return {
      fileUrl: uploadResult.url,
      filePath: uploadResult.path,
      thumbnailUrl,
      thumbnailPath,
      metadata: uploadResult.metadata,
    };
  }

  // Save artifact with enhanced file upload
  async saveArtifact(
    artifact: Omit<Artifact, 'id' | 'timestamps'>,
    userId: string,
    file?: File
  ): Promise<string> {
    let fileUrl = artifact.fileUrl;
    let thumbnailUrl = artifact.thumbnailUrl;
    let filePath = artifact.filePath;
    let thumbnailPath = artifact.thumbnailPath;
    let metadata = artifact.metadata;

    // Upload file if provided
    if (file) {
      const artifactId = `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const uploadResult = await this.uploadArtifactFiles(file, artifactId);

      fileUrl = uploadResult.fileUrl;
      filePath = uploadResult.filePath;
      thumbnailUrl = uploadResult.thumbnailUrl;
      thumbnailPath = uploadResult.thumbnailPath;

      // Update metadata with file information
      metadata = {
        ...metadata,
        fileSize: uploadResult.metadata.size,
        mimeType: uploadResult.metadata.contentType,
        dimensions: file.type.startsWith('image/') ? await this.getImageDimensions(file) : undefined,
      };
    }

    const firestoreData = this.toFirestoreDocument(
      {
        ...artifact,
        fileUrl,
        thumbnailUrl,
        filePath,
        thumbnailPath,
        metadata,
      },
      userId
    );

    // Validate data
    const validatedData = ArtifactDocumentSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    }).parse(firestoreData);

    return await this.create(validatedData);
  }

  // Helper method to get image dimensions
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Get user's artifacts as app format
  async getUserArtifacts(
    userId: string,
    options?: {
      category?: ArtifactCategory;
      type?: string;
      folderId?: string;
      isActive?: boolean;
      limit?: number;
    }
  ): Promise<Artifact[]> {
    let q = query(
      collection(db, COLLECTIONS.ARTIFACTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (options?.category) {
      q = query(q, where('category', '==', options.category));
    }

    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }

    if (options?.folderId) {
      q = query(q, where('folderId', '==', options.folderId));
    }

    if (options?.isActive !== undefined) {
      q = query(q, where('isActive', '==', options.isActive));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ArtifactDocument[];

    return docs.map(doc => this.fromFirestoreDocument(doc));
  }

  // Update artifact usage
  async updateArtifactUsage(
    artifactId: string,
    context: string
  ): Promise<void> {
    const artifact = await this.getById(artifactId);
    if (!artifact) return;

    const updatedUsage = {
      usageCount: artifact.usage.usageCount + 1,
      usedInContexts: [...artifact.usage.usedInContexts, context],
      lastUsedAt: new Date(),
    };

    await this.update(artifactId, { usage: updatedUsage });
  }

  // Delete artifact and its files
  async deleteArtifact(artifactId: string): Promise<void> {
    const artifact = await this.getById(artifactId);
    if (!artifact) return;

    // Delete files from storage
    const deletePromises: Promise<void>[] = [];

    if (artifact.filePath) {
      deletePromises.push(
        deleteFile(artifact.filePath).catch(error =>
          console.warn('Failed to delete file from storage:', error)
        )
      );
    }

    if (artifact.thumbnailPath) {
      deletePromises.push(
        deleteFile(artifact.thumbnailPath).catch(error =>
          console.warn('Failed to delete thumbnail from storage:', error)
        )
      );
    }

    // Wait for all file deletions to complete
    await Promise.all(deletePromises);

    // Delete document
    await this.delete(artifactId);
  }

  // Search artifacts by tags or name
  async searchArtifacts(
    userId: string,
    searchTerm: string,
    options?: {
      category?: ArtifactCategory;
      limit?: number;
    }
  ): Promise<Artifact[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation that searches by exact tag matches
    // For production, consider using Algolia or similar search service

    const artifacts = await this.getUserArtifacts(userId, {
      category: options?.category,
      limit: options?.limit || 50,
    });

    const searchTermLower = searchTerm.toLowerCase();

    return artifacts.filter(artifact =>
      artifact.name.toLowerCase().includes(searchTermLower) ||
      artifact.tags.some(tag => tag.toLowerCase().includes(searchTermLower)) ||
      artifact.instructions?.toLowerCase().includes(searchTermLower)
    );
  }

  // Get artifacts by folder
  async getArtifactsByFolder(
    userId: string,
    folderId: string
  ): Promise<Artifact[]> {
    return await this.getUserArtifacts(userId, { folderId });
  }

  // Update artifact metadata
  async updateArtifactMetadata(
    artifactId: string,
    updates: Partial<Pick<Artifact, 'name' | 'instructions' | 'textOverlay' | 'tags' | 'isActive' | 'discountInfo'>>
  ): Promise<void> {
    const updateData: Partial<ArtifactDocument> = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.textOverlay) updateData.textOverlay = updates.textOverlay;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.discountInfo) updateData.discountInfo = updates.discountInfo;

    await this.update(artifactId, updateData);
  }
}

// Export singleton instance
export const artifactFirebaseService = new ArtifactFirebaseService();
