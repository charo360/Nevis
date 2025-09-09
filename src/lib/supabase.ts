import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance using anon key
// Use this only in browser/client components
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

