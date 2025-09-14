// src/app/api/test-analysis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeBrand } from '@/ai/flows/analyze-brand';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    console.log('🔍 Testing analysis for:', url);
    
    // First test the scraping
    const scrapeResponse = await fetch(`${request.nextUrl.origin}/api/scrape-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    const scrapeResult = await scrapeResponse.json();
    console.log('📄 Scraping result:', scrapeResult.success ? 'SUCCESS' : 'FAILED');
    
    if (!scrapeResponse.ok) {
      return NextResponse.json({
        step: 'scraping',
        success: false,
        error: scrapeResult.error,
        errorType: scrapeResult.errorType
      });
    }
    
    // Now test the AI analysis
    console.log('🤖 Starting AI analysis...');
    console.log('📝 Content length:', scrapeResult.content?.length || 0);
    
    try {
      const analysisResult = await analyzeBrand({
        websiteUrl: url,
        designImageUris: [], // Empty for testing
        websiteContent: scrapeResult.content
      });
      
      console.log('✅ AI analysis completed successfully');
      
      return NextResponse.json({
        step: 'analysis',
        success: true,
        scrapeResult: {
          contentLength: scrapeResult.content?.length || 0,
          contentPreview: scrapeResult.content?.substring(0, 200) + '...'
        },
        analysisResult: {
          businessName: analysisResult.businessName,
          description: analysisResult.description?.substring(0, 200) + '...',
          businessType: analysisResult.businessType,
          servicesCount: analysisResult.services?.split('\n').length || 0
        }
      });
      
    } catch (aiError) {
      console.error('❌ AI analysis failed:', aiError);
      
      return NextResponse.json({
        step: 'analysis',
        success: false,
        error: aiError instanceof Error ? aiError.message : 'AI analysis failed',
        scrapeResult: {
          contentLength: scrapeResult.content?.length || 0,
          contentPreview: scrapeResult.content?.substring(0, 200) + '...'
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json({
      step: 'general',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}