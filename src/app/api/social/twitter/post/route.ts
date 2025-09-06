import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
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
      const decoded = verifyToken(idToken);
      userId = decoded?.userId || null;
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text } = body;
    if (!text || !text.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    // For now, return a placeholder response since Twitter integration is not fully implemented
    return NextResponse.json({
      success: true,
      message: 'Twitter posting is not yet implemented',
      text: text
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to post to Twitter' }, { status: 500 });
  }
}
