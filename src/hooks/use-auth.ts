// Supabase-based authentication hook (replaces MongoDB auth)
import { useState, useEffect, useCallback } from 'react';
import { supabaseAuth, type AuthUser } from '@/lib/services/supabase-auth';

// Re-export AuthUser from Supabase service for compatibility
export type { AuthUser } from '@/lib/services/supabase-auth';

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

  // Clear auth data from localStorage (Supabase handles session storage automatically)
  const clearAuthData = useCallback(() => {
    // Supabase handles its own session storage, but we clear any app-specific data
    console.log('🧹 Clearing app-specific auth data...');
  }, []);

  // Clear all user-related data from localStorage (brands, settings, etc.)
  const clearAllUserData = useCallback(() => {
    console.log('🧹 Clearing all user-related data from localStorage...');

    // Clear auth data
    clearAuthData();

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
  }, [clearAuthData]);

  // Refresh access token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔄 Attempting to refresh access token...');
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefreshToken) {
        console.log('❌ No refresh token found in localStorage');
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (response.ok) {
        console.log('✅ Token refresh successful');
        const data = await response.json();
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL || '',
          isAnonymous: data.user.isAnonymous || false,
        };

        storeAuthData(data.token, data.refreshToken, user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
        console.log('✅ Auth state updated after token refresh for user:', user.userId);
        return true;
      } else {
        console.warn('⚠️ Token refresh failed with status:', response.status);
        const errorData = await response.text();
        console.warn('⚠️ Token refresh error response:', errorData);
        console.log('🔄 Clearing expired auth data and continuing as anonymous user...');
        clearAllUserData();
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      clearAllUserData();
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
      return false;
    }
  }, [storeAuthData, clearAllUserData]);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 SignIn: Starting Supabase authentication for:', email);

      // Clear any existing user data to prevent cross-contamination between accounts
      console.log('🧹 Clearing previous user data before login...');
      clearAllUserData();

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const result = await supabaseAuth.signIn({ email, password });

      console.log('✅ SignIn: Supabase authentication successful for user:', result.user.email);

      // Get user profile after successful signin
      const userProfile = await supabaseAuth.getCurrentUser();

      if (!userProfile) {
        throw new Error('Failed to load user profile after signin');
      }

      setAuthState({
        user: userProfile,
        loading: false,
        error: null,
      });

      console.log('✅ SignIn: User state updated successfully');
    } catch (error) {
      console.error('❌ SignIn: Authentication failed:', error);
      clearAllUserData();
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      console.log('📝 SignUp: Starting Supabase registration for:', email);

      // Clear any existing user data to ensure clean state for new user
      console.log('🧹 Clearing any existing user data before registration...');
      clearAllUserData();

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const result = await supabaseAuth.signUp({
        email,
        password,
        fullName: displayName
      });

      console.log('✅ SignUp: Supabase registration successful for user:', result.user?.email);

      if (result.needsEmailConfirmation) {
        console.log('📧 Email confirmation required');
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
        // Don't throw error, just inform user about email confirmation
        return;
      }

      // Get user profile after successful signup
      const userProfile = await supabaseAuth.getCurrentUser();

      if (!userProfile) {
        throw new Error('Failed to load user profile after signup');
      }

      setAuthState({
        user: userProfile,
        loading: false,
        error: null,
      });

      console.log('✅ SignUp: User state updated successfully');
    } catch (error) {
      console.error('❌ SignUp: Registration failed:', error);
      clearAllUserData();
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  // Sign in anonymously (for demo users)
  const signInAnonymous = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL || '',
          isAnonymous: true,
        };

        storeAuthData(data.token, data.refreshToken, user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.error || 'Anonymous login failed',
        });
        throw new Error(data.error || 'Anonymous login failed');
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
      console.log('🚪 Signing out user from Supabase...');

      await supabaseAuth.signOut();

      clearAllUserData(); // Clear all user data, not just auth tokens
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
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = {
          ...authState.user,
          ...updates,
        };

        localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
        setAuthState(prev => ({
          ...prev,
          user: updatedUser,
        }));
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Get current access token
  const getAccessToken = useCallback((): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    // Utility methods
    isAuthenticated: !!authState.user,
    isLoading: authState.loading,
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
