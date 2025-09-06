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
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/linkedin/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/linkedin/callback`;
    const acceptedCallbackUrls = [devCallbackUrl];
    if (baseUrl.includes('localhost')) {
      acceptedCallbackUrls.push(prodCallbackUrl);
    }

    // Exchange code for access token
    const clientId = process.env.LINKEDIN_CLIENT_ID || '770tjdh8uh1whr';
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri = prodCallbackUrl; // Use production URL since that's what we registered

    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (tokenData.error) {
      console.error('LinkedIn token error:', tokenData.error);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=linkedin_token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user profile information
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    if (!profileResponse.ok) {
      console.error('LinkedIn profile error:', profileResponse.statusText);
      return NextResponse.redirect(`${baseUrl}/social-connect?error=linkedin_profile_failed`);
    }

    const profileData: any = await profileResponse.json();

    // Get email address
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });

    let email = '';
    if (emailResponse.ok) {
      const emailData: any = await emailResponse.json();
      if (emailData.elements && emailData.elements.length > 0) {
        email = emailData.elements[0]['handle~'].emailAddress;
      }
    }

    // For company pages, get organization information
    let companyName = '';
    if (accountType === 'company') {
      const companyResponse = await fetch(
        'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget~(localizedName)))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      if (companyResponse.ok) {
        const companyData: any = await companyResponse.json();
        if (companyData.elements && companyData.elements.length > 0) {
          companyName = companyData.elements[0]['organizationalTarget~'].localizedName;
        }
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
        platform: 'linkedin',
        socialId: profileData.id,
        accessToken,
        profile: {
          username: profileData.preferredUsername || email,
          name: profileData.localizedFirstName + ' ' + profileData.localizedLastName,
          email,
          accountType,
          companyName
        },
      }),
    });

    if (!connectionsResponse.ok) {
      console.error('Failed to store LinkedIn connection:', await connectionsResponse.text());
    }

    // Clean up state
    delete states[state];
    await writeStates(states);

    // For development, redirect to localhost
    const redirectUrl = `http://localhost:3001/social-connect?oauth_success=true&platform=linkedin&username=${encodeURIComponent(profileData.preferredUsername || email)}`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    return NextResponse.redirect(`http://localhost:3001/social-connect?error=linkedin_callback_failed`);
  }
}
