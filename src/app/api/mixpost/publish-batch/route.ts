/**
 * API Route: Publish Batch to Mixpost
 * POST /api/mixpost/publish-batch
 * 
 * Sends generated Revo 2.0 posts to Mixpost for scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMixpostClient, getOptimalSchedule } from '@/lib/mixpost';
import { createClient } from '@supabase/supabase-js';

interface PostToPublish {
  content: string;
  caption?: string;
  headline?: string;
  subheadline?: string;
  imageUrl: string;
  platform: string;
  hashtags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clientId, 
      posts, 
      accountIds, 
      startDate, 
      distributionStrategy = 'optimal',
      industry,
    } = body as {
      clientId: string;
      posts: PostToPublish[];
      accountIds?: string[];
      startDate?: string;
      distributionStrategy?: 'even' | 'optimal' | 'custom';
      industry?: string;
    };

    // Validate required fields
    if (!clientId || !posts || posts.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and posts array are required' },
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
      .select('mixpost_workspace_id, business_type')
      .eq('id', clientId)
      .single();

    if (!profile?.mixpost_workspace_id) {
      return NextResponse.json(
        { 
          error: 'No Mixpost workspace connected',
          message: 'Please connect Mixpost first using /api/mixpost/create-workspace',
        },
        { status: 400 }
      );
    }

    const workspaceId = profile.mixpost_workspace_id;

    // Get connected accounts if not provided
    let targetAccountIds = accountIds;
    if (!targetAccountIds || targetAccountIds.length === 0) {
      const accounts = await client.getAccounts(workspaceId);
      if (accounts.length === 0) {
        return NextResponse.json(
          { 
            error: 'No social accounts connected',
            message: 'Please connect at least one social account in Mixpost',
          },
          { status: 400 }
        );
      }
      targetAccountIds = accounts.map(a => a.id);
    }

    // Calculate optimal schedule
    const schedule = await getOptimalSchedule(workspaceId, posts.length, {
      industry: industry || profile.business_type || 'default',
      platform: posts[0]?.platform || 'instagram',
      startDate: startDate ? new Date(startDate) : new Date(),
      useAnalytics: distributionStrategy === 'optimal',
    });

    console.log(`📅 [API] Schedule calculated: ${schedule.strategy} (confidence: ${schedule.confidence})`);

    // Format posts for Mixpost
    const formattedPosts = posts.map(post => ({
      content: post.caption || post.content,
      headline: post.headline,
      imageUrl: post.imageUrl,
      platform: post.platform,
      hashtags: post.hashtags,
    }));

    // Publish batch
    const result = await client.publishBatch({
      posts: formattedPosts,
      workspaceId,
      accountIds: targetAccountIds,
      startDate: startDate ? new Date(startDate) : new Date(),
      distributionStrategy,
    });

    // Log results
    console.log(`✅ [API] Batch published: ${result.success.length} success, ${result.failed.length} failed`);

    return NextResponse.json({
      success: true,
      published: result.success.length,
      failed: result.failed.length,
      schedule: {
        strategy: schedule.strategy,
        confidence: schedule.confidence,
        times: schedule.times.map(t => t.toISOString()),
      },
      posts: result.success.map(p => ({
        id: p.id,
        scheduledAt: p.scheduled_at,
        status: p.status,
      })),
      errors: result.failed.map(f => ({
        content: f.post.content.substring(0, 50) + '...',
        error: f.error,
      })),
    });

  } catch (error) {
    console.error('❌ [API] Publish batch error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to publish batch',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
