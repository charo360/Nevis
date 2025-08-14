// Firebase client configuration
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Check if Firebase is properly configured
const isFirebaseConfigured =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_firebase_api_key_here';

console.log('🔧 Firebase Configuration Check:');
console.log('- API Key exists:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('- API Key value:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');
console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('- Is configured:', isFirebaseConfigured);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// Initialize Firebase with error handling
let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

try {
  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase not configured - using demo mode');
    // Create mock objects to prevent errors
    app = { options: firebaseConfig };
    db = null;
    auth = null;
    storage = null;
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  app = null;
  db = null;
  auth = null;
  storage = null;
}

export { db, auth, storage };

// DISABLED: Connect to emulators in development
// The emulators are not running, so we'll connect directly to production Firebase
//
// if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
//   // Only connect to emulators if not already connected
//   try {
//     // Check if we're already connected to avoid multiple connections
//     if (!auth.config.emulator) {
//       connectAuthEmulator(auth, 'http://localhost:9099');
//     }
//   } catch (error) {
//     // Emulator already connected or not available
//   }

//   try {
//     if (!(db as any)._delegate._databaseId.projectId.includes('localhost')) {
//       connectFirestoreEmulator(db, 'localhost', 8080);
//     }
//   } catch (error) {
//     // Emulator already connected or not available
//   }

//   try {
//     if (!storage.app.options.storageBucket?.includes('localhost')) {
//       connectStorageEmulator(storage, 'localhost', 9199);
//     }
//   } catch (error) {
//     // Emulator already connected or not available
//   }
// }

export { app };
export default app;
