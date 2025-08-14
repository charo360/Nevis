// Firebase database service layer
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './schema';
import type {
  UserDocument,
  BrandProfileDocument,
  GeneratedPostDocument,
  ArtifactDocument,
  DesignAnalyticsDocument,
  ContentCalendarDocument,
} from './schema';

// Generic database operations
export class DatabaseService<T extends { id: string; userId: string }> {
  constructor(private collectionName: string) {}

  // Create a new document
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), docData);
    return docRef.id;
  }

  // Get a document by ID
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T;
    }
    
    return null;
  }

  // Get documents by user ID
  async getByUserId(
    userId: string,
    options?: {
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      startAfter?: DocumentSnapshot;
    }
  ): Promise<T[]> {
    let q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    if (options?.orderBy) {
      q = query(q, orderBy(options.orderBy, options.orderDirection || 'desc'));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    if (options?.startAfter) {
      q = query(q, startAfter(options.startAfter));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  }

  // Update a document
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // Delete a document
  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  // Real-time listener for user documents
  onUserDocumentsChange(
    userId: string,
    callback: (documents: T[]) => void,
    options?: {
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    }
  ): Unsubscribe {
    let q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    if (options?.orderBy) {
      q = query(q, orderBy(options.orderBy, options.orderDirection || 'desc'));
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    return onSnapshot(q, (querySnapshot) => {
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      callback(documents);
    });
  }

  // Real-time listener for a single document
  onDocumentChange(id: string, callback: (document: T | null) => void): Unsubscribe {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...docSnap.data(),
        } as T);
      } else {
        callback(null);
      }
    });
  }

  // Batch operations
  createBatch(): WriteBatch {
    return writeBatch(db);
  }

  async executeBatch(batch: WriteBatch): Promise<void> {
    await batch.commit();
  }
}

// Specific service instances
export const userService = new DatabaseService<UserDocument>(COLLECTIONS.USERS);
export const brandProfileService = new DatabaseService<BrandProfileDocument>(COLLECTIONS.BRAND_PROFILES);
export const generatedPostService = new DatabaseService<GeneratedPostDocument>(COLLECTIONS.GENERATED_POSTS);
export const artifactService = new DatabaseService<ArtifactDocument>(COLLECTIONS.ARTIFACTS);
export const designAnalyticsService = new DatabaseService<DesignAnalyticsDocument>(COLLECTIONS.DESIGN_ANALYTICS);
export const contentCalendarService = new DatabaseService<ContentCalendarDocument>(COLLECTIONS.CONTENT_CALENDAR);

// Utility functions
export const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export const convertToFirestoreData = (data: any): any => {
  if (data instanceof Date) {
    return Timestamp.fromDate(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(convertToFirestoreData);
  }
  
  if (data && typeof data === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(data)) {
      converted[key] = convertToFirestoreData(value);
    }
    return converted;
  }
  
  return data;
};
