/**
 * Supabase Authentication Hook
 * Replaces MongoDB authentication with Supabase auth
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAuth, type AuthUser } from '@/lib/services/supabase-auth';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export function useAuthSupabase() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Sign up with email and password
  const signUp = useCallback(async ({ email, password, fullName }: SignUpData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await supabaseAuth.signUp({ email, password, fullName });
      
      console.log('✅ Sign up successful:', result.user?.email);
      
      // If email confirmation is required, user will be null until confirmed
      if (result.needsEmailConfirmation) {
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        return { needsEmailConfirmation: true };
      }
      
      // Get user profile after successful signup
      const userProfile = await supabaseAuth.getCurrentUser();
      setAuthState({
        user: userProfile,
        loading: false,
        error: null,
      });
      
      return { needsEmailConfirmation: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      console.error('❌ Sign up error:', errorMessage);
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async ({ email, password }: SignInData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const result = await supabaseAuth.signIn({ email, password });
      
      console.log('✅ Sign in successful:', result.user.email);
      
      // Get user profile after successful signin
      const userProfile = await supabaseAuth.getCurrentUser();
      setAuthState({
        user: userProfile,
        loading: false,
        error: null,
      });
      
      return result;
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
      
      await supabaseAuth.signOut();
      
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      
      console.log('✅ Sign out successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      console.error('❌ Sign out error:', errorMessage);
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: { fullName?: string; avatarUrl?: string }) => {
    try {
      await supabaseAuth.updateProfile(updates);
      
      // Refresh user profile
      const userProfile = await supabaseAuth.getCurrentUser();
      setAuthState(prev => ({
        ...prev,
        user: userProfile,
      }));
      
      console.log('✅ Profile update successful');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      console.error('❌ Profile update error:', errorMessage);
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await supabaseAuth.resetPassword(email);
      console.log('✅ Password reset email sent');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      console.error('❌ Password reset error:', errorMessage);
      throw error;
    }
  }, []);

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing Supabase auth...');
        
        const userProfile = await supabaseAuth.getCurrentUser();
        
        if (mounted) {
          setAuthState({
            user: userProfile,
            loading: false,
            error: null,
          });
          
          if (userProfile) {
            console.log('✅ User session restored:', userProfile.email);
          } else {
            console.log('📱 No active session found');
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: 'Failed to initialize authentication',
          });
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabaseAuth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          // User signed in, get profile
          try {
            const userProfile = await supabaseAuth.getCurrentUser();
            setAuthState({
              user: userProfile,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('❌ Error getting user profile after auth change:', error);
            setAuthState({
              user: null,
              loading: false,
              error: 'Failed to load user profile',
            });
          }
        } else {
          // User signed out
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    // Auth state
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    
    // Utility methods
    isAuthenticated: !!authState.user,
    isLoading: authState.loading,
  };
}
