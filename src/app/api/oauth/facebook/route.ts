/**
 * Facebook OAuth - Initiate Flow
 * Redirects user to Facebook login
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOCIAL_PLATFORMS, buildAuthorizationUrl } from '@/lib/social/oauth-config';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId is required' },
        { status: 400 }
      );
    }

    const platform = SOCIAL_PLATFORMS.facebook;

    if (!platform.oauth.clientId) {
      return NextResponse.json(
        { error: 'Facebook OAuth not configured. Please set META_APP_ID.' },
        { status: 500 }
      );
    }

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in database for verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('oauth_states').upsert({
      state,
      brand_profile_id: brandProfileId,
      platform: 'facebook',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
    });

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(platform, state);

    console.log(`🔐 [OAuth] Redirecting to Facebook auth for brand ${brandProfileId}`);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('❌ [OAuth] Error initiating Facebook auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth', details: String(error) },
      { status: 500 }
    );
  }
}
