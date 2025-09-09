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

export async function postFacebookForUser(userId: string, text: string, imageUrl?: string) {
  if (!userId) throw new Error('No user');
  if (!text || !text.trim()) throw new Error('Missing text');

  const key = `${userId}_facebook`;
  const local = await readLocalStore();
  const conn = local[key];
  if (!conn || !conn.accessToken) throw new Error('Facebook account not connected');
  const accessToken = conn.accessToken as string;

  // If image is provided, use /me/photos; otherwise /me/feed
  if (imageUrl && imageUrl.trim()) {
    const url = new URL('https://graph.facebook.com/v19.0/me/photos');
    url.searchParams.set('url', imageUrl);
    url.searchParams.set('caption', text.trim());
    url.searchParams.set('access_token', accessToken);
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) throw new Error(`Facebook photo post failed: ${res.status}`);
    const data = await res.json();
    return { id: data.post_id || data.id };
  } else {
    const url = new URL('https://graph.facebook.com/v19.0/me/feed');
    url.searchParams.set('message', text.trim());
    url.searchParams.set('access_token', accessToken);
    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) throw new Error(`Facebook text post failed: ${res.status}`);
    const data = await res.json();
    return { id: data.id };
  }
}

