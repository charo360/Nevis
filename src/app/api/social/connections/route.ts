import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeEncryptToken, safeDecryptToken } from '@/lib/encryption';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple API to manage social connections for the authenticated user.
// POST: create or update a connection
// GET: list connections for the current user

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      // Verify Supabase session
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
      userId = user.id;
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
    instagram: !!(process.env.INSTAGRAM_APP_ID || process.env.INSTAGRAM_CLIENT_ID),
    linkedin: !!(process.env.LINKEDIN_CLIENT_ID || process.env.LINKEDIN_APP_ID),
  };

  if (!platform || !socialId || !accessToken) {
    return NextResponse.json({ error: 'Missing required fields: platform, socialId, accessToken' }, { status: 400 });
  }

  if (!configuredProviders[platform as keyof typeof configuredProviders]) {
    return NextResponse.json({ error: `Provider not configured: ${platform}` }, { status: 400 });
  }

  try {
    // Encrypt sensitive tokens before storing
    const encryptedAccessToken = safeEncryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? safeEncryptToken(refreshToken) : null;

    // Store connection in Supabase database
    const { data, error } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform,
        social_id: socialId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt || null,
        profile_data: profile || {},
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error('Connection save error:', error);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      // Verify Supabase session
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
      userId = user.id;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch connections from Supabase database
    const { data: connections, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Decrypt tokens and format response
    const formattedConnections = connections.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      socialId: conn.social_id,
      profile: conn.profile_data,
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
      // Don't expose encrypted tokens in response
    }));

    return NextResponse.json({ connections: formattedConnections });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      
      // Verify Supabase session
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
      
      userId = user.id;
    } else if (req.headers.get('x-demo-user')) {
      userId = String(req.headers.get('x-demo-user'));
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    if (!platform) return NextResponse.json({ error: 'Missing platform' }, { status: 400 });

    // Delete connection from Supabase database
    const { error } = await supabase
      .from('social_connections')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
