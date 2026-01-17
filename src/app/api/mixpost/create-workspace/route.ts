/**
 * API Route: Create Mixpost Workspace
 * POST /api/mixpost/create-workspace
 * 
 * Creates a new Mixpost workspace for a client during onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMixpostClient } from '@/lib/mixpost';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, businessName, email } = body;

    // Validate required fields
    if (!clientId || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and businessName are required' },
        { status: 400 }
      );
    }

    const client = getMixpostClient();

    // Check if Mixpost is configured
    if (!client.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'Mixpost is not configured',
          message: 'Please set MIXPOST_BASE_URL and MIXPOST_API_TOKEN environment variables',
          configured: false,
        },
        { status: 503 }
      );
    }

    // Check if workspace already exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingProfile } = await supabase
      .from('brand_profiles')
      .select('mixpost_workspace_id')
      .eq('id', clientId)
      .single();

    if (existingProfile?.mixpost_workspace_id) {
      // Workspace already exists, return it
      const workspace = await client.getWorkspace(existingProfile.mixpost_workspace_id);
      return NextResponse.json({
        success: true,
        workspace,
        message: 'Workspace already exists',
        isNew: false,
      });
    }

    // Create new workspace
    const workspace = await client.createWorkspace({
      clientId,
      businessName,
      email: email || `${clientId}@nevis.ai`,
    });

    return NextResponse.json({
      success: true,
      workspace,
      message: 'Workspace created successfully',
      isNew: true,
    });

  } catch (error) {
    console.error('❌ [API] Create workspace error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create workspace',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabase
      .from('brand_profiles')
      .select('mixpost_workspace_id, mixpost_connected_at')
      .eq('id', clientId)
      .single();

    if (!profile?.mixpost_workspace_id) {
      return NextResponse.json({
        connected: false,
        message: 'No Mixpost workspace connected',
      });
    }

    const client = getMixpostClient();
    
    if (!client.isConfigured()) {
      return NextResponse.json({
        connected: false,
        workspaceId: profile.mixpost_workspace_id,
        message: 'Mixpost is not configured on server',
      });
    }

    try {
      const workspace = await client.getWorkspace(profile.mixpost_workspace_id);
      return NextResponse.json({
        connected: true,
        workspace,
        connectedAt: profile.mixpost_connected_at,
      });
    } catch (error) {
      return NextResponse.json({
        connected: false,
        workspaceId: profile.mixpost_workspace_id,
        message: 'Could not fetch workspace details',
      });
    }

  } catch (error) {
    console.error('❌ [API] Get workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to get workspace status' },
      { status: 500 }
    );
  }
}
