import { NextResponse } from 'next/server';

// This route is deprecated - using Supabase auth instead of MongoDB
export async function POST(req: Request) {
  try {
    // TODO: Implement Supabase session check if needed
    return NextResponse.json({
      ok: true,
      message: 'Using Supabase auth - this endpoint is deprecated'
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({
      ok: false,
      reason: 'supabase-auth-used'
    }, { status: 500 });
  }
}
