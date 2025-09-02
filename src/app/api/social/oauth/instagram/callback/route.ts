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
  const error = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_denied`);
  }

  if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });

  const states = await readStates();
  const entry = states[state];
  if (!entry) return NextResponse.json({ error: 'Invalid state' }, { status: 400 });

  try {
    const clientId = process.env.INSTAGRAM_APP_ID;
    const clientSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/instagram/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_not_configured`);
    }

    // Exchange code for short-lived access token
    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code || '',
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_token`);
    }

    const accessToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`;
    const longLivedRes = await fetch(longLivedTokenUrl);
    const longLivedData: any = await longLivedRes.json();

    if (longLivedData.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_token`);
    }

    const longLivedToken = longLivedData.access_token;

    // Get user profile
    const profileUrl = `https://graph.instagram.com/${userId}?fields=id,username,account_type,media_count&access_token=${longLivedToken}`;
    const profileRes = await fetch(profileUrl);
    const profileData: any = await profileRes.json();

    if (profileData.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_profile`);
    }

    // Persist connection
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': entry.demoUser },
      body: JSON.stringify({
        platform: 'instagram',
        socialId: userId,
        accessToken: longLivedToken,
        profile: profileData,
      }),
    });

    await removeState(state);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=instagram_failed`);
  }
}
