import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs/promises';
import path from 'path';

const LOCAL_STORE = path.resolve(process.cwd(), 'tmp', 'social-connections.json');

async function readLocalStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeLocalStore(data: Record<string, any>) {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE), { recursive: true });
    await fs.writeFile(LOCAL_STORE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
  }
}

function getTwitterClientCredentials() {
  const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY;
  if (!clientId || !clientSecret) {
    throw new Error('Twitter client credentials missing (set TWITTER_CLIENT_ID/TWITTER_CLIENT_SECRET)');
  }
  return { clientId, clientSecret } as const;
}

export async function POST(req: Request) {
  try {
    const incomingAuthHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (incomingAuthHeader.startsWith('Bearer ')) {
      const idToken = incomingAuthHeader.split(' ')[1];
      const decoded = verifyToken(idToken);
      userId = decoded?.userId || null;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { text, imageUrl } = body as { text?: string; imageUrl?: string };
    if (!text || !text.trim()) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    // Load stored connection
    const local = await readLocalStore();
    const key = `${userId}_twitter`;
    const conn = local[key];
    if (!conn || !conn.accessToken) {
      return NextResponse.json({ error: 'Twitter account not connected' }, { status: 400 });
    }

    let accessToken: string = conn.accessToken;
    let refreshToken: string | null = conn.accessTokenSecret || null; // stored as accessTokenSecret for historical reasons

    async function postTweetWithClient(client: TwitterApi) {
      if (imageUrl && imageUrl.trim()) {
        // Fetch image and upload as media
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mediaId = await client.v1.uploadMedia(buffer, { mimeType: res.headers.get('content-type') || 'image/png' });
        const result = await client.v2.tweet({ text: text.trim(), media: { media_ids: [mediaId] } as any });
        return result.data;
      } else {
        const result = await client.v2.tweet(text.trim());
        return result.data;
      }
    }

    // Try to post with current token
    let client = new TwitterApi(accessToken);
    try {
      const data = await postTweetWithClient(client);
      return NextResponse.json({ success: true, tweet: data });
    } catch (e: any) {
      // If unauthorized and we have a refresh token, try to refresh
      const isAuthError = e?.code === 401 || /Unauthorized|expired|invalid/i.test(String(e?.message || ''));
      if (!isAuthError || !refreshToken) {
        console.error('Twitter post failed (no refresh possible):', e?.message || e);
        return NextResponse.json({ error: 'Failed to post to Twitter' }, { status: 500 });
      }
    }

    // Refresh flow
    try {
      const { clientId, clientSecret } = getTwitterClientCredentials();
      const appClient = new TwitterApi({ clientId, clientSecret });
      const { client: refreshedClient, accessToken: newAccessToken, refreshToken: newRefreshToken } = await appClient.refreshOAuth2Token(refreshToken!);

      // Persist new tokens
      local[key] = {
        ...conn,
        accessToken: newAccessToken,
        accessTokenSecret: newRefreshToken || conn.accessTokenSecret || null,
        updatedAt: new Date().toISOString(),
      };
      await writeLocalStore(local);

      // Post again
      const postRes = await postTweetWithClient(refreshedClient);
      return NextResponse.json({ success: true, tweet: postRes, refreshed: true });
    } catch (err) {
      console.error('Twitter refresh/post failed:', (err as any)?.message || err);
      return NextResponse.json({ error: 'Failed to post to Twitter (refresh failed)' }, { status: 500 });
    }
  } catch (err) {
    console.error('Twitter post endpoint error:', (err as any)?.message || err);
    return NextResponse.json({ error: 'Failed to post to Twitter' }, { status: 500 });
  }
}
