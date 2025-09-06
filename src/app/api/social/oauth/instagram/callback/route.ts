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

    const { userId, accessToken: storedAccessToken, accountType } = storedState;

    // For development, accept callbacks from production URL
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/instagram/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/instagram/callback`;
    const acceptedCallbackUrls = [devCallbackUrl];
    if (baseUrl.includes('localhost')) {
      acceptedCallbackUrls.push(prodCallbackUrl);
    }

    // Exchange code for access token using Facebook's Graph API
    const clientId = process.env.FACEBOOK_APP_ID!;
    const clientSecret = process.env.FACEBOOK_APP_SECRET!;
    const redirectUri = prodCallbackUrl; // Use production URL since that's what we registered

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson: any = await tokenRes.json();

    if (tokenJson.error) {
      console.error('Instagram token error:', tokenJson.error);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=instagram_token_failed`);
    }

    const accessToken = tokenJson.access_token;

    // Get user info from Facebook
    const userUrl = new URL('https://graph.facebook.com/v19.0/me');
    userUrl.searchParams.append('fields', 'id,name');
    userUrl.searchParams.append('access_token', accessToken);

    const userRes = await fetch(userUrl.toString());
    const userJson: any = await userRes.json();

    if (userJson.error) {
      console.error('Instagram user error:', userJson.error);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=instagram_user_failed`);
    }

    // Handle different account types
    let instagramUsername = null;
    let instagramUserId = null;
    let pageName = null;

    if (accountType === 'business') {
      // For business accounts, get Facebook pages first
      const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
      pagesUrl.searchParams.append('access_token', accessToken);

      const pagesRes = await fetch(pagesUrl.toString());
      const pagesJson: any = await pagesRes.json();

      if (pagesJson.data && pagesJson.data.length > 0) {
        // Use the first page (in a real app, you'd let the user choose)
        const page = pagesJson.data[0];
        pageName = page.name;

        // Get Instagram business account connected to this page
        const igAccountUrl = new URL(`https://graph.facebook.com/v19.0/${page.id}`);
        igAccountUrl.searchParams.append('fields', 'instagram_business_account');
        igAccountUrl.searchParams.append('access_token', accessToken);

        const igAccountRes = await fetch(igAccountUrl.toString());
        const igAccountJson: any = await igAccountRes.json();

        if (igAccountJson.instagram_business_account) {
          instagramUserId = igAccountJson.instagram_business_account.id;

          // Get Instagram account info
          const igInfoUrl = new URL(`https://graph.facebook.com/v19.0/${instagramUserId}`);
          igInfoUrl.searchParams.append('fields', 'username,profile_picture_url');
          igInfoUrl.searchParams.append('access_token', accessToken);

          const igInfoRes = await fetch(igInfoUrl.toString());
          const igInfoJson: any = await igInfoRes.json();

          if (!igInfoJson.error) {
            instagramUsername = igInfoJson.username;
          }
        }
      }
    } else {
      // For personal accounts, use Instagram Basic Display API
      const basicDisplayUrl = new URL('https://graph.instagram.com/me');
      basicDisplayUrl.searchParams.append('fields', 'id,username');
      basicDisplayUrl.searchParams.append('access_token', accessToken);

      const basicDisplayRes = await fetch(basicDisplayUrl.toString());
      const basicDisplayJson: any = await basicDisplayRes.json();

      if (!basicDisplayJson.error) {
        instagramUserId = basicDisplayJson.id;
        instagramUsername = basicDisplayJson.username;
      }
    }

    // Store connection via connections API
    const connectionsResponse = await fetch(`${baseUrl}/api/social/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storedAccessToken}`,
        'x-demo-user': userId // Fallback for demo/development
      },
      body: JSON.stringify({
        platform: 'instagram',
        socialId: instagramUserId || userJson.id,
        accessToken,
        profile: {
          username: instagramUsername,
          name: userJson.name,
          accountType,
          pageName
        },
      }),
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to store Instagram connection:', await connectionsResponse.text());
    }

    // Clean up state
    delete states[state];
    await writeStates(states);

    // For development, redirect to localhost
    const redirectUrl = `http://localhost:3001/social-connect?oauth_success=true&platform=instagram&username=${encodeURIComponent(instagramUsername || userJson.name)}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return NextResponse.redirect(`http://localhost:3001/social-connect?error=instagram_callback_failed`);
  }
}
