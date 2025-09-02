/**
 * API endpoint for fetching trending content from RSS feeds
 */

import { NextRequest, NextResponse } from 'next/server';
import { rssService } from '@/services/rss-feed-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as 'social' | 'business' | 'tech' | 'design' | null;
    const format = searchParams.get('format') || 'full';


    if (category) {
      // Get trending keywords for specific category
      const keywords = await rssService.getTrendingKeywordsByCategory(category);
      
      return NextResponse.json({
        success: true,
        data: {
          category,
          keywords,
          count: keywords.length,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // Get all trending data
    const trendingData = await rssService.getTrendingData();

    if (format === 'keywords') {
      // Return only keywords for quick access
      return NextResponse.json({
        success: true,
        data: {
          keywords: trendingData.keywords,
          count: trendingData.keywords.length,
          lastUpdated: trendingData.lastUpdated.toISOString(),
        },
      });
    }

    if (format === 'summary') {
      // Return summary data
      return NextResponse.json({
        success: true,
        data: {
          keywordCount: trendingData.keywords.length,
          topicCount: trendingData.topics.length,
          articleCount: trendingData.articles.length,
          topKeywords: trendingData.keywords.slice(0, 10),
          topTopics: trendingData.topics.slice(0, 5),
          lastUpdated: trendingData.lastUpdated.toISOString(),
        },
      });
    }

    // Return full trending data
    return NextResponse.json({
      success: true,
      data: trendingData,
    });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch trending data',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, category } = body;

    if (action === 'refresh') {
      
      // Force refresh by getting new data
      const trendingData = await rssService.getTrendingData();
      
      return NextResponse.json({
        success: true,
        message: 'Trending data refreshed successfully',
        data: {
          keywordCount: trendingData.keywords.length,
          articleCount: trendingData.articles.length,
          lastUpdated: trendingData.lastUpdated.toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
