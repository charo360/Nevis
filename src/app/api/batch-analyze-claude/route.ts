/**
 * Batch Website Analysis API Route using Claude
 * Process multiple websites in sequence with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedWebsiteExtractor, ExtractionResult } from '@/lib/services/claude-website-extractor';

export async function POST(request: NextRequest) {
  try {
    const { urls, analysisType = 'services', maxConcurrent = 3 } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (urls.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 URLs allowed per batch' },
        { status: 400 }
      );
    }

    // Validate all URLs
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: `Invalid URL format: ${url}` },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Starting batch Claude analysis for ${urls.length} URLs`);
    console.log(`📊 Analysis type: ${analysisType}`);

    const extractor = new EnhancedWebsiteExtractor(apiKey);
    
    // Process URLs in batches to respect rate limits
    const results: ExtractionResult[] = [];
    const batchSize = Math.min(maxConcurrent, 3);
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`);
      
      const batchPromises = batch.map(async (url: string): Promise<ExtractionResult> => {
        try {
          let result: ExtractionResult;
          
          switch (analysisType) {
            case 'services':
              result = await extractor.extractServices(url);
              break;
            case 'products':
              result = await extractor.extractProducts(url);
              break;
            case 'competitor':
              result = await extractor.analyzeCompetitor(url);
              break;
            default:
              return {
                success: false,
                data: null,
                error: 'Invalid analysis type',
                url,
                timestamp: Date.now()
              };
          }
          
          return result;
        } catch (error) {
          return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : String(error),
            url,
            timestamp: Date.now()
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`✅ Batch analysis completed: ${successCount} successes, ${failureCount} failures`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: urls.length,
        successful: successCount,
        failed: failureCount,
        analysisType
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Batch Claude analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: `Failed to perform batch analysis: ${errorMessage}`,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}
