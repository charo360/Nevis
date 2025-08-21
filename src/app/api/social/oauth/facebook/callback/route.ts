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

async function removeState(state: string) {
  try {
    const raw = await fs.readFile(STATE_STORE, 'utf-8');
    const data = JSON.parse(raw || '{}');
    delete data[state];
    await fs.writeFile(STATE_STORE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });

  const states = await readStates();
  const entry = states[state];
  if (!entry) return NextResponse.json({ error: 'Invalid state' }, { status: 400 });

  try {
    const clientId = process.env.FACEBOOK_API_KEY;
    const clientSecret = process.env.FACEBOOK_SECRET_KEY || process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/facebook/callback`;

    if (!code) {
      console.error('Facebook callback missing code');
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    if (!clientId || !clientSecret) {
      console.error('Facebook client ID/secret not configured');
      return NextResponse.json({ error: 'Facebook not configured' }, { status: 500 });
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code as string);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson: any = await tokenRes.json();

    if (tokenJson.error) {
      console.error('Facebook token error:', tokenJson.error);
      return NextResponse.json({ error: tokenJson.error }, { status: 400 });
    }

    const accessToken = tokenJson.access_token;

    // Fetch profile with email
    const profileUrl = new URL('https://graph.facebook.com/v19.0/me');
    profileUrl.searchParams.append('fields', 'id,name,email');
    profileUrl.searchParams.append('access_token', accessToken);

    const profileRes = await fetch(profileUrl.toString());
    const profileJson: any = await profileRes.json();

    if (profileJson.error) {
      console.error('Facebook profile error:', profileJson.error);
      return NextResponse.json({ error: profileJson.error }, { status: 400 });
    }

    // Persist connection (single POST)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': entry.demoUser },
      body: JSON.stringify({
        platform: 'facebook',
        socialId: profileJson.id,
        accessToken,
        profile: profileJson,
      }),
    });

    await removeState(state);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  } catch (error) {
    console.error('Facebook callback failed', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=facebook_failed`);
  }
}
