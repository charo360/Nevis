// Supabase-based authentication hook (replaces MongoDB auth)
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
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
  const supabase = createClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Session timeout management
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [sessionTimeoutId, setSessionTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [idleTimeoutId, setIdleTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Constants for timeouts (in milliseconds) - Extended for better UX
  const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  const IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours (much longer idle time)

  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId);
      setSessionTimeoutId(null);
    }
    if (idleTimeoutId) {
      clearTimeout(idleTimeoutId);
      setIdleTimeoutId(null);
    }
  }, [sessionTimeoutId, idleTimeoutId]);

  // Set up session and idle timeouts
  const setupTimeouts = useCallback(() => {
    clearTimeouts();

    if (!authState.user) return;

    const now = Date.now();

    // Set session start time if not set
    if (!sessionStartTime) {
      setSessionStartTime(now);
    }

    // Calculate remaining time for session timeout (12 hours from login)
    const sessionStart = sessionStartTime || now;
    const sessionRemaining = SESSION_DURATION - (now - sessionStart);

    // DISABLED: All automatic logout functionality
    // Users now stay logged in indefinitely unless they manually logout

  }, [authState.user, sessionStartTime]);

  // Set up activity listeners and timeouts
  useEffect(() => {
    if (!authState.user) {
      // Clear all timeouts when user logs out
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        setSessionTimeoutId(null);
      }
      if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
        setIdleTimeoutId(null);
      }
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set initial activity time
    setLastActivityTime(Date.now());

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        setSessionTimeoutId(null);
      }
      if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
        setIdleTimeoutId(null);
      }
    };
  }, [authState.user]);

  // Set up session timeout when user logs in
  useEffect(() => {
    if (!authState.user || !sessionStartTime) return;

    const now = Date.now();
    const sessionStart = sessionStartTime;
    const sessionRemaining = SESSION_DURATION - (now - sessionStart);

    // DISABLED: Auto-logout functionality as requested by user
    // Users should stay logged in unless they manually logout
    
    return () => {
      // Cleanup any existing timeouts (disabled)
      if (sessionTimeoutId) {
        clearTimeout(sessionTimeoutId);
        setSessionTimeoutId(null);
      }
      if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
        setIdleTimeoutId(null);
      }
    };
  }, [authState.user, sessionStartTime]);

  // Set up idle timeout and reset when activity occurs
  useEffect(() => {
    if (!authState.user) return;

    // Clear existing idle timeout
    if (idleTimeoutId) {
      clearTimeout(idleTimeoutId);
    }

    // Set new idle timeout
    const idleId = setTimeout(() => {
      signOut();
    }, IDLE_TIMEOUT);
    setIdleTimeoutId(idleId);

    return () => {
      if (idleTimeoutId) {
        clearTimeout(idleTimeoutId);
        setIdleTimeoutId(null);
      }
    };
  }, [lastActivityTime, authState.user]);

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
        
        if (mounted) {
          const hasUser = !!session?.user;
          setAuthState({
            user: hasUser ? convertUser(session.user) : null,
            loading: false,
            error: null,
          });

          // Set session start time when user signs in or session is restored
          if (hasUser && event === 'SIGNED_IN') {
            setSessionStartTime(Date.now());
            setLastActivityTime(Date.now());
            
            // Credit initialization is now handled automatically by the credits API
          }

          // Clear session state when user signs out
          if (!hasUser && event === 'SIGNED_OUT') {
            setSessionStartTime(null);
            setLastActivityTime(Date.now());
            clearTimeouts();
          }
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

  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      
      // Clear any existing user data to prevent cross-contamination between accounts
      clearAllUserData();
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
        
        const user = convertUser(data.user);
        setAuthState({
          user,
          loading: false,
          error: null,
        });

        // Set session start time for timeout management
        setSessionStartTime(Date.now());
        setLastActivityTime(Date.now());
      } else {
        throw new Error('Authentication failed - no user returned');
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
      
      // Clear any existing user data to ensure clean state for new user
      clearAllUserData();
      
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

        // Set session start time for timeout management
        setSessionStartTime(Date.now());
        setLastActivityTime(Date.now());
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
      
      // Clear timeouts first
      clearTimeouts();
      
      // Reset session state
      setSessionStartTime(null);
      setLastActivityTime(Date.now());
      
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

      // Environment-aware origin detection
      let origin = 'http://localhost:3001';
      if (typeof window !== 'undefined') {
        origin = window.location.origin;
        // Force production URL if on production domain
        if (window.location.hostname === 'crevo.app' || window.location.hostname.includes('crevo.app')) {
          origin = 'https://crevo.app';
        }
      }
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
