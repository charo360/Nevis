/**
 * Planning API - Generate Calendar
 * Endpoint for generating content calendars
 * Part of Layer 2: Planning Layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContentCalendar, getCalendar } from '@/lib/planning/contentCalendar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brandProfileId,
      weeks = 4,
      industry = 'retail',
      location,
      platforms = ['instagram'],
      postsPerWeek = 7,
    } = body;

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId is required' },
        { status: 400 }
      );
    }

    console.log(`📅 [Planning API] Generating ${weeks}-week calendar for brand ${brandProfileId}`);

    const calendar = await generateContentCalendar(brandProfileId, {
      weeks,
      industry,
      location,
      platforms,
      postsPerWeek,
    });

    return NextResponse.json({
      success: true,
      data: {
        calendar,
        summary: calendar.summary,
      },
    });
  } catch (error) {
    console.error('❌ [Planning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandProfileId = searchParams.get('brandProfileId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    if (!brandProfileId) {
      return NextResponse.json(
        { error: 'brandProfileId query parameter is required' },
        { status: 400 }
      );
    }

    const calendar = await getCalendar(brandProfileId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status ? status.split(',') as any[] : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        slots: calendar,
        count: calendar.length,
      },
    });
  } catch (error) {
    console.error('❌ [Planning API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar', details: String(error) },
      { status: 500 }
    );
  }
}
