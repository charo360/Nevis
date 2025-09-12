// Supabase-based authentication hook (replaces MongoDB auth)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Convert Supabase user to our AuthUser format
  const convertUser = useCallback((user: User): AuthUser => {
    return {
      userId: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || '',
      photoURL: user.user_metadata?.avatar_url || '',
      isAnonymous: user.is_anonymous || false,
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setAuthState({
              user: null,
              loading: false,
              error: error.message,
            });
          }
          return;
        }

        if (mounted) {
          setAuthState({
            user: session?.user ? convertUser(session.user) : null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setAuthState({
            user: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication error',
          });
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (mounted) {
          setAuthState({
            user: session?.user ? convertUser(session.user) : null,
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
  }, [convertUser]);

  // Clear all user-related data from localStorage
  const clearAllUserData = useCallback(() => {
    console.log('🧹 Clearing all user-related data from localStorage...');

    // Clear brand-related data
    localStorage.removeItem('selectedBrandId');
    localStorage.removeItem('currentBrandData');
    localStorage.removeItem('brandColors');

    // Clear all brand-scoped storage (artifacts, posts, etc.)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('_brand_') ||
        key.includes('artifacts_') ||
        key.includes('quick-content_') ||
        key.includes('creative-studio_') ||
        key.includes('qc-') ||
        key.includes('cs-') ||
        key.endsWith('_posts') ||
        key.startsWith('cbrand_')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🗑️ Removed localStorage key:', key);
    });

    console.log('✅ All user data cleared from localStorage');
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 SignIn: Starting authentication for:', email);
      
      // Clear any existing user data to prevent cross-contamination between accounts
      clearAllUserData();
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ SignIn: Authentication successful for user:', data.user.id);
        const user = convertUser(data.user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      console.log('📝 SignUp: Starting registration for:', email);
      
      // Clear any existing user data to ensure clean state for new user
      clearAllUserData();
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: displayName,
          }
        }
      });

      if (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
        throw new Error(error.message);
      }

      if (data.user) {
        const user = convertUser(data.user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Sign in anonymously (for demo users)
  const signInAnonymous = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
        throw new Error(error.message);
      }

      if (data.user) {
        const user = convertUser(data.user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Anonymous login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 Signing out user...');
      clearAllUserData();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> => {
    if (!authState.user) {
      throw new Error('No user signed in');
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: updates.displayName,
          full_name: updates.displayName,
          avatar_url: updates.photoURL,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // The auth state will be updated automatically via the auth state change listener
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Get current access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }, []);

  // Refresh token (handled automatically by Supabase)
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Token refresh error:', error);
        return false;
      }
      return !!data.session;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signInAnonymous,
    signOut,
    updateUserProfile,
    refreshToken,
    getAccessToken,
  };
}

// Hook for getting current user ID
export function useUserId(): string | null {
  const { user } = useAuth();
  return user?.userId || null;
}

// Hook for checking if user is authenticated
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth();
  return !loading && !!user;
}

// Hook for requiring authentication
export function useRequireAuth(): AuthUser {
  const { user, loading } = useAuth();

  if (loading) {
    throw new Promise(() => { }); // Suspend component until auth is loaded
  }

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
