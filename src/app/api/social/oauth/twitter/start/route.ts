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

    // Store the codeVerifier and state for the callback
    const states = await readStates();
    states[state] = {
      createdAt: Date.now(),
      codeVerifier,
      userId,
    };
    await writeStates(states);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/social-connect?error=twitter_oauth_failed`);
  }
}
