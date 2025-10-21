import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Google OAuth API Route
 * Senior Engineer Implementation - Production Ready
 * 
 * Handles Google sign-in/sign-up through Supabase Auth
 * Features:
 * - Environment-aware redirect URLs
 * - Comprehensive error handling
 * - Security best practices
 * - Detailed logging for debugging
 */

interface GoogleOAuthRequest {
  redirectTo?: string;
}

interface GoogleOAuthResponse {
  success: boolean;
  url?: string;
  error?: string;
  errorType?: 'oauth_error' | 'server_error' | 'validation_error';
  message?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<GoogleOAuthResponse>> {
  try {
    // Parse request body with validation
    let requestBody: GoogleOAuthRequest = {};
    
    try {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        requestBody = await req.json();
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse request body, using defaults');
    }

    // Environment-aware URL configuration
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3001';
    const origin = `${protocol}://${host}`;
    
    // Base URL selection based on environment - prioritize production domain
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (host?.includes('crevo.app') || process.env.NODE_ENV === 'production' 
                     ? 'https://crevo.app' 
                     : origin);

    // Default and final redirect URL determination
    const defaultRedirectPath = '/auth/callback';
    const defaultRedirect = `${baseUrl}${defaultRedirectPath}`;
    const finalRedirect = requestBody.redirectTo || defaultRedirect;

    // Validate redirect URL for security
    const allowedDomains = [
      'localhost:3001',
      'crevo.app',
      process.env.NEXT_PUBLIC_APP_URL
    ].filter(Boolean);

    const isValidRedirect = allowedDomains.some(domain => 
      finalRedirect.includes(domain as string)
    );

    if (!isValidRedirect) {
      console.error('❌ Invalid redirect URL attempted:', finalRedirect);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid redirect URL',
          errorType: 'validation_error'
        },
        { status: 400 }
      );
    }

    // Generate Google OAuth URL through Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: finalRedirect,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile'
        }
      }
    });

    // Handle Supabase OAuth errors
    if (error) {
      console.error('❌ Supabase OAuth error:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorType: 'oauth_error'
        },
        { status: error.status || 400 }
      );
    }

    // Validate OAuth URL generation
    if (!data?.url) {
      console.error('❌ No OAuth URL returned from Supabase');
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate OAuth URL',
          errorType: 'oauth_error'
        },
        { status: 500 }
      );
    }

    
    return NextResponse.json({
      success: true,
      url: data.url,
      message: 'OAuth URL generated successfully'
    });

  } catch (error) {
    console.error('❌ Google OAuth API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        errorType: 'server_error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CORS preflight requests
 * Required for browser-based OAuth flows
 */
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'http://localhost:3001',
    'https://crevo.app',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean);

  const isAllowedOrigin = allowedOrigins.some(allowed => 
    origin?.includes(allowed as string)
  );

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}