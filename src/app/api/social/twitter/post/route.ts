import { NextResponse } from 'next/server';
import adminApp, { adminAuth, adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';
import fetch from 'node-fetch';

function percentEncode(str: string) {
  return encodeURIComponent(String(str)).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
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

export async function POST(req: Request) {
  try {
    const incomingAuthHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (incomingAuthHeader.startsWith('Bearer ')) {
      const idToken = incomingAuthHeader.split(' ')[1];
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text } = body;
    if (!text || !text.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    // fetch twitter credentials
    let doc: any = null;
    try {
      const ref = await adminDb.doc(`socialConnections/${userId}_twitter`).get();
      if (!ref.exists) return NextResponse.json({ error: 'Twitter not connected' }, { status: 400 });
      doc = ref.data();
    } catch (e) {
      return NextResponse.json({ error: 'Failed to read twitter credentials' }, { status: 500 });
    }

    const accessToken = doc.accessToken;
    const accessTokenSecret = doc.accessTokenSecret;
    const consumerKey = process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID;
    const consumerSecret = process.env.TWITTER_SECRET_KEY || process.env.TWITTER_CLIENT_SECRET;

    if (!accessToken || !accessTokenSecret || !consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Twitter credentials incomplete' }, { status: 500 });
    }

    const tweetUrl = 'https://api.twitter.com/1.1/statuses/update.json';
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: consumerKey,
      oauth_token: accessToken,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      status: text,
    };

    const signature = buildSignature('POST', tweetUrl, oauthParams, consumerSecret, accessTokenSecret);
    oauthParams['oauth_signature'] = signature;

    const oauthHeader = 'OAuth ' + Object.keys(oauthParams)
      .filter((k) => k.startsWith('oauth_'))
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ');

    const form = new URLSearchParams();
    form.append('status', text);

    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        Authorization: oauthHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    const result: any = await res.json();
    if (result && result.errors) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ success: true, tweet: result });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to post to Twitter' }, { status: 500 });
  }
}
