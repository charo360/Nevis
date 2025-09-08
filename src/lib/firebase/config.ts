/**
 * Firebase Configuration
 * Initializes Firebase app and exports Firebase services
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration - using direct values to avoid environment variable issues
const firebaseConfig = {
  apiKey: 'AIzaSyAIQQLuNAc0YhNz4o9LF1Zyw_Fy0nJUfwI',
  authDomain: 'localbuzz-mpkuv.firebaseapp.com',
  projectId: 'localbuzz-mpkuv',
  storageBucket: 'localbuzz-mpkuv.firebasestorage.app',
  messagingSenderId: '689428714759',
  appId: '1:689428714759:web:3f6b7d195dd4a847c4e1a2',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we have the required Firebase configuration
const hasFirebaseConfig = firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket;

if (!hasFirebaseConfig) {
  console.warn('⚠️ Some Firebase environment variables are missing, using fallback configuration');
  console.log('🔧 Firebase config status:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
    messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing',
  });
} else {
  console.log('✅ Firebase configuration loaded successfully');
}

// Initialize Firebase app (only once)
let app;
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized successfully');
    console.log('🔥 Firebase config:', {
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      authDomain: firebaseConfig.authDomain
    });
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
    console.error('Firebase config used:', firebaseConfig);
    throw error;
  }
} else {
  app = getApps()[0];
  console.log('✅ Firebase app already initialized');
}

// Export Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const firestore = getFirestore(app);

// Export the app instance
export default app;

// Export configuration for debugging
export { firebaseConfig };
