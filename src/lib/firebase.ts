// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "localbuzz-mpkuv",
  appId: "1:689428714759:web:3f6b7d195dd4a847c4e1a2",
  storageBucket: "localbuzz-mpkuv.firebasestorage.app",
  apiKey: "AIzaSyAIQQLuNAc0YhNz4o9LF1Zyw_Fy0nJUfwI",
  authDomain: "localbuzz-mpkuv.firebaseapp.com",
  messagingSenderId: "689428714759",
  measurementId: "G-756124790"
};

// Singleton pattern for Firebase App
const getFirebaseApp = (): FirebaseApp => {
    if (getApps().length > 0) {
        return getApp("localbuzz-mpkuv");
    }
    return initializeApp(firebaseConfig, "localbuzz-mpkuv");
};

// Singleton pattern for Firebase Auth
let authInstance: Auth | null = null;
const getFirebaseAuth = (): Auth => {
    if (!authInstance) {
        authInstance = getAuth(getFirebaseApp());
    }
    return authInstance;
};

// Singleton pattern for Firestore
let dbInstance: Firestore | null = null;
const getFirestoreDb = (): Firestore => {
    if (!dbInstance) {
        dbInstance = getFirestore(getFirebaseApp());
    }
    return dbInstance;
};


export const app = getFirebaseApp();
export const db = getFirestoreDb();
export const auth = getFirebaseAuth();
