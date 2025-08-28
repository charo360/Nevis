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
    console.log('🧪 Checking Firebase Storage rules for user:', userId);
    
    // Create test data
    const testData = new Blob(['Firebase Storage Rules Test'], { type: 'text/plain' });
    const testFile = new File([testData], 'rules-test.txt', { type: 'text/plain' });
    const testPath = `generated-content/${userId}/rules-test-${Date.now()}.txt`;
    
    console.log('📍 Test path:', testPath);
    
    let canUpload = false;
    let canRead = false;
    let canDelete = false;
    let downloadUrl = '';
    
    try {
      // Test upload
      console.log('📤 Testing upload permission...');
      const storageRef = ref(storage, testPath);
      const snapshot = await uploadBytes(storageRef, testFile);
      canUpload = true;
      console.log('✅ Upload successful');
      
      try {
        // Test read
        console.log('📥 Testing read permission...');
        downloadUrl = await getDownloadURL(snapshot.ref);
        canRead = true;
        console.log('✅ Read successful');
        
        try {
          // Test delete
          console.log('🗑️ Testing delete permission...');
          await deleteObject(snapshot.ref);
          canDelete = true;
          console.log('✅ Delete successful');
        } catch (deleteError) {
          console.warn('⚠️ Delete failed:', deleteError);
        }
      } catch (readError) {
        console.warn('⚠️ Read failed:', readError);
      }
    } catch (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
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
    console.error('❌ Storage rules check failed:', error);
    
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
    // Users can upload and manage their own generated content
    match /generated-content/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload and manage their own artifacts
    match /artifacts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload and manage their own brand assets
    match /brand-assets/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
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
  console.log('🔧 Firebase Storage Configuration:');
  console.log('Storage instance:', !!storage);
  console.log('Storage app:', storage?.app?.name);
  console.log('Storage bucket:', storage?.bucket);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
}

// Export for global access in development
if (typeof window !== 'undefined') {
  (window as any).checkFirebaseStorageRules = checkFirebaseStorageRules;
  (window as any).getStorageRulesInstructions = getStorageRulesInstructions;
  (window as any).logFirebaseStorageConfig = logFirebaseStorageConfig;
}
