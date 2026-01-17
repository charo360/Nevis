/**
 * API Route: Mixpost Webhook Handler
 * POST /api/mixpost/webhook
 * 
 * Receives webhook events from Mixpost for post status updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, processWebhook, MixpostWebhookPayload } from '@/lib/mixpost';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-mixpost-signature') || '';
    const webhookSecret = process.env.MIXPOST_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret) {
      const verification = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!verification.valid) {
        console.error('❌ [Webhook] Invalid signature:', verification.error);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload: MixpostWebhookPayload = JSON.parse(rawBody);

    console.log(`🔔 [Webhook] Received event: ${payload.event}`);

    // Process the webhook
    await processWebhook(payload);

    return NextResponse.json({
      success: true,
      event: payload.event,
      processed: true,
    });

  } catch (error) {
    console.error('❌ [Webhook] Processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Mixpost may send a GET request to verify the webhook endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({
    status: 'active',
    endpoint: '/api/mixpost/webhook',
    events: ['post.published', 'post.failed', 'post.scheduled', 'analytics.updated'],
  });
}
