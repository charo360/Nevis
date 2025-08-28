// Firebase Storage service for file management
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  StorageReference
} from 'firebase/storage';
import { storage, auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';

// Storage paths
export const STORAGE_PATHS = {
  ARTIFACTS: 'artifacts',
  BRAND_ASSETS: 'brand-assets',
  GENERATED_CONTENT: 'generated-content',
  TEMP: 'temp',
} as const;

// File upload options
export interface UploadOptions {
  customMetadata?: Record<string, string>;
  contentType?: string;
  cacheControl?: string;
}

// Upload result
export interface UploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
    updated: string;
  };
}

// Get current user ID
function getCurrentUserId(): Promise<string | null> {
  return new Promise((resolve) => {
    // First try to get the current user directly
    if (auth?.currentUser) {
      resolve(auth.currentUser.uid);
      return;
    }

    // If no current user, wait for auth state change
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user?.uid || null);
    });
  });
}

// Create storage reference with user path
async function createUserStorageRef(basePath: string, fileName: string): Promise<StorageReference> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to upload files');
  }

  const fullPath = `${basePath}/${userId}/${fileName}`;
  console.log(`🔄 Creating storage reference: ${fullPath}`);
  console.log(`👤 User ID: ${userId}`);
  console.log(`🔐 Auth state:`, auth?.currentUser ? 'authenticated' : 'not authenticated');

  return ref(storage, fullPath);
}

// Upload file to Firebase Storage
export async function uploadFile(
  file: File,
  basePath: string,
  fileName?: string,
  options?: UploadOptions
): Promise<UploadResult> {
  // Check if Firebase Storage is available
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Please check your Firebase configuration.');
  }

  // Check if user is authenticated
  if (!auth?.currentUser) {
    throw new Error('User must be authenticated to upload files. Please sign in first.');
  }

  const finalFileName = fileName || `${Date.now()}-${file.name}`;
  const storageRef = await createUserStorageRef(basePath, finalFileName);

  // Set metadata
  const metadata = {
    contentType: options?.contentType || file.type,
    cacheControl: options?.cacheControl || 'public, max-age=31536000',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      ...options?.customMetadata,
    },
  };

  // Upload file
  console.log(`📤 Uploading file to: ${storageRef.fullPath}`);
  console.log(`📊 File size: ${file.size} bytes`);
  console.log(`🏷️ File type: ${file.type}`);

  try {
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log(`✅ Upload successful: ${snapshot.ref.fullPath}`);

    const url = await getDownloadURL(snapshot.ref);
    console.log(`🔗 Download URL generated: ${url.substring(0, 100)}...`);

    // Get metadata for response
    const fileMetadata = await getMetadata(snapshot.ref);

    return {
      url,
      path: snapshot.ref.fullPath,
      metadata: {
        size: fileMetadata.size,
        contentType: fileMetadata.contentType || file.type,
        timeCreated: fileMetadata.timeCreated,
        updated: fileMetadata.updated,
      },
    };
  } catch (error) {
    console.error(`❌ Upload failed for ${storageRef.fullPath}:`, error);
    throw error;
  }
}

// Upload artifact file
export async function uploadArtifactFile(
  file: File,
  artifactId: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const fileName = `${artifactId}-${file.name}`;
  return uploadFile(file, STORAGE_PATHS.ARTIFACTS, fileName, {
    ...options,
    customMetadata: {
      artifactId,
      type: 'artifact',
      ...options?.customMetadata,
    },
  });
}

// Upload thumbnail
export async function uploadThumbnail(
  file: File,
  originalFileName: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const thumbnailName = `thumbnails/thumb-${Date.now()}-${originalFileName}`;
  return uploadFile(file, STORAGE_PATHS.ARTIFACTS, thumbnailName, {
    ...options,
    customMetadata: {
      type: 'thumbnail',
      originalFile: originalFileName,
      ...options?.customMetadata,
    },
  });
}

