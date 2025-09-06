import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/facebook/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/facebook/callback`;
    const callbackUrl = isDevelopment ? prodCallbackUrl : devCallbackUrl;

    // Generate state parameter
    const state = crypto.randomBytes(12).toString('hex');
    const states = await readStates();
    states[state] = {
      userId,
      accessToken,
      createdAt: Date.now()
    };
    await writeStates(states);

    // Facebook OAuth URL construction
    const clientId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID!;
    const scope = encodeURIComponent('public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,business_management');

    const fbUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&state=${state}` +
      `&scope=${scope}` +
      `&response_type=code`;

    return NextResponse.redirect(fbUrl);
  } catch (error) {
    console.error('Facebook OAuth initiation error:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    return NextResponse.redirect(`${baseUrl}/social-connect?error=facebook_oauth_failed`);
  }
}
