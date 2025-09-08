// Supabase JWT token verification for API routes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client for server-side operations
// Using anon key for now - in production you'd use service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
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
    // Verify the JWT token with Supabase
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
