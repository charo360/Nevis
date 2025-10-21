import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    allCookies.forEach(c => {
    });

    // Find Supabase auth cookies
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.includes('sb-') ||
      c.name.includes('auth-token')
    );

    supabaseCookies.forEach(c => {
    });

    // Create server-side Supabase client with proper cookie handling
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      hasAuthHeader: !!request.headers.get('authorization'),
      totalCookies: allCookies.length,
      supabaseCookies: supabaseCookies.length,
      cookieNames: allCookies.map(c => c.name),
      supabaseCookieNames: supabaseCookies.map(c => c.name),
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      } : null,
      error: authError?.message || (user ? null : 'Auth session missing!'),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Debug auth error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}