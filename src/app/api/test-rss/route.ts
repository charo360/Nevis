import { NextRequest, NextResponse } from 'next/server';
import { testRSSFeeds } from '@/ai/utils/rss-feeds-integration';

/**
 * API route to test RSS feeds integration
 * This helps debug why RSS data might not be working in Revo 2.0
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || 'Kenya';
    const businessType = searchParams.get('businessType') || 'restaurant';


    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];

    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    // Test RSS feeds
    await testRSSFeeds(location, businessType);

    // Restore console.log
    console.log = originalLog;

    return NextResponse.json({
      success: true,
      message: 'RSS feeds test completed',
      location,
      businessType,
      logs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
