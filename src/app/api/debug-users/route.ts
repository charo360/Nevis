import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint is disabled - using Supabase instead of MongoDB
    return NextResponse.json({
      message: 'This endpoint is disabled - using Supabase auth instead of MongoDB',
      users: []
    });

  } catch (error) {
    console.error('Error in debug-users endpoint:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled', details: 'Using Supabase instead of MongoDB' },
      { status: 503 }
    );
  }
}
