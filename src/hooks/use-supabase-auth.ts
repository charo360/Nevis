/**
 * Supabase Authentication Hook
 * Replaces MongoDB authentication with Supabase auth
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/config';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

interface AuthUser {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Convert Supabase user to our AuthUser format for compatibility
  const convertUser = useCallback((user: User | null): AuthUser | null => {
    if (!user) return null;
    
    return {
      userId: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      console.log('✅ User signed up successfully:', data.user?.email);
      return { user: data.user, session: data.session };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      console.error('❌ Sign up error:', errorMessage);
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('✅ User signed in successfully:', data.user?.email);
      return { user: data.user, session: data.session };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      console.error('❌ Sign in error:', errorMessage);
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('✅ User signed out successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('❌ Sign out error:', errorMessage);
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      console.log('✅ Password reset email sent to:', email);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      console.error('❌ Password reset error:', errorMessage);
      throw error;
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: { fullName?: string; avatarUrl?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        }
      });

      if (error) throw error;

      console.log('✅ Profile updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      console.error('❌ Profile update error:', errorMessage);
      throw error;
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error.message);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        });

        if (session?.user) {
          console.log('✅ User session restored:', session.user.email);
        } else {
          console.log('📱 No active session found');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setAuthState({
          user: session?.user || null,
          session,
          loading: false,
          error: null,
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    // Auth state
    user: convertUser(authState.user),
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    
    // Raw Supabase user for advanced use cases
    supabaseUser: authState.user,
  };
}
