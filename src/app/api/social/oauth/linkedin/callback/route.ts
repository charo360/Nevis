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
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=linkedin_denied`);
  }

  if (!state) return NextResponse.json({ error: 'Missing state' }, { status: 400 });

  const states = await readStates();
  const entry = states[state];
  if (!entry) return NextResponse.json({ error: 'Invalid state' }, { status: 400 });

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/oauth/linkedin/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=linkedin_not_configured`);
    }

    // Exchange code for access token
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code || '',
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=linkedin_token`);
    }

    const accessToken = tokenData.access_token;

    // Get basic profile
    const profileRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const profileData: any = await profileRes.json();

    // Get email address
    const emailRes = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const emailData: any = await emailRes.json();

    // Combine profile and email data
    const combinedProfile = {
      ...profileData,
      email: emailData?.elements?.[0]?.['handle~']?.emailAddress
    };

    // Persist connection
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': entry.demoUser },
      body: JSON.stringify({
        platform: 'linkedin',
        socialId: profileData.id,
        accessToken,
        profile: combinedProfile,
      }),
    });

    await removeState(state);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=linkedin_failed`);
  }
}
