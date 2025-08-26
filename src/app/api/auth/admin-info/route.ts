import { NextResponse } from 'next/server';
import adminApp, { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const proj = (adminApp?.options as any)?.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown';

    // Attempt a lightweight read to check Firestore permissions (limit 1)
    try {
      const snapshot = await adminDb.collection('users').limit(1).get();
      const count = snapshot.size;
      return NextResponse.json({ ok: true, project: proj, usersSampleCount: count });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes('PERMISSION_DENIED') || msg.includes('Missing or insufficient permissions')) {
        return NextResponse.json({ ok: false, reason: 'permission_denied', project: proj, hint: 'Service account missing Firestore permissions or wrong project credentials.' }, { status: 503 });
      }
      return NextResponse.json({ ok: false, reason: 'error', project: proj, message: msg }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, reason: 'init_error', message: String(e?.message || e) }, { status: 500 });
  }
}
