import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import fs from 'fs/promises';
import path from 'path';
export const runtime = 'nodejs';


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
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      const decoded = verifyToken(idToken);
      userId = decoded?.userId || null;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { platform, text, imageUrl, scheduledAt } = body as {
      platform?: string;
      text?: string;
      imageUrl?: string;
      scheduledAt?: string;
    };

    if (!platform || !text || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields: platform, text, scheduledAt' }, { status: 400 });
    }

    const when = new Date(scheduledAt);
    if (isNaN(when.getTime())) {
      return NextResponse.json({ error: 'Invalid scheduledAt' }, { status: 400 });
    }

    const store = await readStore();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      id,
      userId,
      platform,
      text,
      imageUrl: imageUrl || null,
      scheduledAt: when.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'scheduled' as const,
    };

    store[id] = item;
    await writeStore(store);

    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      const decoded = verifyToken(idToken);
      userId = decoded?.userId || null;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const store = await readStore();
    const items = Object.values(store).filter((i: any) => i.userId === userId);
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

