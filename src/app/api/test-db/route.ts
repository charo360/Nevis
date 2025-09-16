// Test database connection endpoint - using Supabase
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Testing database connection...');

    // This endpoint is disabled - using Supabase instead
    console.log('✅ Using Supabase - no MongoDB connection needed');

    return NextResponse.json({
      success: true,
      message: 'Using Supabase - database connection test not applicable',
      database: 'supabase',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Endpoint disabled - using Supabase',
        error: 'MongoDB not used in this application',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
