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

  // Clear all user-related data from localStorage and sessionStorage
  const clearAllUserData = useCallback(() => {
    console.log('🧹 Clearing all user-related data from browser storage...');

    // Clear specific known keys
    const knownKeys = [
      'selectedBrandId',
      'currentBrandData', 
      'brandColors',
      'supabase.auth.token',
      'sb-nrfceylvtiwpqsoxurrv-auth-token', // Supabase session key
    ];
    
    knownKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

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
        key.startsWith('cbrand_') ||
        key.includes('supabase') ||
        key.includes('sb-')
      )) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log('🗑️ Removed storage key:', key);
    });

    // Also clear sessionStorage brand-related items
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('_brand_') ||
        key.includes('supabase') ||
        key.includes('sb-')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
    });

    console.log('✅ All user data cleared from browser storage');
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 SignIn: Starting authentication for:', email);
      console.log('🔐 SignIn: Email length:', email.length);
      console.log('🔐 SignIn: Password length:', password.length);
      
      // Clear any existing user data to prevent cross-contamination between accounts
      clearAllUserData();
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔐 SignIn: Making Supabase auth request...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      console.log('🔐 SignIn: Supabase response received');
      console.log('🔐 SignIn: Error?', error ? 'YES' : 'NO');
      console.log('🔐 SignIn: User?', data?.user ? 'YES' : 'NO');

      if (error) {
        console.log('❌ SignIn: Error details:');
        console.log('   - Message:', error.message);
        console.log('   - Status:', error.status);
        console.log('   - Full error:', JSON.stringify(error, null, 2));
        
        setAuthState({
          user: null,
          loading: false,
          error: error.message,
        });
        throw new Error(error.message);
      }

      if (data.user) {
        console.log('✅ SignIn: Authentication successful for user:', data.user.id);
        console.log('✅ SignIn: User email:', data.user.email);
        console.log('✅ SignIn: User confirmed:', data.user.email_confirmed_at ? 'YES' : 'NO');
        console.log('✅ SignIn: Session?', data.session ? 'YES' : 'NO');
        
        const user = convertUser(data.user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      } else {
        console.log('⚠️ SignIn: No error but no user either');
        throw new Error('Authentication failed - no user returned');
      }
    } catch (error) {
      console.log('❌ SignIn: Caught exception:', error);
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
          // Call server-side initializer to ensure subscription_plan and free credits
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (token) {
              await fetch('/api/users/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              });
            }
          } catch (e) {
            console.warn('Failed to call user initializer:', e);
          }
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
      console.log('🚺 Signing out user...');
      
      // Clear local data first
      clearAllUserData();
      
      // Sign out from Supabase (this clears server-side session)
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw - still update local state
      }
      
      // Force clear the auth state
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      
      console.log('✅ User signed out successfully');
      
      // Force a page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Still clear local state even if sign out fails
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      window.location.href = '/auth';
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

  // Google OAuth sign-in
  const signInWithGoogle = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Get current origin for redirect
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      const redirectTo = `${origin}/auth/callback`;

      // Call our Google OAuth API route
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectTo }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Google OAuth failed');
      }

      // Redirect to Google OAuth URL
      if (typeof window !== 'undefined' && data.url) {
        window.location.href = data.url;
      }

    } catch (error) {
      console.error('Google OAuth error:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Google sign-in failed',
      }));
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signInAnonymous,
    signInWithGoogle,
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
