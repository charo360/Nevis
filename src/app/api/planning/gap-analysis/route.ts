/**
 * Planning API - Gap Analysis
 * Endpoint for analyzing content gaps and getting recommendations
 * Part of Layer 2: Planning Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentGaps, formatGapAnalysisForAssistant } from '@/lib/planning/gapAnalysis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');
    const platforms = searchParams.get('platforms');
    const lookbackDays = searchParams.get('lookbackDays');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Planning API] Analyzing content gaps for brand ${brandProfileId}`);

    const analysis = await analyzeContentGaps(brandProfileId, {
      platforms: platforms ? platforms.split(',') : ['instagram'],
      lookbackDays: lookbackDays ? parseInt(lookbackDays) : 30,
    });

    const formatted = formatGapAnalysisForAssistant(analysis);

    return NextResponse.json({
      success: true,
      data: {
        gaps: analysis.gaps,
        recommendations: analysis.recommendations,
        pillarBalance: analysis.pillarBalance,
        platformBalance: analysis.platformBalance,
        contentSuggestion: analysis.contentSuggestion,
        formattedForAssistant: formatted,
      },
    });
  } catch (error) {
    console.error('❌ [Planning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content gaps', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandProfileId,
      platforms = ['instagram'],
      lookbackDays = 30,
    } = body;

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [Planning API] Analyzing content gaps for brand ${brandProfileId}`);

    const analysis = await analyzeContentGaps(brandProfileId, {
      platforms,
      lookbackDays,
    });

    const formatted = formatGapAnalysisForAssistant(analysis);

    return NextResponse.json({
      success: true,
      data: {
        gaps: analysis.gaps,
        recommendations: analysis.recommendations,
        pillarBalance: analysis.pillarBalance,
        platformBalance: analysis.platformBalance,
        contentSuggestion: analysis.contentSuggestion,
        formattedForAssistant: formatted,
      },
    });
  } catch (error) {
    console.error('❌ [Planning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content gaps', details: String(error) },
      { status: 500 }
    );
  }
}
