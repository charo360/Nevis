// Firebase Admin SDK configuration
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
let adminAppInstance: any = null;

const initializeFirebaseAdmin = () => {
  if (adminAppInstance) return adminAppInstance;
  
  if (getApps().length === 0) {
    // In production, use service account key. Support two formats:
    // 1) Full JSON in FIREBASE_SERVICE_ACCOUNT_KEY
    // 2) Individual env vars FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        // Clean up the service account key - remove any surrounding quotes and whitespace
        let rawServiceKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        
        // Remove surrounding quotes if present
        if ((rawServiceKey.startsWith('"') && rawServiceKey.endsWith('"')) || 
            (rawServiceKey.startsWith("'") && rawServiceKey.endsWith("'"))) {
          rawServiceKey = rawServiceKey.slice(1, -1);
        }
        
        const serviceAccount = JSON.parse(rawServiceKey);
        adminAppInstance = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localbuzz-mpkuv',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        return adminAppInstance;
      } catch (error) {
        // Don't throw - fall through to try individual env vars instead
      }
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

      adminAppInstance = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return adminAppInstance;
    }

    // In development, use default credentials or emulator
    adminAppInstance = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localbuzz-mpkuv',
    });
    return adminAppInstance;
  }

  adminAppInstance = getApps()[0];
  return adminAppInstance;
};

// Lazy getters for Firebase services
export const getAdminApp = () => initializeFirebaseAdmin();
export const getAdminDb = () => getFirestore(getAdminApp());
export const getAdminAuth = () => getAuth(getAdminApp());
export const getAdminStorage = () => getStorage(getAdminApp());

// Backward compatibility exports that initialize lazily
export const adminDb = new Proxy({} as any, {
  get: (target, prop) => (getAdminDb() as any)[prop]
});

export const adminAuth = new Proxy({} as any, {
  get: (target, prop) => (getAdminAuth() as any)[prop]
});

export const adminStorage = new Proxy({} as any, {
  get: (target, prop) => (getAdminStorage() as any)[prop]
});

// Default export
export const adminApp = new Proxy({} as any, {
  get: (target, prop) => (getAdminApp() as any)[prop]
});

export default adminApp;
