import { NextResponse } from 'next/server';
import adminApp, { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const idToken = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const uid = decoded.uid;

    try {
      const userRef = adminDb.collection('users').doc(uid);
      const snap = await userRef.get();
      if (!snap.exists) return NextResponse.json({ ok: false, reason: 'no-user' });
      const data = snap.data() as any;
      const session = data.session || null;

      if (!session) return NextResponse.json({ ok: false, reason: 'no-session' });

      const now = new Date();
      const lastActive = session.lastActive ? new Date(session.lastActive) : null;
      const sessionExpiresAt = session.sessionExpiresAt ? new Date(session.sessionExpiresAt) : null;

      // Inactivity rule: 30 minutes = logout
      const inactivityLimitMs = 30 * 60 * 1000;
      if (lastActive && now.getTime() - lastActive.getTime() > inactivityLimitMs) {
        // mark session inactive
        await userRef.set({ session: { active: false } }, { merge: true });
        return NextResponse.json({ ok: false, reason: 'inactive' });
      }

      // Max session duration rule: 12 hours
      if (sessionExpiresAt && now > sessionExpiresAt) {
        await userRef.set({ session: { active: false } }, { merge: true });
        return NextResponse.json({ ok: false, reason: 'expired' });
      }

      return NextResponse.json({ ok: true, lastActive: session.lastActive, sessionExpiresAt: session.sessionExpiresAt });
    } catch (e: any) {
      // Detect Firestore permission errors and return a helpful hint
      const msg = String(e?.message || e);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        return NextResponse.json({ ok: false, reason: 'permission_denied', hint: 'Check Firebase Admin credentials and IAM roles (service account needs Firestore access).' }, { status: 503 });
      }
      return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
