// Firebase Admin SDK configuration
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    // In production, use service account key. Support two formats:
    // 1) Full JSON in FIREBASE_SERVICE_ACCOUNT_KEY
    // 2) Individual env vars FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localbuzz-mpkuv',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }

    // Support separated service account env vars (useful on some hosting platforms)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      // The private key may contain escaped \n sequences or surrounding quotes; normalize it.
      let rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
      // Remove surrounding quotes if present
      if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
        rawKey = rawKey.slice(1, -1);
      }
      // Convert escaped newlines to real newlines, then trim
      const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n').trim() : rawKey.trim();

      const serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: privateKey,
      } as any;

      return initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
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

// Debug: surface basic admin info (masked) to help diagnose auth/project issues
try {
  const proj = (app?.options && (app.options as any).projectId) || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  console.log('🔐 Firebase Admin initialized for project:', proj);
} catch (e) {
  console.warn('🔐 Firebase Admin info not available', e);
}

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
