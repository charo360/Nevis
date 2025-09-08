/**
 * Supabase Authentication Service
 * Replaces MongoDB authentication with Supabase auth
 */

import { supabase, TABLES } from '@/lib/supabase/config';
import type { Database } from '@/lib/supabase/config';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface AuthUser {
  userId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
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

class SupabaseAuthService {
  /**
   * Sign up a new user
   */
  async signUp({ email, password, fullName }: SignUpData) {
    try {
      console.log('🔄 Signing up user with Supabase:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        console.error('❌ Supabase signup error:', error.message);

        // Provide better error messages
        let userFriendlyMessage = error.message;

        if (error.message.includes('User already registered')) {
          userFriendlyMessage = 'An account with this email already exists. Please sign in instead or use a different email.';
        } else if (error.message.includes('Password should be at least')) {
          userFriendlyMessage = 'Password must be at least 6 characters long. Please choose a stronger password.';
        } else if (error.message.includes('Invalid email')) {
          userFriendlyMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('signup_disabled')) {
          userFriendlyMessage = 'Account registration is currently disabled. Please contact support.';
        }

        throw new Error(userFriendlyMessage);
      }

      if (!data.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('✅ User signed up successfully:', data.user.email);

      // The user profile will be automatically created by the database trigger
      return {
        user: data.user,
        session: data.session,
        needsEmailConfirmation: !data.session
      };
    } catch (error) {
      console.error('❌ Signup failed:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn({ email, password }: SignInData) {
    try {
      console.log('🔄 Signing in user with Supabase:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase signin error:', error.message);

        // Provide better error messages
        let userFriendlyMessage = error.message;

        if (error.message === 'Invalid login credentials') {
          userFriendlyMessage = 'The email or password you entered is incorrect. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userFriendlyMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('User not found')) {
          userFriendlyMessage = 'No account found with this email address. Please sign up first or check your email.';
        } else if (error.message.includes('signup_disabled')) {
          userFriendlyMessage = 'Account registration is currently disabled. Please contact support.';
        }

        throw new Error(userFriendlyMessage);
      }

      if (!data.user || !data.session) {
        throw new Error('Invalid credentials');
      }

      console.log('✅ User signed in successfully:', data.user.email);

      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('❌ Signin failed:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      console.log('🔄 Signing out user...');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Supabase signout error:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Signout failed:', error);
      throw error;
    }
  }

  /**
   * Get current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Error getting session:', error.message);
        throw new Error(error.message);
      }

      return session;
    } catch (error) {
      console.error('❌ Get session failed:', error);
      throw error;
    }
  }

  /**
   * Get current user profile from database
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const session = await this.getCurrentSession();

      if (!session?.user) {
        return null;
      }

      const { data: userProfile, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error.message);
        throw new Error(error.message);
      }

      if (!userProfile) {
        return null;
      }

      return {
        userId: userProfile.id,
        email: userProfile.email,
        fullName: userProfile.full_name || undefined,
        avatarUrl: userProfile.avatar_url || undefined,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at,
      };
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { fullName?: string; avatarUrl?: string }) {
    try {
      const session = await this.getCurrentSession();

      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      console.log('🔄 Updating user profile...');

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
        }
      });

      if (authError) {
        console.error('❌ Error updating auth profile:', authError.message);
        throw new Error(authError.message);
      }

      // Update database profile
      const { error: dbError } = await supabase
        .from(TABLES.USERS)
        .update({
          full_name: updates.fullName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id);

      if (dbError) {
        console.error('❌ Error updating database profile:', dbError.message);
        throw new Error(dbError.message);
      }

      console.log('✅ Profile updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      console.log('🔄 Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error.message);
        throw new Error(error.message);
      }

      console.log('✅ Password reset email sent');
      return true;
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();
