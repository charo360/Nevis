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
  const authHeader = req.headers.get('authorization') || '';

  // Get user ID from Bearer token or query param
  let userId: string | null = null;
  let accessToken: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
    // For now, we'll use a simple userId from query or generate one
    userId = url.searchParams.get('userId') || 'user_' + Date.now();
  } else {
    // Fallback for demo/development
    userId = url.searchParams.get('userId') || 'demo';
  }

  try {
  // Use NEXT_PUBLIC_APP_URL when available (build-time / production). Fall back to localhost for local dev.
  const baseUrlRaw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const baseUrl = baseUrlRaw.replace(/\/$/, '');
  const callbackUrl = `${baseUrl}/api/social/oauth/twitter/callback`;

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

  // Sanity-check the generated URL params to catch redirect_uri / client_id mismatches early
    try {
      const parsed = new URL(authUrl);
      const redirectParam = parsed.searchParams.get('redirect_uri');

  // Log non-sensitive metadata to help debug 400 errors from X/Twitter
  console.info('[twitter-oauth] generated authUrl callbackUrl=', callbackUrl);

  if (redirectParam && redirectParam !== callbackUrl) {
        console.error('[twitter-oauth] redirect_uri mismatch', { redirectParam, callbackUrl });
        // Continue — still store state and redirect, but surface the mismatch in logs for diagnosis
      }
    } catch (e) {
      console.warn('[twitter-oauth] failed to parse generated authUrl', e?.message || e);
    }

    // Store the codeVerifier and state for the callback
    const states = await readStates();
    states[state] = {
      createdAt: Date.now(),
      codeVerifier,
      userId,
      accessToken,
    };
    await writeStates(states);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/social-connect?error=twitter_oauth_failed`);
  }
}
