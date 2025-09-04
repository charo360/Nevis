// Anonymous user creation API route
import { NextRequest, NextResponse } from 'next/server';
import { createAnonymousUser } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Create anonymous user
    const result = await createAnonymousUser();

    if (result.success) {
      return NextResponse.json({
        success: true,
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Anonymous user creation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
