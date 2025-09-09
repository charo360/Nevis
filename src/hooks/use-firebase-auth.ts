/**
 * Firebase Authentication Hook (disabled)
 * Redirects to Supabase auth semantics. Keeps same return shape.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

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
  const { user, loading, error, signOut, signIn } = useSupabaseAuth();

  const mappedUser: FirebaseUser | null = user
    ? {
        uid: user.userId,
        userId: user.userId,
        email: user.email,
        displayName: user.displayName || null,
        isAnonymous: false,
        photoURL: user.photoURL || null,
      }
    : null;

  return {
    user: mappedUser,
    loading,
    error,
    signInAnonymously: async () => {
      // Supabase: no anonymous auth; could implement magic link/guest if needed
      return Promise.resolve();
    },
    signOut,
  };
}
