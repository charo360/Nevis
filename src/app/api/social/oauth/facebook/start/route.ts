import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Encryption helper
function encrypt(text: string, secret: string) {
  try {
    const iv = crypto.randomBytes(16);
    // Ensure secret is 32 bytes for aes-256-cbc
    const key = crypto.createHash('sha256').update(secret).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    throw err;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authHeader = req.headers.get('authorization') || '';

  // Get user ID from Bearer token or query param
  let userId: string | null = null;
  let accessToken: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    accessToken = authHeader.split(' ')[1];
    userId = url.searchParams.get('userId') || 'user_' + Date.now();
  } else {
    // Fallback for demo/development
    userId = url.searchParams.get('userId') || 'demo';
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // IMPORTANT: Fix for Localhost vs Production Callback
    // If we are on localhost, we SHOULD ideally use localhost callback.
    // However, keeping the original logic's preference pattern but ensuring it works.
    const isDevelopment = !process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL.includes('localhost');
    const prodCallbackUrl = 'https://crevo.app/api/social/oauth/facebook/callback';
    const devCallbackUrl = `${baseUrl}/api/social/oauth/facebook/callback`;

    // NOTE: Using the Dev callback URL if strictly in dev might require the user to whitelist it in FB.
    // Sticking to the previous logic of preferring Prod URL to minimize regression risk if that's what is whitelisted.
    const callbackUrl = isDevelopment ? prodCallbackUrl : devCallbackUrl;

    const brandProfileId = url.searchParams.get('brandProfileId');

    console.log('[OAuth Start] Initiating Facebook connection', { userId, brandProfileId, callbackUrl, isDevelopment });

    // Generate state data
    const stateData = {
      userId,
      brandProfileId,
      nonce: crypto.randomBytes(8).toString('hex'),
      timestamp: Date.now(),
      // We can include accessToken if needed, but for security/size lets rely on userId
      // and the callback re-authenticating or using the userId header.
      accessToken // Including it just in case, hope it's not too huge.
    };

    // Encrypt state using FB Client Secret (shared secret)
    const clientSecret = process.env.FACEBOOK_APP_SECRET || process.env.FACEBOOK_SECRET_KEY || process.env.FACEBOOK_CLIENT_SECRET!;
    if (!clientSecret) {
      throw new Error('Missing FACEBOOK_APP_SECRET');
    }

    const state = encrypt(JSON.stringify(stateData), clientSecret);
    console.log('[OAuth Start] Generated stateless state');

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
    return NextResponse.redirect(`${baseUrl}/social-connect?error=facebook_oauth_failed&details=${encodeURIComponent(String(error))}`);
  }
}
