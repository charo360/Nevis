// MongoDB-based authentication hook (replaces Firebase auth)
import { useState, useEffect, useCallback } from 'react';
import { JWTPayload } from '@/lib/auth/jwt';

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

// Token storage keys
const ACCESS_TOKEN_KEY = 'nevis_access_token';
const REFRESH_TOKEN_KEY = 'nevis_refresh_token';
const USER_DATA_KEY = 'nevis_user_data';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        console.log('🔍 Loading stored auth on mount...');
        const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedUserData = localStorage.getItem(USER_DATA_KEY);

        if (storedToken && storedUserData) {
          console.log('📱 Found stored auth data, verifying token...');
          const userData = JSON.parse(storedUserData) as AuthUser;

          // Verify token is still valid
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${storedToken}`,
              },
              // Add timeout to prevent hanging
              signal: AbortSignal.timeout(5000), // 5 second timeout
            });

            if (response.ok) {
              console.log('✅ Token verified successfully, user authenticated:', userData.userId);
              setAuthState({
                user: userData,
                loading: false,
                error: null,
              });
            } else {
              console.warn('⚠️ Token verification failed, attempting refresh...');
              // Token is invalid, try to refresh
              await refreshToken();
            }
          } catch (fetchError) {
            console.warn('🌐 Network error during token verification, using cached auth:', fetchError);
            // If network fails, use cached auth data but mark as potentially stale
            // This allows the app to work offline or when API routes are temporarily unavailable
            setAuthState({
              user: userData,
              loading: false,
              error: null,
            });
          }
        } else {
          console.log('🚫 No stored auth data found');
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('❌ Error loading stored auth:', error);
        setAuthState({
          user: null,
          loading: false,
          error: null,
        });
      }
    };

    // Add a small delay to allow server to fully start up
    const timer = setTimeout(() => {
      loadStoredAuth();
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  // Store auth data in localStorage
  const storeAuthData = useCallback((token: string, refreshToken: string, user: AuthUser) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  }, []);

  // Clear auth data from localStorage
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
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
        console.error('❌ Token refresh failed with status:', response.status);
        const errorData = await response.text();
        console.error('❌ Token refresh error response:', errorData);
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
      console.log('🔐 SignIn: Starting authentication for:', email);

      // Clear any existing user data to prevent cross-contamination between accounts
      console.log('🧹 Clearing previous user data before login...');
      clearAllUserData();

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ SignIn: Authentication successful for user:', data.user.userId);
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL || '',
          isAnonymous: false,
        };

        console.log('💾 SignIn: Storing auth data and updating state...');
        storeAuthData(data.token, data.refreshToken, user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });
        console.log('✅ SignIn: Auth state updated successfully');
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: data.error || 'Login failed',
        });
        throw new Error(data.error || 'Login failed');
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
      console.log('🧹 Clearing any existing user data before registration...');
      clearAllUserData();

      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const user: AuthUser = {
          userId: data.user.userId,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL || '',
          isAnonymous: false,
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
          error: data.error || 'Registration failed',
        });
        throw new Error(data.error || 'Registration failed');
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
      console.log('🚪 Signing out user...');
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
