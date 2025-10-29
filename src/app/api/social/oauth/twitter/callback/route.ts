import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_request`);
  }

  try {
    // Get stored state from Supabase
    const { data: storedState, error: stateError } = await supabase
      .from('oauth_states')
      .select('*')
      .eq('state', state)
      .eq('platform', 'twitter')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (stateError || !storedState) {
      console.error('Invalid or expired state:', stateError);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_state`);
    }

    const { code_verifier: codeVerifier, user_id: userId } = storedState;

    if (!userId) {
      console.error('No userId in stored state');
      return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_state`);
    }

    // Initialize Twitter client
    const twitterClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY!,
    });

    // Use localhost callback in development, production URL in production
    const isDevelopment = baseUrl.includes('localhost');
    const callbackUrl = isDevelopment 
      ? 'http://localhost:3001/api/social/oauth/twitter/callback'
      : 'https://crevo.app/api/social/oauth/twitter/callback';

    // Get access token
    const { client: loggedClient, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl, // Use the same URL we registered with
    });

    // Get user info
    const { data: userObject } = await loggedClient.v2.me();

    // Store connection via connections API
    console.log('Storing Twitter connection for user:', userId);
    const connectionsResponse = await fetch(`${baseUrl}/api/social/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user': userId // Use the userId from stored state
      },
      body: JSON.stringify({
        platform: 'twitter',
        socialId: userObject.id,
        accessToken,
        refreshToken,
        profile: {
          id: userObject.id,
          username: userObject.username,
          name: userObject.name,
        },
      }),
    });

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text();
      console.error('Failed to store connection:', errorText);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=storage_failed`);
    }

    console.log('Successfully stored Twitter connection');

    // Clean up state from Supabase
    await supabase
      .from('oauth_states')
      .delete()
      .eq('state', state);

    // Redirect to the same base URL we're running on
    const redirectUrl = `${baseUrl}/social-connect?oauth_success=true&platform=twitter&username=${userObject.username}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/social-connect?error=twitter_callback_failed`);
  }
}