// Upload brand asset (logo, design examples, etc.)
export async function uploadBrandAsset(
  file: File,
  assetType: 'logo' | 'design-example' | 'other',
  options?: UploadOptions
): Promise<UploadResult> {
  const fileName = `${assetType}-${Date.now()}-${file.name}`;
  return uploadFile(file, STORAGE_PATHS.BRAND_ASSETS, fileName, {
    ...options,
    customMetadata: {
      assetType,
      type: 'brand-asset',
      ...options?.customMetadata,
    },
  });
}

// Upload generated content (AI-generated images, videos)
export async function uploadGeneratedContent(
  file: File,
  contentType: 'image' | 'video',
  postId?: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const fileName = `${contentType}-${Date.now()}-${file.name}`;
  return uploadFile(file, STORAGE_PATHS.GENERATED_CONTENT, fileName, {
    ...options,
    customMetadata: {
      contentType,
      postId: postId || '',
      type: 'generated-content',
      ...options?.customMetadata,
    },
  });
}

// Upload data URL as image to Firebase Storage
export async function uploadDataUrlAsImage(
  dataUrl: string,
  fileName?: string,
  postId?: string,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Create file from blob
    const file = new File([blob], fileName || `generated-image-${Date.now()}.png`, {
      type: blob.type || 'image/png'
    });

    // Upload to Firebase Storage
    return await uploadGeneratedContent(file, 'image', postId, {
      ...options,
      customMetadata: {
        source: 'ai-generated',
        originalFormat: 'data-url',
        ...options?.customMetadata,
      },
    });
  } catch (error) {
    console.error('Failed to upload data URL as image:', error);
    throw error;
  }
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
}

// Get file download URL
export async function getFileUrl(filePath: string): Promise<string> {
  try {
    const fileRef = ref(storage, filePath);
    return await getDownloadURL(fileRef);
  } catch (error) {
    console.error('Failed to get file URL:', error);
    throw error;
  }
}

// List user files in a directory
export async function listUserFiles(basePath: string): Promise<{
  files: Array<{
    name: string;
    path: string;
    url: string;
    metadata: any;
  }>;
  folders: string[];
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to list files');
  }

  const userRef = ref(storage, `${basePath}/${userId}`);
  const result = await listAll(userRef);

  // Get file details
  const files = await Promise.all(
    result.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      const metadata = await getMetadata(itemRef);

      return {
        name: itemRef.name,
        path: itemRef.fullPath,
        url,
        metadata,
      };
    })
  );

  // Get folder names
  const folders = result.prefixes.map(prefix => prefix.name);

  return { files, folders };
}

// Get file metadata
export async function getFileMetadata(filePath: string) {
  try {
    const fileRef = ref(storage, filePath);
    return await getMetadata(fileRef);
  } catch (error) {
    console.error('Failed to get file metadata:', error);
    throw error;
  }
}

// Update file metadata
export async function updateFileMetadata(
  filePath: string,
  metadata: { customMetadata?: Record<string, string> }
): Promise<void> {
  try {
    const fileRef = ref(storage, filePath);
    await updateMetadata(fileRef, metadata);
  } catch (error) {
    console.error('Failed to update file metadata:', error);
    throw error;
  }
}

// Generate thumbnail from image file
export async function generateThumbnail(
  imageFile: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailFile = new File(
              [blob],
              `thumb-${imageFile.name}`,
              { type: 'image/jpeg' }
            );
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to generate thumbnail'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

// Compress image file
export async function compressImage(
  imageFile: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File(
              [blob],
              imageFile.name,
              { type: 'image/jpeg' }
            );
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

// Clean up temporary files (should be called periodically)
export async function cleanupTempFiles(olderThanHours: number = 24): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return 0;
  }

  try {
    const tempRef = ref(storage, `${STORAGE_PATHS.TEMP}/${userId}`);
    const result = await listAll(tempRef);

    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const itemRef of result.items) {
      try {
        const metadata = await getMetadata(itemRef);
        const createdTime = new Date(metadata.timeCreated).getTime();

        if (createdTime < cutoffTime) {
          await deleteObject(itemRef);
          deletedCount++;
        }
      } catch (error) {
        console.warn(`Failed to process temp file ${itemRef.name}:`, error);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup temp files:', error);
    return 0;
  }
}
