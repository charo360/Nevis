import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { createClient } from '@supabase/supabase-js';
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

// Create Supabase client for server-side token verification
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Verify Supabase JWT token and extract user ID
async function verifySupabaseToken(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      console.log('❌ Supabase token verification failed:', error?.message);
      return null;
    }
    console.log('✅ Supabase token verified for user:', user.id);
    return user.id;
  } catch (error) {
    console.error('❌ Error verifying Supabase token:', error);
    return null;
  }
}

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
      const token = authHeader.split(' ')[1];

      // First try Supabase token verification
      userId = await verifySupabaseToken(token);

      // If Supabase verification fails, try MongoDB JWT verification
      if (!userId) {
        const decoded = verifyToken(token);
        userId = decoded?.userId || null;
      }

      // Fallback: if token is missing/invalid, allow x-demo-user for development callbacks
      if (!userId && req.headers.get('x-demo-user')) {
        userId = String(req.headers.get('x-demo-user'));
      }
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
      facebook: !!(process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_API_KEY || process.env.FACEBOOK_APP_ID),
      twitter: !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_CLIENT_SECRET),
      instagram: !!(process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID),
      linkedin: !!(process.env.LINKEDIN_CLIENT_ID || process.env.LINKEDIN_CLIENT_SECRET),
    };

    if (!platform || !socialId || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields: platform, socialId, accessToken' }, { status: 400 });
    }

    if (!configuredProviders[platform as keyof typeof configuredProviders]) {
      return NextResponse.json({ error: `Provider not configured: ${platform}` }, { status: 400 });
    }

    const key = `${userId}_${platform}`;
    const now = new Date().toISOString();

    // Store connection in local storage
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
      const token = authHeader.split(' ')[1];
      console.log('🔑 Token present, attempting verification...');

      // First try Supabase token verification
      userId = await verifySupabaseToken(token);

      // If Supabase verification fails, try MongoDB JWT verification
      if (!userId) {
        console.log('🔄 Trying MongoDB JWT verification...');
        const decoded = verifyToken(token);
        userId = decoded?.userId || null;
        console.log('🔓 MongoDB JWT result:', userId);
      }

      // Fall back to demo user if no valid token
      if (!userId && req.headers.get('x-demo-user')) {
        userId = String(req.headers.get('x-demo-user'));
        console.log('🔄 Falling back to x-demo-user:', userId);
      }
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
      console.log('📝 Using x-demo-user directly:', userId);
    }

    console.log('🔍 API: Extracted userId:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configuredProviders = {
      facebook: !!(process.env.FACEBOOK_API_KEY || process.env.FACEBOOK_CLIENT_ID || process.env.NEXT_PUBLIC_FACEBOOK_API_KEY),
      twitter: !!(process.env.TWITTER_API_KEY || process.env.TWITTER_CLIENT_ID || process.env.TWITTER_CLIENT_SECRET),
    };

    // Use local store for social connections
    const local = await readLocalStore();
    const results = Object.values(local).filter((c: any) => c.userId === userId && (configuredProviders as any)[c.platform]);
    return NextResponse.json({ connections: results });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // First try Supabase token verification
      userId = await verifySupabaseToken(token);

      // If Supabase verification fails, try MongoDB JWT verification
      if (!userId) {
        const decoded = verifyToken(token);
        userId = decoded?.userId || null;
      }

      if (!userId && req.headers.get('x-demo-user')) {
        userId = String(req.headers.get('x-demo-user'));
      }
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 });

    const key = `${userId}_${platform}`;

    // Remove from local store
    try {
      const local = await readLocalStore();
      delete local[key];
      await writeLocalStore(local);
    } catch (localErr) {
      return NextResponse.json({ error: String(localErr) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
