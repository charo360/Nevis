/**
 * API Route: Get Mixpost Calendar
 * GET /api/mixpost/get-calendar
 * 
 * Fetches scheduled posts from Mixpost calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMixpostClient } from '@/lib/mixpost';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = searchParams.get('days') || '30';

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
          posts: [],
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
        posts: [],
        message: 'No Mixpost workspace connected',
      });
    }

    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate 
      ? new Date(endDate) 
      : new Date(start.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

    // Fetch calendar from Mixpost
    const posts = await client.getCalendar(
      profile.mixpost_workspace_id,
      start,
      end
    );

    // Also fetch from local database for additional metadata
    const { data: localPosts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('workspace_id', profile.mixpost_workspace_id)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });

    // Merge Mixpost data with local data
    const mergedPosts = posts.map(post => {
      const localPost = localPosts?.find(lp => lp.mixpost_post_id === post.id);
      return {
        ...post,
        localData: localPost || null,
        headline: localPost?.headline,
        platform: localPost?.platform,
      };
    });

    return NextResponse.json({
      connected: true,
      posts: mergedPosts,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      total: mergedPosts.length,
    });

  } catch (error) {
    console.error('❌ [API] Get calendar error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get calendar',
        message: error instanceof Error ? error.message : 'Unknown error',
        posts: [],
      },
      { status: 500 }
    );
  }
}
