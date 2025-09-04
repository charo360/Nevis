// Token refresh API route
import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth/jwt';
import { z } from 'zod';

// Request validation schema
const RefreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = RefreshSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { refreshToken } = validationResult.data;

    // Refresh access token
    const result = await refreshAccessToken(refreshToken);

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
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
