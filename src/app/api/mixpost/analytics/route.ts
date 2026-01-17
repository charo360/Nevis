/**
 * API Route: Mixpost Analytics
 * GET /api/mixpost/analytics
 * 
 * Fetches post performance analytics from Mixpost
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMixpostClient } from '@/lib/mixpost';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const postId = searchParams.get('postId');
    const days = parseInt(searchParams.get('days') || '30');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const client = getMixpostClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'Mixpost is not configured',
          analytics: null,
        },
        { status: 503 }
      );
    }

    // Get workspace ID from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabase
      .from('brand_profiles')
      .select('mixpost_workspace_id')
      .eq('id', clientId)
      .single();

    if (!profile?.mixpost_workspace_id) {
      return NextResponse.json({
        connected: false,
        analytics: null,
        message: 'No Mixpost workspace connected',
      });
    }

    const workspaceId = profile.mixpost_workspace_id;

    // If specific post requested
    if (postId) {
      const postAnalytics = await client.getPostAnalytics(workspaceId, postId);
      return NextResponse.json({
        connected: true,
        type: 'post',
        postId,
        analytics: postAnalytics,
      });
    }

    // Get overall analytics
    const analytics = await client.getAnalytics(workspaceId, days);

    // Also get local performance insights
    const { data: insights } = await supabase
      .from('performance_insights')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    // Calculate summary metrics
    const summary = calculateSummaryMetrics(analytics);

    return NextResponse.json({
      connected: true,
      type: 'overview',
      period: `${days} days`,
      summary,
      analytics,
      insights: insights || null,
    });

  } catch (error) {
    console.error('❌ [API] Analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Sync analytics from Mixpost (called by cron job)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, secret } = body;

    // Verify cron secret for security
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = getMixpostClient();

    if (!client.isConfigured()) {
      return NextResponse.json(
        { error: 'Mixpost is not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // If specific client, sync just that one
    if (clientId) {
      const { data: profile } = await supabase
        .from('brand_profiles')
        .select('mixpost_workspace_id')
        .eq('id', clientId)
        .single();

      if (profile?.mixpost_workspace_id) {
        await client.syncAnalytics(profile.mixpost_workspace_id);
        return NextResponse.json({
          success: true,
          synced: 1,
          message: `Analytics synced for client ${clientId}`,
        });
      }
    }

    // Sync all connected workspaces
    const { data: profiles } = await supabase
      .from('brand_profiles')
      .select('id, mixpost_workspace_id')
      .not('mixpost_workspace_id', 'is', null);

    let synced = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      try {
        await client.syncAnalytics(profile.mixpost_workspace_id);
        synced++;
      } catch (error) {
        errors.push(`${profile.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      total: profiles?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('❌ [API] Sync analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to sync analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate summary metrics from analytics data
 */
function calculateSummaryMetrics(analytics: any[]): {
  totalImpressions: number;
  totalEngagement: number;
  averageEngagementRate: number;
  topPerformingDay: string | null;
  topPerformingHour: number | null;
} {
  if (!analytics || analytics.length === 0) {
    return {
      totalImpressions: 0,
      totalEngagement: 0,
      averageEngagementRate: 0,
      topPerformingDay: null,
      topPerformingHour: null,
    };
  }

  let totalImpressions = 0;
  let totalEngagement = 0;

  for (const item of analytics) {
    totalImpressions += item.impressions || 0;
    totalEngagement += (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
  }

  const averageEngagementRate = totalImpressions > 0
    ? (totalEngagement / totalImpressions) * 100
    : 0;

  return {
    totalImpressions,
    totalEngagement,
    averageEngagementRate: Math.round(averageEngagementRate * 100) / 100,
    topPerformingDay: null, // TODO: Calculate from detailed data
    topPerformingHour: null, // TODO: Calculate from detailed data
  };
}
