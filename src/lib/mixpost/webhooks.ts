/**
 * Mixpost Webhooks Handler
 * Listens for post status updates and analytics from Mixpost
 */

import { createClient } from '@supabase/supabase-js';

export interface MixpostWebhookPayload {
  event: 'post.published' | 'post.failed' | 'post.scheduled' | 'analytics.updated';
  workspace_id: string;
  post_id?: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface WebhookVerification {
  valid: boolean;
  error?: string;
}

/**
 * Verify webhook signature from Mixpost
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): WebhookVerification {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return { valid: isValid };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature verification failed',
    };
  }
}

/**
 * Process incoming webhook from Mixpost
 */
export async function processWebhook(payload: MixpostWebhookPayload): Promise<void> {
  console.log(`🔔 [Webhook] Received ${payload.event} for workspace ${payload.workspace_id}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (payload.event) {
    case 'post.published':
      await handlePostPublished(supabase, payload);
      break;

    case 'post.failed':
      await handlePostFailed(supabase, payload);
      break;

    case 'post.scheduled':
      await handlePostScheduled(supabase, payload);
      break;

    case 'analytics.updated':
      await handleAnalyticsUpdated(supabase, payload);
      break;

    default:
      console.warn(`⚠️ [Webhook] Unknown event type: ${payload.event}`);
  }
}

/**
 * Handle post.published event
 */
async function handlePostPublished(
  supabase: ReturnType<typeof createClient>,
  payload: MixpostWebhookPayload
): Promise<void> {
  console.log(`✅ [Webhook] Post published: ${payload.post_id}`);

  await supabase
    .from('scheduled_posts')
    .update({
      status: 'published',
      published_at: payload.timestamp,
      mixpost_response: payload.data,
    })
    .eq('mixpost_post_id', payload.post_id);

  // Trigger analytics sync after a delay (give platforms time to collect data)
  // This would typically be handled by a background job
  console.log(`📊 [Webhook] Analytics sync scheduled for post ${payload.post_id}`);
}

/**
 * Handle post.failed event
 */
async function handlePostFailed(
  supabase: ReturnType<typeof createClient>,
  payload: MixpostWebhookPayload
): Promise<void> {
  console.error(`❌ [Webhook] Post failed: ${payload.post_id}`);
  console.error(`   Reason: ${payload.data?.error || 'Unknown'}`);

  await supabase
    .from('scheduled_posts')
    .update({
      status: 'failed',
      error_message: payload.data?.error || 'Unknown error',
      failed_at: payload.timestamp,
    })
    .eq('mixpost_post_id', payload.post_id);

  // TODO: Send notification to user about failed post
  // await sendFailureNotification(payload.workspace_id, payload.post_id, payload.data?.error);
}

/**
 * Handle post.scheduled event
 */
async function handlePostScheduled(
  supabase: ReturnType<typeof createClient>,
  payload: MixpostWebhookPayload
): Promise<void> {
  console.log(`📅 [Webhook] Post scheduled: ${payload.post_id}`);

  await supabase
    .from('scheduled_posts')
    .update({
      status: 'scheduled',
      scheduled_at: payload.data?.scheduled_at || payload.timestamp,
    })
    .eq('mixpost_post_id', payload.post_id);
}

/**
 * Handle analytics.updated event
 */
async function handleAnalyticsUpdated(
  supabase: ReturnType<typeof createClient>,
  payload: MixpostWebhookPayload
): Promise<void> {
  console.log(`📊 [Webhook] Analytics updated for post: ${payload.post_id}`);

  const analytics = payload.data?.analytics;
  if (!analytics) {
    console.warn(`⚠️ [Webhook] No analytics data in payload`);
    return;
  }

  await supabase
    .from('scheduled_posts')
    .update({
      analytics: analytics,
      analytics_updated_at: payload.timestamp,
    })
    .eq('mixpost_post_id', payload.post_id);

  // Store in performance insights for learning
  await updatePerformanceInsights(supabase, payload.workspace_id, payload.post_id!, analytics);
}

/**
 * Update performance insights based on analytics
 * This feeds into the Learning Layer (Priority 5)
 */
async function updatePerformanceInsights(
  supabase: ReturnType<typeof createClient>,
  workspaceId: string,
  postId: string,
  analytics: Record<string, any>
): Promise<void> {
  // Get the post details
  const { data: post } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('mixpost_post_id', postId)
    .single();

  if (!post) return;

  // Calculate engagement rate
  const engagementRate = analytics.impressions > 0
    ? ((analytics.likes + analytics.comments + analytics.shares) / analytics.impressions) * 100
    : 0;

  // Determine if this is a high-performing post (top 20%)
  const isHighPerforming = engagementRate > 5; // 5% engagement is generally good

  // Get or create performance insights for this workspace
  const { data: insights } = await supabase
    .from('performance_insights')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (insights) {
    // Update existing insights
    const successfulPatterns = insights.successful_patterns || [];
    const underperformingPatterns = insights.underperforming_patterns || [];

    if (isHighPerforming) {
      successfulPatterns.push({
        post_id: postId,
        content_type: post.content_type,
        platform: post.platform,
        engagement_rate: engagementRate,
        posted_at: post.published_at,
        headline: post.headline,
      });
    } else if (engagementRate < 1) {
      underperformingPatterns.push({
        post_id: postId,
        content_type: post.content_type,
        platform: post.platform,
        engagement_rate: engagementRate,
        posted_at: post.published_at,
      });
    }

    await supabase
      .from('performance_insights')
      .update({
        successful_patterns: successfulPatterns.slice(-50), // Keep last 50
        underperforming_patterns: underperformingPatterns.slice(-50),
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId);
  } else {
    // Create new insights record
    await supabase.from('performance_insights').insert({
      workspace_id: workspaceId,
      successful_patterns: isHighPerforming ? [{
        post_id: postId,
        engagement_rate: engagementRate,
        posted_at: post.published_at,
      }] : [],
      underperforming_patterns: engagementRate < 1 ? [{
        post_id: postId,
        engagement_rate: engagementRate,
        posted_at: post.published_at,
      }] : [],
    });
  }

  console.log(`📈 [Webhook] Performance insights updated for workspace ${workspaceId}`);
}

/**
 * Register webhook endpoint with Mixpost
 */
export async function registerWebhook(
  mixpostBaseUrl: string,
  apiToken: string,
  webhookUrl: string,
  events: MixpostWebhookPayload['event'][]
): Promise<{ success: boolean; webhookId?: string; error?: string }> {
  try {
    const response = await fetch(`${mixpostBaseUrl}/api/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        events,
        secret: process.env.MIXPOST_WEBHOOK_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, webhookId: data.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to register webhook',
    };
  }
}

export default {
  verifyWebhookSignature,
  processWebhook,
  registerWebhook,
};
