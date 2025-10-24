/**
 * API endpoint for website analysis using direct OpenRouter integration
 * Tests the new OpenRouter client without proxy dependencies
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, designImageUris = [] } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: 'Website URL is required' },
        { status: 400 }
      );
    }

    console.log('🌐 Starting website analysis for:', websiteUrl);

    // Step 1: Scrape website content
    let websiteContent = '';
    try {
      const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/scrape-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl })
      });

      if (!scrapeResponse.ok) {
        throw new Error(`Scraping failed: ${scrapeResponse.status}`);
      }

      const scrapeData = await scrapeResponse.json();
      websiteContent = scrapeData.data?.content || scrapeData.content || '';
      console.log(`📄 Scraped content length: ${websiteContent.length} characters`);

      if (!websiteContent || websiteContent.length < 10) {
        return NextResponse.json(
          { success: false, error: 'No content could be extracted from the website' },
          { status: 422 }
        );
      }
    } catch (scrapeError) {
      console.error('❌ Website scraping failed:', scrapeError);
      return NextResponse.json(
        { success: false, error: 'Failed to scrape website content' },
        { status: 500 }
      );
    }

    // Step 2: Analyze with proper data mapping
    try {
      const { analyzeBrand } = await import('@/ai/flows/analyze-brand');

      const analysisResult = await analyzeBrand({
        websiteUrl,
        designImageUris
      });

      console.log('✅ Website analysis completed successfully');

      return NextResponse.json({
        success: true,
        data: analysisResult,
        metadata: {
          websiteUrl,
          contentLength: websiteContent.length,
          designImagesCount: designImageUris.length,
          analyzedAt: new Date().toISOString()
        }
      });

    } catch (analysisError) {
      console.error('❌ Website analysis failed:', analysisError);
      return NextResponse.json(
        {
          success: false,
          error: analysisError instanceof Error ? analysisError.message : 'Analysis failed'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ API endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Website Analysis API',
    description: 'POST to this endpoint with websiteUrl to analyze a website using OpenRouter',
    usage: {
      method: 'POST',
      body: {
        websiteUrl: 'https://example.com',
        designImageUris: ['optional array of image URLs']
      }
    },
    status: 'ready',
    provider: 'OpenRouter (direct)',
    models: ['anthropic/claude-3-haiku', 'openai/gpt-4o-mini', 'openai/gpt-3.5-turbo']
  });
}
