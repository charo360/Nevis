import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple RSS test endpoint called');
    
    // Test basic functionality without external dependencies
    const testData = {
      keywords: ['test', 'simple', 'working'],
      hashtags: ['#test', '#simple', '#working'],
      topics: ['test', 'simple'],
      themes: ['test', 'simple', 'working'],
      articles: [],
      lastUpdated: new Date(),
      hashtagAnalytics: {
        trending: [
          { hashtag: '#test', frequency: 5, momentum: 'rising' as const }
        ],
        byCategory: {
          general: ['#test', '#simple']
        },
        byLocation: {}
      }
    };
    
    console.log('Simple RSS test: Returning test data');
    return NextResponse.json(testData);
    
  } catch (error) {
    console.error('Simple RSS test error:', error);
    return NextResponse.json(
      { error: 'Simple RSS test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
