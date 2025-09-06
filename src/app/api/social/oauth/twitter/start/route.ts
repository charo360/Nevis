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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    // For development, use the production callback URL if NEXT_PUBLIC_APP_URL is not set
    const isDevelopment = !process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost');
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/twitter/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/twitter/callback`;
    const callbackUrl = isDevelopment ? prodCallbackUrl : devCallbackUrl;

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
