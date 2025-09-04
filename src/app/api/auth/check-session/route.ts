import { NextResponse } from 'next/server';
import { verifyToken, getUserFromToken } from '@/lib/auth/jwt';
import { userService } from '@/lib/mongodb/database';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const userId = decoded.userId;

    try {
      const user = await userService.findOne({ userId });
      if (!user) return NextResponse.json({ ok: false, reason: 'no-user' });

      const session = (user as any).session || null;

      if (!session) return NextResponse.json({ ok: false, reason: 'no-session' });

      const now = new Date();
      const lastActive = session.lastActive ? new Date(session.lastActive) : null;
      const sessionExpiresAt = session.sessionExpiresAt ? new Date(session.sessionExpiresAt) : null;

      // Inactivity rule: 30 minutes = logout
      const inactivityLimitMs = 30 * 60 * 1000;
      if (lastActive && now.getTime() - lastActive.getTime() > inactivityLimitMs) {
        // mark session inactive
        await userService.updateById(user._id!.toString(), { session: { active: false } });
        return NextResponse.json({ ok: false, reason: 'inactive' });
      }

      // Max session duration rule: 12 hours
      if (sessionExpiresAt && now > sessionExpiresAt) {
        await userService.updateById(user._id!.toString(), { session: { active: false } });
        return NextResponse.json({ ok: false, reason: 'expired' });
      }

      return NextResponse.json({ ok: true, lastActive: session.lastActive, sessionExpiresAt: session.sessionExpiresAt });
    } catch (e: any) {
      // Detect MongoDB connection errors
      const msg = String(e?.message || e);
      if (msg.includes('connection') || msg.includes('timeout')) {
        return NextResponse.json({ ok: false, reason: 'database_error', hint: 'Check MongoDB connection and credentials.' }, { status: 503 });
      }
      return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
