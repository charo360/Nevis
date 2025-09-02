// Firebase authentication hook
import { useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { userService } from '@/lib/firebase/database';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // If Firebase auth is not available, do not create demo users — require explicit authentication
    if (!auth) {
      setAuthState({ user: null, loading: false, error: null });
      return;
    }

    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        const userObj: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        };

        // Ensure user document exists (best-effort)
        try {
          const existingUser = await userService.getById(firebaseUser.uid);
          if (!existingUser) {
            // Create the user document using the auth uid as the document id to avoid duplicate auto-id docs
            await userService.createWithId(firebaseUser.uid, {
              userId: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              preferences: { theme: 'system', notifications: true, autoSave: true },
              subscription: { plan: 'free', status: 'active' },
            });
          }
        } catch (err) {
        }

        setAuthState({ user: userObj, loading: false, error: null });
      } else {
        // No user signed in — require explicit sign-in
        if (!mounted) return;
        setAuthState({ user: null, loading: false, error: null });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Sign in anonymously (for demo/trial users) - wrapper
  const signInAnonymous = async (): Promise<void> => {
      if (!auth) {
        const err = new Error('Firebase auth not initialized');
        setAuthState((prev) => ({ ...prev, loading: false, error: err.message }));
        throw err;
      }

      try {
        setAuthState((prev) => ({ ...prev, loading: true, error: null }));
        await signInAnonymously(auth);
      } catch (error) {
        setAuthState((prev) => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Failed to sign in' }));
        throw error;
      }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign in',
      }));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to sign up',
      }));
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      await updateProfile(auth.currentUser, updates);

      // Update Firestore user document
      await userService.update(auth.currentUser.uid, {
        displayName: updates.displayName || auth.currentUser.displayName || '',
        photoURL: updates.photoURL || auth.currentUser.photoURL || '',
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    ...authState,
    signInAnonymous,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
  };
}

// Hook for getting current user ID
export function useUserId(): string | null {
  const { user } = useFirebaseAuth();
  return user?.uid || null;
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { user, loading } = useFirebaseAuth();
  return !loading && !!user;
}

// Hook for requiring authentication
export function useRequireAuth(): AuthUser {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    throw new Promise(() => { }); // Suspend component until auth is loaded
  }

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
