import { NextResponse } from 'next/server';
import adminApp, { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET() {
  // Simple health check that doesn't require authentication
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      projectIdPublic: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    }
  });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const idToken = authHeader.split(' ')[1];
    const decoded = await adminAuth.verifyIdToken(idToken).catch(() => null);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const uid = decoded.uid;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    // Update user's session info in Firestore (best-effort)
    try {
      const userRef = adminDb.collection('users').doc(uid);
      const doc = await userRef.get();
      const existing = doc.exists ? doc.data() : {};

      const session = {
        lastActive: now.toISOString(),
        sessionStartedAt: (existing && existing.session && existing.session.sessionStartedAt) ? existing.session.sessionStartedAt : now.toISOString(),
        sessionExpiresAt: expiresAt.toISOString(),
      } as any;

      await userRef.set({ session }, { merge: true });
    } catch (e) {
    }

    return NextResponse.json({ ok: true, lastActive: now.toISOString(), sessionExpiresAt: expiresAt.toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
