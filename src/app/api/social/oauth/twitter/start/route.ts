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
  const authHeader = req.headers.get('authorization') || '';

  // Get user ID from query param (passed from frontend)
  let userId: string | null = url.searchParams.get('userId');
  
  if (!userId) {
    console.error('No userId provided in OAuth start');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/social-connect?error=no_user_id`);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    // Use localhost callback in development, production URL in production
    const isDevelopment = baseUrl.includes('localhost');
    const callbackUrl = isDevelopment 
      ? 'http://localhost:3001/api/social/oauth/twitter/callback'
      : 'https://crevo.app/api/social/oauth/twitter/callback';

    // Initialize Twitter client with OAuth 2.0
    const twitterClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY!,
    });

    // Generate OAuth 2.0 authentication URL
    const { url: authUrl, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
      callbackUrl,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access']
      }
    );

    // Store state in Supabase for verification in callback
    const { error: stateError } = await supabase
      .from('oauth_states')
      .insert({
        state,
        code_verifier: codeVerifier,
        user_id: userId,
        platform: 'twitter',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=state_storage_failed`);
    }

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/social-connect?error=twitter_oauth_failed`);
  }
}
