import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeEncryptToken } from '@/lib/encryption';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SOCIAL CONNECTIONS API
// Manages social_tokens table for Brand Profiles

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const authHeader = req.headers.get('authorization') || '';
    let userId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      userId = user.id;
    } else if (req.headers.get('x-demo-user')) {
      userId = req.headers.get('x-demo-user');
    }

    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2. Parse Body
    const body = await req.json();
    const { platform, socialId, accessToken, refreshToken, expiresAt, profile, brandProfileId } = body;

    console.log('[Connections API] POST Request:', { platform, socialId, brandProfileId });

    if (!platform || !socialId || !accessToken || !brandProfileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Encrypt Tokens
    const encryptedAccessToken = safeEncryptToken(accessToken);
    const encryptedRefreshToken = refreshToken ? safeEncryptToken(refreshToken) : null;

    // 4. Upsert into social_tokens
    // Uses brand_profile_id + platform + account_id unique constraint
    const { data, error } = await supabase
      .from('social_tokens')
      .upsert({
        brand_profile_id: brandProfileId,
        platform,
        account_id: socialId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt || null,
        token_type: 'bearer',
        metadata: profile || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'brand_profile_id, platform, account_id'
      })
      .select();

    if (error) {
      console.error('[Connections API] Database error:', error);
      // Fallback: Attempt to save to social_connections if social_tokens fails (legacy support?)
      // No, let's Stick to the new schema. 
      // If error is "relation does not exist", user needs migration.
      return NextResponse.json({ error: 'Failed to save connection. Database schema schema might be outdated.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data[0] });

  } catch (error: any) {
    console.error('[Connections API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const brandProfileId = url.searchParams.get('brandProfileId');

    console.log('[Connections API] GET Request:', { brandProfileId });

    if (!brandProfileId) {
      return NextResponse.json({ error: 'Brand Profile ID required' }, { status: 400 });
    }

    // Retrieve tokens for this brand
    const { data: connections, error } = await supabase
      .from('social_tokens')
      .select('*')
      .eq('brand_profile_id', brandProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Connections API] Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Map to UI format
    const formattedConnections = connections?.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      socialId: conn.account_id,
      profile: conn.metadata,
      createdAt: conn.created_at,
      updatedAt: conn.updated_at,
    })) || [];

    return NextResponse.json({ connections: formattedConnections });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');
    const brandProfileId = url.searchParams.get('brandProfileId');
    const accountId = url.searchParams.get('accountId'); // Optional specific account? 
    // Wait, ConnectAccountsCard passes: DELETE /api/social/connections?platform=${platform}
    // But now we need brandProfileId too.

    if (!platform || !brandProfileId) {
      return NextResponse.json({ error: 'Missing platform or brandProfileId' }, { status: 400 });
    }

    let query = supabase
      .from('social_tokens')
      .delete()
      .eq('brand_profile_id', brandProfileId)
      .eq('platform', platform);

    // If accountId is provided (for multi-account support per platform), use it
    // But UI currently just disconnects "platform".

    const { error } = await query;

    if (error) {
      console.error('[Connections API] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
