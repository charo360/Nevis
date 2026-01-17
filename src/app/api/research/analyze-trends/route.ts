/**
 * Research API - Analyze Trends
 * Endpoint for analyzing industry trends and getting research insights
 * Part of Layer 1: Research Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { researchTrends, formatResearchForAssistant } from '@/lib/research/trendAnalyzer';
import { getHashtagRecommendations } from '@/lib/research/hashtagResearch';
import { getUpcomingEvents, formatEventsForAssistant } from '@/lib/research/seasonalEvents';

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

    console.log(`🔍 [Research API] Analyzing trends for ${industry} in ${location || 'global'}`);

    // Perform trend research
    const trends = await researchTrends(industry, {
      location,
      platform,
      forceRefresh,
    });

    // Get hashtag recommendations
    const hashtags = getHashtagRecommendations(industry, platform, {
      location,
      brandName,
    });

    // Get upcoming events
    const events = getUpcomingEvents({
      location,
      industry,
      daysAhead: 90,
    });

    // Format for AI assistant
    const formattedTrends = formatResearchForAssistant(trends);
    const formattedEvents = formatEventsForAssistant(events);

    return NextResponse.json({
      success: true,
      data: {
        trends,
        hashtags,
        events,
        formatted: {
          trends: formattedTrends,
          events: formattedEvents,
        },
      },
    });
  } catch (error) {
    console.error('❌ [Research API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const location = searchParams.get('location');
    const platform = searchParams.get('platform') || 'instagram';

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check for cached research
    const { data: cached } = await supabase
      .from('trend_research')
      .select('*')
      .eq('industry', industry)
      .eq('platform', platform)
      .gt('expires_at', new Date().toISOString())
      .order('researched_at', { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: {
          trends: cached.trends,
          hashtags: cached.hashtags,
          seasonalEvents: cached.seasonal_events,
          competitorInsights: cached.competitor_insights,
          researchedAt: cached.researched_at,
          expiresAt: cached.expires_at,
        },
      });
    }

    // No cache, perform fresh research
    const trends = await researchTrends(industry, {
      location: location || undefined,
      platform,
      forceRefresh: false,
    });

    return NextResponse.json({
      success: true,
      cached: false,
      data: trends,
    });
  } catch (error) {
    console.error('❌ [Research API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get research data', details: String(error) },
      { status: 500 }
    );
  }
}
