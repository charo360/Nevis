/**
 * Firebase Authentication Hook
 * Provides Firebase auth state and user information
 */

'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { 
  User,
  onAuthStateChanged,
  signInAnonymously,
  signOut as firebaseSignOut
} from 'firebase/auth';

export interface FirebaseUser {
  uid: string;
  userId: string; // Alias for uid for compatibility
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  photoURL: string | null;
}

export interface UseFirebaseAuthReturn {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener...');
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        try {
          if (firebaseUser) {
            const userData: FirebaseUser = {
              uid: firebaseUser.uid,
              userId: firebaseUser.uid, // Alias for compatibility
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isAnonymous: firebaseUser.isAnonymous,
              photoURL: firebaseUser.photoURL,
            };
            
            console.log('✅ Firebase user authenticated:', {
              uid: userData.uid,
              email: userData.email,
              isAnonymous: userData.isAnonymous
            });
            
            setUser(userData);
            setError(null);
          } else {
            console.log('🔓 No Firebase user authenticated');
            setUser(null);
          }
        } catch (err) {
          console.error('❌ Error processing Firebase auth state:', err);
          setError(err instanceof Error ? err.message : 'Authentication error');
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('❌ Firebase auth state change error:', err);
        setError(err.message);
        setUser(null);
        setLoading(false);
      }
    );

    return () => {
      console.log('🔥 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, []);

  const handleSignInAnonymously = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔐 Signing in anonymously...');
      
      const result = await signInAnonymously(auth);
      console.log('✅ Anonymous sign-in successful:', result.user.uid);
    } catch (err) {
      console.error('❌ Anonymous sign-in error:', err);
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔓 Signing out...');
      
      await firebaseSignOut(auth);
      console.log('✅ Sign-out successful');
    } catch (err) {
      console.error('❌ Sign-out error:', err);
      setError(err instanceof Error ? err.message : 'Sign-out failed');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signInAnonymously: handleSignInAnonymously,
    signOut: handleSignOut,
  };
}
