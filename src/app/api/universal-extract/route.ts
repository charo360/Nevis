/**
 * Universal Website Extraction API Route
 * Works with ANY website - automatically detects structure and extracts everything
 */

import { NextRequest, NextResponse } from 'next/server';
import { UniversalWebsiteExtractor } from '@/lib/services/universal-website-extractor';

export async function POST(request: NextRequest) {
  try {
    const { url, format = 'both', smart = false } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🌐 Starting universal extraction for: ${url}`);
    console.log(`📊 Format: ${format}, Smart: ${smart}`);

    const extractor = new UniversalWebsiteExtractor(apiKey);
    let result;

    if (smart) {
      // Smart extraction - finds and extracts from multiple pages
      result = await extractor.smartExtract(url);
      
      return NextResponse.json({
        success: true,
        type: 'smart_extraction',
        data: result,
        metadata: {
          url,
          extraction_type: 'smart_multi_page',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Standard extraction from single page
      result = await extractor.extractEverything(url, format as any);
      
      return NextResponse.json({
        success: true,
        type: 'standard_extraction',
        data: result,
        metadata: {
          url,
          extraction_type: 'single_page',
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Universal extraction error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to extract from website: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'formatted';

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Convert GET to POST request
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ url, format })
  }));
}
