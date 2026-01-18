/**
 * Instagram OAuth - Callback Handler
 * Handles the redirect from Facebook/Instagram after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SOCIAL_PLATFORMS } from '@/lib/social/oauth-config';
import { saveToken, SocialToken } from '@/lib/social/token-manager';
import { exchangeForLongLivedToken, getUserPages } from '@/lib/social/instagram-api';

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
      .eq('platform', 'instagram')
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
    const platform = SOCIAL_PLATFORMS.instagram;
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

    // Get user's pages with Instagram accounts
    const pages = await getUserPages(longLivedToken.accessToken);
    const pagesWithInstagram = pages.filter(p => p.instagramBusinessAccount);

    if (pagesWithInstagram.length === 0) {
      console.error('❌ [OAuth] No Instagram Business accounts found');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_instagram&message=${encodeURIComponent('No Instagram Business account found. Make sure your Instagram is connected to a Facebook Page.')}`
      );
    }

    // Save tokens for each Instagram account found
    for (const page of pagesWithInstagram) {
      const ig = page.instagramBusinessAccount!;
      
      const token: SocialToken = {
        platform: 'instagram',
        accessToken: page.accessToken, // Use page token for Instagram API
        expiresAt: new Date(Date.now() + longLivedToken.expiresIn * 1000),
        tokenType: 'bearer',
        scope: platform.oauth.scopes.join(','),
        accountId: ig.id,
        accountName: ig.username,
        accountType: 'business',
        profilePicture: ig.profilePictureUrl,
        metadata: {
          pageId: page.id,
          pageName: page.name,
          followersCount: ig.followersCount,
          mediaCount: ig.mediaCount,
        },
      };

      await saveToken(brandProfileId, token);
    }

    console.log(`🎉 [OAuth] Connected ${pagesWithInstagram.length} Instagram account(s) for brand ${brandProfileId}`);

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_connected&accounts=${pagesWithInstagram.length}`
    );
  } catch (error) {
    console.error('❌ [OAuth] Callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=callback_failed&message=${encodeURIComponent(String(error))}`
    );
  }
}
