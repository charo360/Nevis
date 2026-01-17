/**
 * Learning API - Get Insights
 * Endpoint for fetching learning and performance insights
 * Part of Layer 5: Iteration & Learning Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { gatherLearnings, runFullAnalysis, needsRefresh } from '@/lib/learning';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const refresh = searchParams.get('refresh') === 'true';

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 [Learning API] Getting insights for client ${clientId}`);

    // Check if refresh is needed
    const shouldRefresh = refresh || await needsRefresh(clientId);

    if (shouldRefresh) {
      console.log(`🔄 [Learning API] Running full analysis (refresh needed)`);
      await runFullAnalysis(clientId);
    }

    const insights = await gatherLearnings(clientId);

    return NextResponse.json({
      success: true,
      refreshed: shouldRefresh,
      data: {
        learningInsights: insights.learningInsights,
        performanceInsights: insights.performanceInsights,
        formattedForAssistant: insights.formattedForAssistant,
      },
    });
  } catch (error) {
    console.error('❌ [Learning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get learning insights', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, forceRefresh = false } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    console.log(`🧠 [Learning API] Getting insights for client ${clientId} (POST)`);

    if (forceRefresh) {
      console.log(`🔄 [Learning API] Running full analysis (force refresh)`);
      await runFullAnalysis(clientId);
    }

    const insights = await gatherLearnings(clientId);

    return NextResponse.json({
      success: true,
      refreshed: forceRefresh,
      data: {
        learningInsights: insights.learningInsights,
        performanceInsights: insights.performanceInsights,
        formattedForAssistant: insights.formattedForAssistant,
      },
    });
  } catch (error) {
    console.error('❌ [Learning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get learning insights', details: String(error) },
      { status: 500 }
    );
  }
}
