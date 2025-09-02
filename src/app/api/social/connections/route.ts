import { NextResponse } from 'next/server';
import adminApp, { adminAuth, adminDb } from '@/lib/firebase/admin';
import fs from 'fs/promises';
import path from 'path';

// Detect if we have admin/service account credentials available in the environment.
function hasAdminCredentials() {
  return !!(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

const LOCAL_STORE = path.resolve(process.cwd(), 'tmp', 'social-connections.json');

async function readLocalStore(): Promise<Record<string, any>> {
  try {
    const raw = await fs.readFile(LOCAL_STORE, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

async function writeLocalStore(data: Record<string, any>) {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE), { recursive: true });
    await fs.writeFile(LOCAL_STORE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
  }
}

// Simple API to manage social connections for the authenticated user.
// POST: create or update a connection
// GET: list connections for the current user

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } else if (req.headers.get('x-demo-user')) {
      // Allow demo requests in dev when a demo header is present
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const body = await req.json();
  const { platform, socialId, accessToken, accessTokenSecret, refreshToken, expiresAt, profile } = body;

    // Only allow platforms that are configured on the server (prevent fake/manual connects)
    const configuredProviders = {
      facebook: !!(process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_API_KEY),
      twitter: !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY),
      // instagram/linkedin intentionally left out for now
    };

    if (!platform || !socialId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields: platform, socialId, accessToken' }, { status: 400 });
    }

    if (!configuredProviders[platform as keyof typeof configuredProviders]) {
      return NextResponse.json({ error: `Provider not configured: ${platform}` }, { status: 400 });
    }

    const key = `${userId}_${platform}`;
    const now = new Date().toISOString();

    // If we don't have admin creds available, skip admin write and use local fallback
    if (!hasAdminCredentials()) {
      const local = await readLocalStore();
      const keyName = `${userId}_${platform}`;
      local[keyName] = {
        userId,
        platform,
        socialId,
        accessToken,
        // support either accessTokenSecret or older refreshToken field
        accessTokenSecret: accessTokenSecret || refreshToken || null,
        expiresAt: expiresAt || null,
        profile: profile || {},
        createdAt: now,
        updatedAt: now,
      };
      await writeLocalStore(local);
      return NextResponse.json({ ok: true, fallback: true });
    }

    // Debug: log project and collection path
    try {
      const proj = (adminDb as any)._databaseId?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    } catch (e) {}

    const fullPath = `socialConnections/${key}`;
    const docRef = adminDb.doc(fullPath);

    try {
      await docRef.set(
        {
          userId,
          platform,
          socialId,
          accessToken,
          // persist twitter secret under a clear name
          accessTokenSecret: accessTokenSecret || refreshToken || null,
          expiresAt: expiresAt || null,
          profile: profile || {},
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (writeErr) {
      // Fallback to local JSON store for development when admin fails
      try {
        const local = await readLocalStore();
        const keyName = `${userId}_${platform}`;
        local[keyName] = {
          userId,
          platform,
          socialId,
          accessToken,
          refreshToken: refreshToken || null,
          expiresAt: expiresAt || null,
          profile: profile || {},
          createdAt: now,
          updatedAt: now,
        };
        await writeLocalStore(local);
      } catch (localErr) {
        throw writeErr; // rethrow original
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configuredProviders = {
      facebook: !!(process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_API_KEY),
      twitter: !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY),
    };

    // If there are no admin credentials, skip admin read and use local store.
    if (!hasAdminCredentials()) {
      const local = await readLocalStore();
      const results = Object.values(local).filter((c: any) => c.userId === userId && (configuredProviders as any)[c.platform]);
      return NextResponse.json({ connections: results, fallback: true });
    }

    try {
      const snapshot = await adminDb.collection('socialConnections').where('userId', '==', userId).get();
      const results: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = { id: doc.id, ...doc.data() };
        // Only return configured providers
        if (configuredProviders[data.platform as keyof typeof configuredProviders]) {
          results.push(data);
        }
      });

      return NextResponse.json({ connections: results });
    } catch (readErr) {
      try {
        const local = await readLocalStore();
        const results = Object.values(local).filter((c: any) => c.userId === userId && (configuredProviders as any)[c.platform]);
        return NextResponse.json({ connections: results });
      } catch (localErr) {
        const msg = (readErr && (readErr as any).message) || String(readErr);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split(' ')[1];
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 });

    const key = `${userId}_${platform}`;
    const fullPath = `socialConnections/${key}`;

    // If admin creds aren't available, remove from local fallback store
    if (!hasAdminCredentials()) {
      try {
        const local = await readLocalStore();
        delete local[key];
        await writeLocalStore(local);
      } catch (localErr) {
        return NextResponse.json({ error: String(localErr) }, { status: 500 });
      }
    } else {
      try {
        await adminDb.doc(fullPath).delete();
      } catch (err) {
        // remove from local
        try {
          const local = await readLocalStore();
          delete local[key];
          await writeLocalStore(local);
        } catch (localErr) {
          return NextResponse.json({ error: String(err) }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
