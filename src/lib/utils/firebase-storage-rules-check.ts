/**
 * Firebase Storage Rules Checker
 * Utility to check if Firebase Storage rules are properly deployed
 */

import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';

export interface StorageRulesCheckResult {
  success: boolean;
  error?: string;
  details?: {
    canUpload: boolean;
    canRead: boolean;
    canDelete: boolean;
    testPath?: string;
    downloadUrl?: string;
  };
}

/**
 * Check if Firebase Storage rules allow user to upload, read, and delete files
 */
export async function checkFirebaseStorageRules(userId: string): Promise<StorageRulesCheckResult> {
  try {

    // Create test data
    const testData = new Blob(['Firebase Storage Rules Test'], { type: 'text/plain' });
    const testFile = new File([testData], 'rules-test.txt', { type: 'text/plain' });
    const testPath = `generated-content/${userId}/rules-test-${Date.now()}.txt`;


    let canUpload = false;
    let canRead = false;
    let canDelete = false;
    let downloadUrl = '';

    try {
      // Test upload
      const storageRef = ref(storage, testPath);
      const snapshot = await uploadBytes(storageRef, testFile);
      canUpload = true;

      try {
        // Test read
        downloadUrl = await getDownloadURL(snapshot.ref);
        canRead = true;

        try {
          // Test delete
          await deleteObject(snapshot.ref);
          canDelete = true;
        } catch (deleteError) {
        }
      } catch (readError) {
      }
    } catch (uploadError) {

      return {
        success: false,
        error: `Upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`,
        details: {
          canUpload: false,
          canRead: false,
          canDelete: false,
          testPath
        }
      };
    }

    const allPermissionsWork = canUpload && canRead && canDelete;

    return {
      success: allPermissionsWork,
      error: allPermissionsWork ? undefined : 'Some permissions are missing',
      details: {
        canUpload,
        canRead,
        canDelete,
        testPath,
        downloadUrl: downloadUrl.substring(0, 100) + '...'
      }
    };

  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        canUpload: false,
        canRead: false,
        canDelete: false
      }
    };
  }
}

/**
 * Get Firebase Storage rules deployment instructions
 */
export function getStorageRulesInstructions(): string {
  return `
To deploy Firebase Storage rules:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: localbuzz-mpkuv
3. Go to Storage → Rules
4. Replace with these rules:

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Generated content - PUBLIC READ, authenticated write
    // This allows images to be displayed after generation without auth issues
    match /generated-content/{userId}/{allPaths=**} {
      allow read: if true; // Public read access for generated images
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Users can upload and manage their own artifacts
    match /artifacts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Brand assets - PUBLIC READ for logos, authenticated write
    match /brand-assets/{userId}/{allPaths=**} {
      allow read: if true; // Public read access for brand logos
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }

    // Temporary uploads (for processing)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

5. Click "Publish" to deploy the rules
6. Wait a few minutes for rules to propagate
7. Test again in your application
`;
}

/**
 * Log detailed Firebase Storage configuration
 */
export function logFirebaseStorageConfig() {
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).checkFirebaseStorageRules = checkFirebaseStorageRules;
  (window as any).getStorageRulesInstructions = getStorageRulesInstructions;
  (window as any).logFirebaseStorageConfig = logFirebaseStorageConfig;
}
