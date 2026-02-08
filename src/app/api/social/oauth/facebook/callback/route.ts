import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Decryption helper
function decrypt(text: string, secret: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    // Ensure secret is 32 bytes
    const key = crypto.createHash('sha256').update(secret).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Failed to decrypt state');
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

  console.log('[OAuth Callback] Received callback', { code: !!code, state: !!state });

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=invalid_request&tab=social`);
  }

  try {
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_SECRET_KEY || process.env.FACEBOOK_CLIENT_SECRET!;
    if (!clientSecret) {
      console.error('Missing FACEBOOK_APP_SECRET in callback');
      throw new Error('Server configuration error');
    }

    // Decrypt and Verify State
    let stateData;
    try {
      const decrypted = decrypt(state, clientSecret);
      stateData = JSON.parse(decrypted);
      console.log('[OAuth Callback] State verified', { userId: stateData.userId });
    } catch (e) {
      console.error('State decryption failed:', e);
      return NextResponse.redirect(`${baseUrl}/settings?error=invalid_state&tab=social`);
    }

    // Check expiration (e.g. 1 hour)
    if (Date.now() - stateData.timestamp > 3600000) {
      console.error('State expired');
      return NextResponse.redirect(`${baseUrl}/settings?error=state_expired&tab=social`);
    }

    const { userId, brandProfileId, accessToken: storedAccessToken } = stateData;

    // For development, accept callbacks from production URL
    // Matching the logic in start/route.ts
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/facebook/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/facebook/callback`;

    // We must use the exact same redirectURI that was used in the start step.
    // If we are on localhost, the start step (probably) used the Prod URL logic if isDevelopment was true.
    // So we should try to use the Prod URL if we detect we are on localhost OR if the current request is coming to Prod.
    // However, the code to exchange the token needs the Redirect URI.
    // If we are running on Prod, baseUrl is Prod. If on Localhost, baseUrl is Localhost.

    const isDevelopment = !process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost');
    const redirectUri = isDevelopment ? prodCallbackUrl : devCallbackUrl;

    // Force fix: The safest bet is to check which one works or use the one configured.
    // But since the start route logic is tied to "isDevelopment", we stick to that.

    console.log('[OAuth Callback] Exchanging token', { redirectUri, brandProfileId });

    const clientId = process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID!;

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', clientId);
    tokenUrl.searchParams.append('redirect_uri', redirectUri);
    tokenUrl.searchParams.append('client_secret', clientSecret);
    tokenUrl.searchParams.append('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenJson: any = await tokenRes.json();

    if (tokenJson.error) {
      console.error('Facebook token error:', tokenJson.error);
      return NextResponse.redirect(`${baseUrl}/settings?error=facebook_token_failed&details=${encodeURIComponent(tokenJson.error.message)}&tab=social`);
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
      return NextResponse.redirect(`${baseUrl}/settings?error=facebook_profile_failed&tab=social`);
    }

    // Fetch user's pages
    const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
    pagesUrl.searchParams.append('access_token', accessToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson: any = await pagesRes.json();

    // Store connection via connections API
    // Use storedAccessToken (user session) if available in state, otherwise rely on x-demo-user with userId
    const connectionsResponse = await fetch(`${baseUrl}/api/social/connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': storedAccessToken ? `Bearer ${storedAccessToken}` : '',
        'x-demo-user': userId
      },
      body: JSON.stringify({
        platform: 'facebook',
        socialId: profileJson.id,
        brandProfileId, // Pass the brand context
        accessToken,
        profile: profileJson,
        pages: pagesJson.data || [],
      }),
    });

    if (!connectionsResponse.ok) {
      const errorText = await connectionsResponse.text();
      console.error('Failed to store Facebook connection:', errorText);
      return NextResponse.redirect(`${baseUrl}/settings?error=connection_save_failed&tab=social`);
    }

    console.log('[OAuth Callback] Connection successful');

    // Redirect back to Settings page with success message
    const redirectUrl = `${baseUrl}/settings?oauth_success=true&platform=facebook&username=${encodeURIComponent(profileJson.name)}&tab=social`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    return NextResponse.redirect(`${baseUrl}/settings?error=facebook_callback_failed&tab=social`);
  }
}
