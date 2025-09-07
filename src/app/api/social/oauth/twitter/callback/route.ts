import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';
import path from 'path';

const STATE_STORE = path.resolve(process.cwd(), 'tmp', 'oauth-states.json');

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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_request`);
  }

  try {
    // Read stored state
    const states = await readStates();
    const storedState = states[state];

    if (!storedState || !storedState.codeVerifier) {
      return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_state`);
    }

    const { codeVerifier, userId } = storedState;

    // Initialize Twitter client
    const twitterClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY!,
    });

  // Build deterministic callbackUrl from NEXT_PUBLIC_APP_URL or localhost
  const baseUrlRaw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const baseUrlClean = baseUrlRaw.replace(/\/$/, '');
  const callbackUrl = `${baseUrlClean}/api/social/oauth/twitter/callback`;

    // Get access token
    const { client: loggedClient, accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackUrl,
    });

    // Get user info
    const { data: userObject } = await loggedClient.v2.me();

    // Store connection via connections API
    const connectionsResponse = await fetch(`${baseUrl}/api/social/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedState.accessToken}`,
        'x-demo-user': storedState.userId // Fallback for demo/development
      },
      body: JSON.stringify({
        platform: 'twitter',
        socialId: userObject.id,
        accessToken,
        refreshToken,
        profile: userObject,
      }),
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to store connection:', await connectionsResponse.text());
    }

    // Clean up state
    delete states[state];
    await writeStates(states);

    // For development, redirect to localhost
    const redirectUrl = `http://localhost:3001/social-connect?oauth_success=true&platform=twitter&username=${userObject.username}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return NextResponse.redirect(`http://localhost:3001/social-connect?error=twitter_callback_failed`);
  }
}
