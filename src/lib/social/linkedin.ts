import fs from 'fs/promises';
import path from 'path';

const LOCAL_STORE = path.resolve(process.cwd(), 'tmp', 'social-connections.json');

async function readLocalStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) { return {}; }
}

export async function postLinkedInForUser(userId: string, text: string, imageUrl?: string) {
  if (!userId) throw new Error('No user');
  if (!text || !text.trim()) throw new Error('Missing text');

  const key = `${userId}_linkedin`;
  const local = await readLocalStore();
  const conn = local[key];
  if (!conn || !conn.accessToken) throw new Error('LinkedIn not connected');
  const accessToken = conn.accessToken as string;

  // Author URN (member)
  const authorId = conn.profile?.id;
  if (!authorId) throw new Error('Missing LinkedIn profile id');
  const authorUrn = `urn:li:person:${authorId}`;

  // For now: text-only UGC post. Image attachments require asset registration; TODO.
  if (imageUrl) {
    // We do not handle media upload yet; log a friendly message
    // Proceed with text-only post using provided text
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: text.trim() },
        shareMediaCategory: 'NONE',
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`LinkedIn post failed: ${res.status}`);
  const data = await res.json().catch(() => ({}));

  // LinkedIn may return 201 with no body; try to read the id from headers
  const postId = (data as any).id || res.headers.get('x-restli-id') || null;
  return { id: postId };
}

