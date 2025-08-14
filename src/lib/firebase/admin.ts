// Firebase Admin SDK configuration
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // In production, use service account key
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localbuzz-mpkuv',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    // In development, use default credentials or emulator
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localbuzz-mpkuv',
    });
  }

  return getApps()[0];
};

const app = initializeFirebaseAdmin();

// Initialize services
export const adminDb = getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);

// DISABLED: Set emulator settings for development
// The emulators are not running, so we'll connect directly to production Firebase
//
// if (process.env.NODE_ENV === 'development') {
//   // Use emulator in development
//   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
//   process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
//   process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
// }

export { app as adminApp };
export default app;
