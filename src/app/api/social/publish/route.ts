/**
 * Social Publish API
 * Publish content directly to connected social accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { publishToSocial } from '@/lib/social';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandProfileId,
      platform,
      message,
      imageUrl,
      scheduledTime,
    } = body;

    if (!brandProfileId || !platform || !message) {
      return NextResponse.json(
        { error: 'brandProfileId, platform, and message are required' },
        { status: 400 }
      );
    }

    console.log(`📤 [Social API] Publishing to ${platform} for brand ${brandProfileId}`);

    const result = await publishToSocial(brandProfileId, platform, {
      message,
      imageUrl,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        postId: result.postId,
        permalink: result.permalink,
        platform,
      },
    });
  } catch (error) {
    console.error('❌ [Social API] Error publishing:', error);
    return NextResponse.json(
      { error: 'Failed to publish', details: String(error) },
      { status: 500 }
    );
  }
}
