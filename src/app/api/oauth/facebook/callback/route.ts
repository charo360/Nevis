/**
 * Facebook OAuth - Callback Handler
 * Handles the redirect from Facebook after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOCIAL_PLATFORMS } from '@/lib/social/oauth-config';
import { saveToken, SocialToken } from '@/lib/social/token-manager';
import { exchangeForLongLivedToken } from '@/lib/social/instagram-api';
import { getUserPages } from '@/lib/social/facebook-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle user denial
    if (error) {
      console.error(`❌ [OAuth] User denied access: ${errorDescription}`);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_denied&message=${encodeURIComponent(errorDescription || 'Access denied')}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_callback&message=Missing code or state`
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify state token
    const { data: stateData } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'facebook')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!stateData) {
      console.error('❌ [OAuth] Invalid or expired state token');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_state&message=Session expired, please try again`
      );
    }

    const brandProfileId = stateData.brand_profile_id;

    // Delete used state
    await supabase.from('oauth_states').delete().eq('state', state);

    // Exchange code for access token
    const platform = SOCIAL_PLATFORMS.facebook;
    const tokenResponse = await fetch(platform.oauth.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: platform.oauth.clientId,
        client_secret: platform.oauth.clientSecret,
        redirect_uri: platform.oauth.redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.json();
      console.error('❌ [OAuth] Token exchange failed:', tokenError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange&message=${encodeURIComponent(tokenError.error?.message || 'Failed to get access token')}`
      );
    }

    const tokenData = await tokenResponse.json();
    console.log(`✅ [OAuth] Got short-lived token`);

    // Exchange for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(tokenData.access_token);
    console.log(`✅ [OAuth] Exchanged for long-lived token (expires in ${longLivedToken.expiresIn}s)`);

    // Get user's Facebook pages
    const pages = await getUserPages(longLivedToken.accessToken);

    if (pages.length === 0) {
      console.error('❌ [OAuth] No Facebook Pages found');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_pages&message=${encodeURIComponent('No Facebook Pages found. You need to manage at least one Facebook Page.')}`
      );
    }

    // Save tokens for each page
    for (const page of pages) {
      const token: SocialToken = {
        platform: 'facebook',
        accessToken: page.accessToken,
        expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
        tokenType: 'bearer',
        scope: platform.oauth.scopes.join(','),
        accountId: page.id,
        accountName: page.name,
        accountType: 'page',
        profilePicture: page.picture,
        metadata: {
          category: page.category,
          fanCount: page.fanCount,
        },
      };

      await saveToken(brandProfileId, token);
    }

    console.log(`🎉 [OAuth] Connected ${pages.length} Facebook Page(s) for brand ${brandProfileId}`);

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=facebook_connected&accounts=${pages.length}`
    );
  } catch (error) {
    console.error('❌ [OAuth] Callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed&message=${encodeURIComponent(String(error))}`
    );
  }
}
