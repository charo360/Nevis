import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if we have valid environment variables
  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'REPLACE_WITH_REAL_ANON_KEY_FROM_SUPABASE_DASHBOARD') {
    console.error('🚨 Supabase configuration missing or invalid!');
    console.error('Please update your .env.local file with valid Supabase credentials:');
    console.error('1. Go to: https://supabase.com/dashboard/project/nrfceylvtiwpqsoxurrv');
    console.error('2. Navigate to Settings → API');
    console.error('3. Copy the "anon public" key');
    console.error('4. Update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    
    // Return a mock client for development
    return {
      auth: {
        signIn: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        signUp: () => Promise.resolve({ error: { message: 'Supabase not configured' } })
      },
      from: () => ({
        select: () => ({ data: [], error: { message: 'Supabase not configured' } }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
          download: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
          remove: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
          list: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } })
        }),
        listBuckets: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } })
      }
    } as any;
  }

  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}