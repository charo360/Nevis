import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
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

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function hmacSha1(key: string, base: string) {
  return crypto.createHmac('sha1', key).update(base).digest('base64');
}

function buildOAuthHeader(params: Record<string, string>) {
  const header = Object.keys(params)
    .map((k) => `${percentEncode(k)}="${percentEncode(params[k])}"`)
    .join(', ');
  return `OAuth ${header}`;
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
  const state = crypto.randomBytes(12).toString('hex');
  const states = await readStates();
  // Allow demoUser via query param or x-demo-user header
  const url = new URL(req.url);
  const demoUser = String(url.searchParams.get('demoUser') || req.headers.get('x-demo-user') || 'demo');

  // Build request-token call to Twitter (OAuth 1.0a)
  const consumerKey = process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID;
  const consumerSecret = process.env.TWITTER_SECRET_KEY || process.env.TWITTER_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  if (!consumerKey || !consumerSecret) {
    // Nothing configured — persist minimal state and redirect with error
    states[state] = { createdAt: Date.now(), error: 'twitter-not-configured' };
    await writeStates(states);
    return NextResponse.redirect(`${baseUrl}/social-connect?error=twitter_not_configured`);
  }
  // Ensure callback URL is encoded and deterministic
  const callbackUrl = `${baseUrl}/api/social/oauth/twitter/callback`;
  const callbackWithState = `${callbackUrl}?state=${encodeURIComponent(state)}`;

  // OAuth params for request_token
  const oauthParams: Record<string, string> = {
    oauth_callback: callbackUrl,
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };

  // Build signature
  const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  const signature = buildSignature('POST', requestTokenUrl, oauthParams, consumerSecret);
  oauthParams['oauth_signature'] = signature;

  const authHeader = buildOAuthHeader(oauthParams);

  // Call Twitter to obtain request token
  try {
    const res = await fetch(requestTokenUrl, {
      method: 'POST',
      headers: { Authorization: authHeader },
      // include callback as form field if Twitter requires it in body
      body: new URLSearchParams({ oauth_callback: callbackWithState }).toString(),
    });

    const text = await res.text();
    // Twitter responds with form-encoded string
    const parsed = Object.fromEntries(new URLSearchParams(text));
    if (!parsed.oauth_token) {
      states[state] = { createdAt: Date.now(), error: 'request-token-failed', resp: text };
      await writeStates(states);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
    }

  // persist the request token secret for the callback exchange
  // store both by our generated state and by the returned oauth_token so the callback
  // can recover the mapping even if Twitter doesn't echo our state parameter back.
  states[state] = { createdAt: Date.now(), requestToken: parsed.oauth_token };
  states[parsed.oauth_token] = { createdAt: Date.now(), requestTokenSecret: parsed.oauth_token_secret, demoUser, state };
  await writeStates(states);

    // Redirect user to authorize URL
    const authorizeUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${parsed.oauth_token}`;
    return NextResponse.redirect(authorizeUrl);
  } catch (err) {
    states[state] = { createdAt: Date.now(), error: 'request-failed', err: String(err) };
    await writeStates(states);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/social-connect`);
  }
}
