// Supabase JWT token verification for API routes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Create Supabase client for server-side operations
// Use service role key for admin operations, anon key for user operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create client with anon key for user operations
const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface SupabaseUser {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
}

/**
 * Verify Supabase JWT token and return user information
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  try {
    // TEMPORARY FIX: If service role key is not properly set, use client-side verification
    if (supabaseServiceKey === supabaseAnonKey) {
      console.log('⚠️ Using temporary token verification (service role key not set)');

      // Use the user client to verify the token
      const { data: { user }, error } = await supabaseUser.auth.getUser(token);

      if (error || !user) {
        console.error('❌ Supabase token verification failed:', error?.message);
        return null;
      }

      return {
        userId: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.full_name || '',
        photoURL: user.user_metadata?.avatar_url || '',
        isAnonymous: false
      };
    }

    // Normal verification with service role key
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      console.error('❌ Supabase token verification failed:', error?.message);
      return null;
    }

    // Get user profile from database
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      userId: user.id,
      email: user.email || '',
      displayName: profile?.full_name || user.user_metadata?.full_name || '',
      photoURL: profile?.avatar_url || user.user_metadata?.avatar_url || '',
      isAnonymous: false
    };
  } catch (error) {
    console.error('❌ Error verifying Supabase token:', error);
    return null;
  }
}

/**
 * Extract and verify authorization token from request headers
 */
export async function getAuthenticatedUser(authHeader: string | null): Promise<SupabaseUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return await verifySupabaseToken(token);
}
