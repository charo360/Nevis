import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { postTweetForUser } from '@/lib/social/twitter';

const SCHEDULE_STORE = path.resolve(process.cwd(), 'tmp', 'scheduled-posts.json');

async function readStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(SCHEDULE_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeStore(data: Record<string, any>) {
  await fs.mkdir(path.dirname(SCHEDULE_STORE), { recursive: true });
  await fs.writeFile(SCHEDULE_STORE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function POST(req: Request) {
  try {
    const secret = process.env.SCHEDULE_SECRET || '';
    const incoming = req.headers.get('x-schedule-secret') || '';
    if (secret && incoming !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const store = await readStore();
    const now = Date.now();

    const ids = Object.keys(store);
    const dueIds = ids.filter((id) => {
      const item = store[id];
      if (!item || item.status !== 'scheduled') return false;
      const when = Date.parse(item.scheduledAt);
      return !Number.isNaN(when) && when <= now;
    });

    const results: Array<{ id: string; ok: boolean; error?: string; providerId?: string }> = [];

    for (const id of dueIds) {
      const item = store[id];
      const userId: string = item.userId;
      const platform: string = item.platform;
      const text: string = item.text;
      const imageUrl: string | null = item.imageUrl || null;
      const attempts = (item.attempts || 0) + 1;

      try {
        switch (platform) {
          case 'Twitter': {
            const tweet = await postTweetForUser(userId, text, imageUrl ?? undefined);
            store[id] = {
              ...item,
              status: 'posted',
              postedAt: new Date().toISOString(),
              attempts,
              provider: 'Twitter',
              providerPostId: tweet?.id || null,
              lastError: null,
            };
            results.push({ id, ok: true, providerId: tweet?.id });
            break;
          }
          default: {
            // Leave in scheduled state for other platforms (not yet implemented)
            store[id] = {
              ...item,
              attempts,
              lastError: `Processor for ${platform} not implemented`,
            };
            results.push({ id, ok: false, error: `Processor for ${platform} not implemented` });
            break;
          }
        }
      } catch (err: any) {
        store[id] = {
          ...item,
          status: 'scheduled', // remain scheduled to retry later
          attempts,
          lastError: err?.message || String(err),
        };
        results.push({ id, ok: false, error: err?.message || String(err) });
      }
    }

    if (dueIds.length > 0) {
      await writeStore(store);
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

