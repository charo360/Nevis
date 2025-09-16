import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check - using Supabase instead of MongoDB
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      databaseType: 'supabase'
    }
  });
}

// POST endpoint removed - using Supabase auth instead
