/**
 * Firebase Storage Test Utilities
 * Helper functions to test Firebase Storage connectivity and permissions
 */

import { auth, storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface StorageTestResult {
  success: boolean;
  error?: string;
  details?: any;
}

/**
 * Test Firebase Storage connectivity and authentication
 */
export async function testFirebaseStorageConnection(): Promise<StorageTestResult> {
  try {

    // Check if Firebase Storage is initialized
    if (!storage) {
      return {
        success: false,
        error: 'Firebase Storage is not initialized',
        details: { storage: null }
      };
    }

    // Check if user is authenticated
    if (!auth?.currentUser) {
      return {
        success: false,
        error: 'User is not authenticated',
        details: { 
          auth: !!auth,
          currentUser: null,
          uid: null
        }
      };
    }

    const userId = auth.currentUser.uid;

    // Create a test file
    const testData = new Blob(['Hello Firebase Storage!'], { type: 'text/plain' });
    const testFile = new File([testData], 'test-file.txt', { type: 'text/plain' });
    
    // Create storage reference
    const testPath = `generated-content/${userId}/test-${Date.now()}.txt`;
    const storageRef = ref(storage, testPath);
    

    // Upload test file
    const snapshot = await uploadBytes(storageRef, testFile);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Clean up - delete test file
    await deleteObject(snapshot.ref);

    return {
      success: true,
      details: {
        userId,
        testPath,
        downloadURL: downloadURL.substring(0, 100) + '...'
      }
    };

  } catch (error) {
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorType: error?.constructor?.name,
        errorCode: (error as any)?.code,
        errorMessage: (error as any)?.message,
        userId: auth?.currentUser?.uid || null,
        storageInitialized: !!storage,
        authInitialized: !!auth
      }
    };
  }
}

/**
 * Get detailed Firebase Storage status
 */
export function getFirebaseStorageStatus() {
  return {
    storage: {
      initialized: !!storage,
      app: storage?.app?.name || null,
      bucket: storage?.bucket || null
    },
    auth: {
      initialized: !!auth,
      currentUser: !!auth?.currentUser,
      uid: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      isAnonymous: auth?.currentUser?.isAnonymous || false
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined'
    }
  };
}

/**
 * Test specific storage path permissions
 */
export async function testStoragePathPermissions(basePath: string): Promise<StorageTestResult> {
  try {
    if (!auth?.currentUser) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const userId = auth.currentUser.uid;
    const testPath = `${basePath}/${userId}/permission-test-${Date.now()}.txt`;
    

    // Create test file
    const testData = new Blob(['Permission test'], { type: 'text/plain' });
    const testFile = new File([testData], 'permission-test.txt', { type: 'text/plain' });
    
    // Try to upload
    const storageRef = ref(storage, testPath);
    const snapshot = await uploadBytes(storageRef, testFile);
    
    // Clean up
    await deleteObject(snapshot.ref);
    
    return {
      success: true,
      details: { testPath, userId }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        errorCode: (error as any)?.code,
        basePath,
        userId: auth?.currentUser?.uid
      }
    };
  }
}
