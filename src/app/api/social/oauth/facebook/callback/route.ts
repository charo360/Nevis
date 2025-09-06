import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

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

    if (!storedState) {
      return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_state`);
    }

    const { userId, accessToken: storedAccessToken } = storedState;

    // For development, accept callbacks from production URL
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/facebook/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/facebook/callback`;
    const acceptedCallbackUrls = [devCallbackUrl];
    if (baseUrl.includes('localhost')) {
      acceptedCallbackUrls.push(prodCallbackUrl);
    }

    // Exchange code for access token
    const clientId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID!;
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_SECRET_KEY || process.env.FACEBOOK_CLIENT_SECRET!;
    const redirectUri = prodCallbackUrl; // Use production URL since that's what we registered

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson: any = await tokenRes.json();

    if (tokenJson.error) {
      console.error('Facebook token error:', tokenJson.error);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=facebook_token_failed`);
    }

    const accessToken = tokenJson.access_token;

    // Fetch user profile
    const profileUrl = new URL('https://graph.facebook.com/v19.0/me');
    profileUrl.searchParams.append('fields', 'id,name,email');
    profileUrl.searchParams.append('access_token', accessToken);

    const profileRes = await fetch(profileUrl.toString());
    const profileJson: any = await profileRes.json();

    if (profileJson.error) {
      console.error('Facebook profile error:', profileJson.error);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=facebook_profile_failed`);
    }

    // Fetch user's pages
    const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
    pagesUrl.searchParams.append('access_token', accessToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson: any = await pagesRes.json();

    // Store connection via connections API
    const connectionsResponse = await fetch(`${baseUrl}/api/social/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedAccessToken}`,
        'x-demo-user': userId // Fallback for demo/development
      },
      body: JSON.stringify({
        platform: 'facebook',
        socialId: profileJson.id,
        accessToken,
        profile: profileJson,
        pages: pagesJson.data || [],
      }),
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to store Facebook connection:', await connectionsResponse.text());
    }

    // Clean up state
    delete states[state];
    await writeStates(states);

    // For development, redirect to localhost
    const redirectUrl = `http://localhost:3001/social-connect?oauth_success=true&platform=facebook&username=${encodeURIComponent(profileJson.name)}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(`http://localhost:3001/social-connect?error=facebook_callback_failed`);
  }
}
