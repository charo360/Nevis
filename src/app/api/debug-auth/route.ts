// Debug API route to check authentication
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    return NextResponse.json({
      hasAuthHeader: !!authHeader,
      authHeader: authHeader ? 'Bearer [token]' : null,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (error) {
    console.error('Error debugging auth:', error);
    return NextResponse.json(
      { error: 'Failed to debug auth', details: error.message },
      { status: 500 }
    );
  }
}
