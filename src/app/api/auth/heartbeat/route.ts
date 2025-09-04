import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getDatabase } from '@/lib/mongodb/config';

export async function GET() {
  // Simple health check that doesn't require authentication
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasMongoDatabase: !!process.env.DATABASE,
      hasJwtSecret: !!process.env.JWT_SECRET,
      databaseConnected: await checkDatabaseConnection()
    }
  });
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const userId = decoded.userId;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    // Update user's session info in MongoDB (best-effort)
    try {
      const { userService } = await import('@/lib/mongodb/database');
      const user = await userService.findOne({ userId });
      const existing = user || {};

      const session = {
        lastActive: now.toISOString(),
        sessionStartedAt: (existing && (existing as any).session && (existing as any).session.sessionStartedAt) ? (existing as any).session.sessionStartedAt : now.toISOString(),
        sessionExpiresAt: expiresAt.toISOString(),
      };

      if (user) {
        await userService.updateById(user._id!.toString(), { session });
      }
    } catch (e) {
      // Ignore session update errors
    }

    return NextResponse.json({ ok: true, lastActive: now.toISOString(), sessionExpiresAt: expiresAt.toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
