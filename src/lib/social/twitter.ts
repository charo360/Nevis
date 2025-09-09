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
  } catch {}
}

function getTwitterClientCredentials() {
  const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_SECRET_KEY;
  if (!clientId || !clientSecret) {
    throw new Error('Twitter client credentials missing (set TWITTER_CLIENT_ID/TWITTER_CLIENT_SECRET)');
  }
  return { clientId, clientSecret } as const;
}

async function postWithClient(client: TwitterApi, text: string, imageUrl?: string) {
  if (imageUrl && imageUrl.trim()) {
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

export async function postTweetForUser(userId: string, text: string, imageUrl?: string) {
  if (!userId) throw new Error('No user');
  if (!text || !text.trim()) throw new Error('Missing text');

  const local = await readLocalStore();
  const key = `${userId}_twitter`;
  const conn = local[key];
  if (!conn || !conn.accessToken) {
    throw new Error('Twitter account not connected');
  }

  let accessToken: string = conn.accessToken;
  let refreshToken: string | null = conn.accessTokenSecret || null; // stored as accessTokenSecret for historical reasons

  // Try to post with current token
  try {
    const client = new TwitterApi(accessToken);
    return await postWithClient(client, text, imageUrl);
  } catch (e: any) {
    const isAuthError = e?.code === 401 || /Unauthorized|expired|invalid/i.test(String(e?.message || ''));
    if (!isAuthError || !refreshToken) {
      throw e;
    }
  }

  // Refresh flow
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
  return await postWithClient(refreshedClient, text, imageUrl);
}

