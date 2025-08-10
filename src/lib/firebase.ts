// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "localbuzz-mpkuv",
  appId: "1:689428714759:web:3f6b7d195dd4a847c4e1a2",
  storageBucket: "localbuzz-mpkuv.firebasestorage.app",
  apiKey: "AIzaSyAIQQLuNAc0YhNz4o9LF1Zyw_Fy0nJUfwI",
  authDomain: "localbuzz-mpkuv.firebaseapp.com",
  messagingSenderId: "689428714759",
  measurementId: "G-756124790"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp("localbuzz-mpkuv");
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
