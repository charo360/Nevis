// Firebase services main export
export * from './config';
export * from './admin';
export * from './database';
export * from './schema';

// Service exports
export { brandProfileFirebaseService } from './services/brand-profile-service';
export { generatedPostFirebaseService } from './services/generated-post-service';
export { artifactFirebaseService } from './services/artifact-service';
export { designAnalyticsFirebaseService } from './services/design-analytics-service';

// Re-export Firebase types and utilities
export {
  Timestamp,
  serverTimestamp,
  onSnapshot,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';

export {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Utility functions
export const createUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDocumentId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
