import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';

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

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function hmacSha1(key: string, base: string) {
  return crypto.createHmac('sha1', key).update(base).digest('base64');
}

function buildSignature(method: string, url: string, params: Record<string, string>, consumerSecret: string, tokenSecret = '') {
  const encodedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(encodedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return hmacSha1(signingKey, baseString);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const oauth_token = url.searchParams.get('oauth_token');
  const oauth_verifier = url.searchParams.get('oauth_verifier');
  const state = url.searchParams.get('state');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  // Read persisted states and try to recover mapping.
  const states = await readStates();

  // If state is missing (Twitter may not echo our state), try to look up by oauth_token
  let entry: any = null;
  let resolvedState: string | null = state;

  if (!oauth_token || !oauth_verifier) {
    return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_request`);
  }

  if (state && states[state]) {
    entry = states[state];
    resolvedState = state;
  } else if (oauth_token && states[oauth_token]) {
    // recovered entry keyed by the request token returned from Twitter
    entry = states[oauth_token];
    // if that entry pointed to our generated state, use it
    resolvedState = entry.state || null;
  } else {
    return NextResponse.redirect(`${baseUrl}/social-connect?error=invalid_state`);
  }

  const consumerKey = process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID;
  const consumerSecret = process.env.TWITTER_SECRET_KEY || process.env.TWITTER_CLIENT_SECRET;
  if (!consumerKey || !consumerSecret) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  }

  try {
    // Exchange request token + verifier for access token
    const accessUrl = 'https://api.twitter.com/oauth/access_token';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: oauth_token || '',
      oauth_verifier: oauth_verifier || '',
      oauth_version: '1.0',
    };

    const tokenSecret = entry.requestTokenSecret || '';
      oauth_token,
      oauth_verifier,
      state,
      hasConsumerKey: !!consumerKey,
      hasConsumerSecret: !!consumerSecret,
      callbackUrl: `${baseUrl}/api/social/oauth/twitter/callback`,
    });


    const signature = buildSignature('POST', accessUrl, oauthParams, consumerSecret, tokenSecret);
    oauthParams['oauth_signature'] = signature;

    const authHeader = 'OAuth ' + Object.keys(oauthParams)
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ');

    const res = await fetch(accessUrl, { method: 'POST', headers: { Authorization: authHeader } });
    const text = await res.text();
    const parsed = Object.fromEntries(new URLSearchParams(text));

    if (!parsed.oauth_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
    }

    const accessToken = parsed.oauth_token;
    const accessTokenSecret = parsed.oauth_token_secret;
    const userId = parsed.user_id;
    const screenName = parsed.screen_name;

    // Verify credentials to fetch a richer profile using OAuth1.0a signed GET
    const verifyUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true';
    const verifyParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_token: accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_version: '1.0',
    };
    const verifySignature = buildSignature('GET', verifyUrl, verifyParams, consumerSecret, accessTokenSecret);
    verifyParams['oauth_signature'] = verifySignature;

    const verifyAuthHeader = 'OAuth ' + Object.keys(verifyParams)
      .map((k) => `${percentEncode(k)}="${percentEncode(verifyParams[k])}"`)
      .join(', ');

    const profileRes = await fetch(verifyUrl, { headers: { Authorization: verifyAuthHeader } });
    let profileJson: any = {};
    try {
      profileJson = await profileRes.json();
    } catch (e) {
      profileJson = { id_str: userId, screen_name: screenName };
    }

    // Persist connection via connections API (use demoUser from state if present)
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/social/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-user': entry.demoUser },
      body: JSON.stringify({
        platform: 'twitter',
        socialId: userId || profileJson.id_str,
        accessToken: accessToken,
        // clearly label twitter secret
        accessTokenSecret: accessTokenSecret,
        profile: profileJson,
      }),
    });

  // Clean up both mappings where present
  if (resolvedState && states[resolvedState]) delete states[resolvedState];
  if (oauth_token && states[oauth_token]) delete states[oauth_token];
  await writeStates(states);

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  } catch (err) {
      error: err,
      oauth_token,
      oauth_verifier,
      state,
      consumerKey: !!consumerKey,
      consumerSecret: !!consumerSecret,
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect?error=twitter_failed`);
  }
}
