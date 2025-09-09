import fs from 'fs/promises';
import path from 'path';

const LOCAL_STORE = path.resolve(process.cwd(), 'tmp', 'social-connections.json');

async function readLocalStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) { return {}; }
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function resolveIgUserId(accessToken: string): Promise<string> {
  // Try to use stored profile first (if present)
  try {
    const me = await fetchJson(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
    // me.id is FB user id; need to find pages and then instagram_business_account
    const pages = await fetchJson(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`);
    const page = (pages.data || []).find((p: any) => p.instagram_business_account?.id);
    if (page && page.instagram_business_account?.id) {
      return page.instagram_business_account.id;
    }
    throw new Error('No Instagram business account found');
  } catch (e) {
    throw new Error('IG business account not linked to Facebook Page');
  }
}

export async function postInstagramForUser(userId: string, text: string, imageUrl?: string) {
  if (!userId) throw new Error('No user');
  if (!text || !text.trim()) throw new Error('Missing text');
  if (!imageUrl || !imageUrl.trim()) throw new Error('Instagram requires image');

  const key = `${userId}_instagram`;
  const local = await readLocalStore();
  const conn = local[key];
  if (!conn || !conn.accessToken) throw new Error('Instagram not connected');
  const accessToken = conn.accessToken as string;

  // Resolve IG User ID via Facebook Graph (requires a linked page)
  const igUserId = conn.profile?.igUserId || await resolveIgUserId(accessToken);

  // Step 1: Create media container
  const createUrl = new URL(`https://graph.facebook.com/v19.0/${igUserId}/media`);
  createUrl.searchParams.set('image_url', imageUrl);
  createUrl.searchParams.set('caption', text.trim());
  createUrl.searchParams.set('access_token', accessToken);
  const createRes = await fetch(createUrl.toString(), { method: 'POST' });
  if (!createRes.ok) throw new Error(`IG media create failed: ${createRes.status}`);
  const createData = await createRes.json();
  const creationId = createData.id;

  // Step 2: Publish media
  const publishUrl = new URL(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`);
  publishUrl.searchParams.set('creation_id', creationId);
  publishUrl.searchParams.set('access_token', accessToken);
  const publishRes = await fetch(publishUrl.toString(), { method: 'POST' });
  if (!publishRes.ok) throw new Error(`IG publish failed: ${publishRes.status}`);
  const publishData = await publishRes.json();
  return { id: publishData.id };
}

