import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { verifyToken } from '@/lib/auth/jwt';
import { postFacebookForUser } from '@/lib/social/facebook';

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

    const result = await postFacebookForUser(userId, text, imageUrl);
    return NextResponse.json({ success: true, post: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

