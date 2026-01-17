/**
 * Research API - Get Insights
 * Endpoint for fetching combined research insights for content generation
 * Part of Layer 1: Research Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { performResearch } from '@/lib/research';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const location = searchParams.get('location');
    const platform = searchParams.get('platform') || 'instagram';
    const brandName = searchParams.get('brandName');
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📊 [Research API] Getting insights for ${industry}`);

    const research = await performResearch(industry, {
      location: location || undefined,
      platform,
      brandName: brandName || undefined,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      data: {
        trends: research.trends,
        hashtags: research.hashtags,
        events: research.events,
        formattedForAssistant: research.formattedForAssistant,
      },
    });
  } catch (error) {
    console.error('❌ [Research API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get research insights', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      industry,
      location,
      platform = 'instagram',
      brandName,
      forceRefresh = false,
    } = body;

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      );
    }

    console.log(`📊 [Research API] Getting insights for ${industry} (POST)`);

    const research = await performResearch(industry, {
      location,
      platform,
      brandName,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      data: {
        trends: research.trends,
        hashtags: research.hashtags,
        events: research.events,
        formattedForAssistant: research.formattedForAssistant,
      },
    });
  } catch (error) {
    console.error('❌ [Research API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get research insights', details: String(error) },
      { status: 500 }
    );
  }
}
