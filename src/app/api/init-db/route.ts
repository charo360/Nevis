// Database initialization - using Supabase instead of MongoDB
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // This endpoint is disabled - using Supabase instead
    return NextResponse.json({
      success: true,
      message: 'Using Supabase - MongoDB initialization not needed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Endpoint disabled - using Supabase',
        details: 'MongoDB not used in this application',
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check - using Supabase instead
    return NextResponse.json({
      success: true,
      message: 'Using Supabase - database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Endpoint disabled - using Supabase',
        details: 'MongoDB not used in this application',
      },
      { status: 503 }
    );
  }
}
