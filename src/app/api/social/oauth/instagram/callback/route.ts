import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { safeEncryptToken } from '@/lib/encryption';

const STATE_STORE = path.resolve(process.cwd(), 'tmp', 'oauth-states.json');
const DEBUG_LOG = path.resolve(process.cwd(), 'tmp', 'oauth-callback.log');

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function readStates() {
  try {
    const raw = await fs.readFile(STATE_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeStates(data: any) {
  await fs.mkdir(path.dirname(STATE_STORE), { recursive: true });
  await fs.writeFile(STATE_STORE, JSON.stringify(data, null, 2), 'utf-8');
}

async function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ''}\n`;
  try {
    await fs.mkdir(path.dirname(DEBUG_LOG), { recursive: true });
    await fs.appendFile(DEBUG_LOG, logEntry, 'utf-8');
  } catch (e) {
    console.error('Failed to write debug log:', e);
  }
}

export async function GET(req: Request) {
  try {
    await logDebug('Instagram OAuth callback started', { url: req.url });
    console.log('Instagram OAuth callback started');
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;

    await logDebug('Callback parameters', { code: code ? 'present' : 'missing', state, error });

    if (error) {
      await logDebug('OAuth error received', { error });
      console.error('Instagram OAuth error:', error);
      return NextResponse.redirect(`${baseUrl}/settings?oauth_error=${error}`);
    }

    if (!code || !state) {
      await logDebug('Missing code or state');
      console.error('Instagram OAuth - Missing code or state');
      return NextResponse.redirect(`${baseUrl}/settings?oauth_error=missing_params`);
    }

    // Read stored state
    const states = await readStates();
    const storedState = states[state];

    await logDebug('Stored state retrieval', { stateKey: state, found: !!storedState });

    if (!storedState) {
      console.error('Instagram OAuth - Invalid state:', state);
      return NextResponse.redirect(`${baseUrl}/settings?oauth_error=invalid_state`);
    }

    const { userId, accessToken: storedAccessToken, brandProfileId } = storedState;
    await logDebug('State details', { userId, brandProfileId });
    console.log('Instagram OAuth - Found stored state for user:', userId);

    // Instagram Business accounts use Facebook Graph API OAuth
    const clientId = process.env.META_APP_ID!;
    const clientSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${baseUrl}/api/social/oauth/instagram/callback`;

    await logDebug('Configuration', { clientId: clientId ? 'set' : 'missing', redirectUri });

    console.log('Instagram OAuth Callback - Using Facebook Graph API for Instagram Business');
    console.log('Instagram OAuth Callback - Redirect URI:', redirectUri);

    // Step 1: Exchange authorization code for Facebook access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code
      });

    await logDebug('Requesting access token', { tokenUrl });

    const tokenResponse = await fetch(tokenUrl);

    const tokenData: any = await tokenResponse.json();

    await logDebug('Token response', tokenData);

    console.log('Instagram OAuth Callback - Facebook token response:', JSON.stringify(tokenData));

    if (tokenData.error) {
      console.error('Instagram token error:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/settings?error=instagram_token_failed&message=${encodeURIComponent(tokenData.error.message || 'Token exchange failed')}`);
    }

    const facebookAccessToken = tokenData.access_token;

    // Step 2: Get Facebook user info
    await logDebug('Fetching user info');
    const userResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${facebookAccessToken}`
    );

    const userData: any = await userResponse.json();
    await logDebug('User info response', userData);

    console.log('Instagram OAuth Callback - Facebook user data:', JSON.stringify(userData));

    if (userData.error) {
      console.error('Instagram user error:', userData.error);
      return NextResponse.redirect(`${baseUrl}/settings?error=instagram_user_failed&message=${encodeURIComponent(userData.error.message || 'Failed to get user')}`);
    }

    // Step 3: Get Facebook Pages (required for Instagram Business accounts)
    await logDebug('Fetching Facebook pages');
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${facebookAccessToken}`
    );

    const pagesData: any = await pagesResponse.json();
    await logDebug('Pages response', pagesData);

    console.log('Instagram OAuth Callback - Facebook pages:', JSON.stringify(pagesData));

    if (pagesData.error || !pagesData.data || pagesData.data.length === 0) {
      console.error('No Facebook pages found:', pagesData.error);
      return NextResponse.redirect(`${baseUrl}/settings?error=no_facebook_pages&message=${encodeURIComponent('No Facebook Pages found. Instagram Business accounts must be connected to a Facebook Page.')}`);
    }

    // Step 4: Find Instagram Business account connected to the first page
    const page = pagesData.data[0]; // Use first page for now
    const pageAccessToken = page.access_token;
    await logDebug('Checking first page for IG account', { pageId: page.id, pageName: page.name });

    const instagramAccountResponse = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );

    const instagramAccountData: any = await instagramAccountResponse.json();
    await logDebug('IG account response', instagramAccountData);

    console.log('Instagram OAuth Callback - Instagram account data:', JSON.stringify(instagramAccountData));

    if (!instagramAccountData.instagram_business_account) {
      await logDebug('No IG business account found on page');
      return NextResponse.redirect(`${baseUrl}/settings?error=no_instagram_business&message=${encodeURIComponent('No Instagram Business account found connected to Facebook Page: ' + page.name)}`);
    }

    const instagramAccountId = instagramAccountData.instagram_business_account.id;

    // Step 5: Get Instagram account details
    await logDebug('Fetching IG details', { instagramAccountId });
    const instagramDetailsResponse = await fetch(
      `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`
    );

    const instagramDetails: any = await instagramDetailsResponse.json();
    await logDebug('IG details response', instagramDetails);

    console.log('Instagram OAuth Callback - Instagram details:', JSON.stringify(instagramDetails));

    if (instagramDetails.error) {
      console.error('Instagram details error:', instagramDetails.error);
      return NextResponse.redirect(`${baseUrl}/settings?error=instagram_details_failed&message=${encodeURIComponent(instagramDetails.error.message || 'Failed to get Instagram details')}`);
    }

    const instagramUsername = instagramDetails.username;
    const instagramName = instagramDetails.name;
    const followersCount = instagramDetails.followers_count;
    const mediaCount = instagramDetails.media_count;

    // Step 6: Store connection directly in Supabase
    console.log('Instagram OAuth - Storing connection for user:', userId);

    // Validate userId format (simple check)
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new Error(`Invalid userId: ${userId}`);
    }

    const encryptedAccessToken = safeEncryptToken(pageAccessToken);

    const profile = {
      username: instagramUsername,
      name: instagramName,
      accountType: 'business',
      followersCount: followersCount,
      mediaCount: mediaCount,
      facebookPageId: page.id,
      facebookPageName: page.name
    };

    await logDebug('Upserting to Supabase', { userId, platform: 'instagram', socialId: instagramAccountId });

    const { data, error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform: 'instagram',
        social_id: instagramAccountId,
        access_token: encryptedAccessToken,
        profile_data: profile,
        updated_at: new Date().toISOString()
      })
      .select();

    if (dbError) {
      await logDebug('Database error', dbError);
      console.error('Database error storing connection:', dbError);
      return NextResponse.redirect(`${baseUrl}/settings?oauth_error=storage_failed&message=${encodeURIComponent(dbError.message)}`);
    }

    await logDebug('Connection stored successfully', data);
    console.log('Instagram OAuth - Connection stored successfully');

    // Clean up state
    delete states[state];
    await writeStates(states);

    // Redirect back to Settings page with success message
    const redirectUrl = `${baseUrl}/settings?oauth_success=true&platform=instagram&username=${encodeURIComponent(instagramUsername)}`;
    await logDebug('Redirecting to success', { redirectUrl });
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    await logDebug('Unhandled exception in callback', { error: String(error) });
    console.error('Instagram OAuth callback error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/settings?error=instagram_callback_failed&message=${encodeURIComponent(String(error))}`);
  }
}
