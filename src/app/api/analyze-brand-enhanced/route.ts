import { NextRequest, NextResponse } from 'next/server';
import { analyzeEnhancedBrand, type EnhancedBrandAnalysisInput } from '@/ai/flows/enhanced-brand-analysis';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Enhanced Brand Analysis API called');
    
    const body = await request.json();
    const { websiteUrl, analysisType = 'basic', designImageUris = [], websiteContent, options = {} } = body;

    // Validate required fields
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate analysis type
    if (!['basic', 'comprehensive'].includes(analysisType)) {
      return NextResponse.json(
        { error: 'Analysis type must be either "basic" or "comprehensive"' },
        { status: 400 }
      );
    }

    console.log(`📊 Starting ${analysisType} analysis for: ${websiteUrl}`);

    // Prepare input for enhanced brand analysis
    const input: EnhancedBrandAnalysisInput = {
      websiteUrl,
      analysisType,
      designImageUris,
      websiteContent,
      options: {
        includeSocialMedia: options.includeSocialMedia ?? true,
        includeVisualAnalysis: options.includeVisualAnalysis ?? true,
        maxPages: options.maxPages || 25,
        maxImages: options.maxImages || 30
      }
    };

    // Perform enhanced brand analysis
    const result = await analyzeEnhancedBrand(input);

    console.log(`✅ Enhanced brand analysis completed successfully`);
    console.log(`📊 Analysis type: ${result.metadata.analysisType}`);
    console.log(`⏱️ Duration: ${Math.round(result.metadata.duration / 1000)}s`);
    console.log(`📈 Status: ${result.metadata.status}`);

    if (result.comprehensive) {
      console.log(`🎯 Brand Strength: ${result.comprehensive.insights.brandStrength}/100`);
      console.log(`🌐 Digital Presence: ${result.comprehensive.insights.digitalPresence}/100`);
      console.log(`📝 Content Quality: ${result.comprehensive.insights.contentQuality}/100`);
      console.log(`🎨 Visual Consistency: ${result.comprehensive.insights.visualConsistency}/100`);
    }

    // Return the complete analysis result
    return NextResponse.json({
      success: true,
      data: result,
      message: `${analysisType} brand analysis completed successfully`
    });

  } catch (error) {
    console.error('❌ Enhanced brand analysis failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Brand analysis failed',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation/health check
export async function GET() {
  return NextResponse.json({
    name: 'Enhanced Brand Analysis API',
    version: '1.0.0',
    description: 'Comprehensive brand intelligence analysis with basic and advanced options',
    endpoints: {
      POST: {
        description: 'Analyze a brand using basic or comprehensive analysis',
        parameters: {
          websiteUrl: 'string (required) - The website URL to analyze',
          analysisType: 'string (optional) - "basic" or "comprehensive" (default: "basic")',
          designImageUris: 'string[] (optional) - Array of design image data URIs',
          websiteContent: 'string (optional) - Pre-scraped website content',
          options: {
            includeSocialMedia: 'boolean (optional) - Include social media analysis (default: true)',
            includeVisualAnalysis: 'boolean (optional) - Include visual analysis (default: true)',
            maxPages: 'number (optional) - Maximum pages to scrape (default: 25)',
            maxImages: 'number (optional) - Maximum images to analyze (default: 30)'
          }
        },
        response: {
          success: 'boolean',
          data: {
            basic: 'BrandAnalysisResult - Basic analysis results',
            comprehensive: 'ComprehensiveBrandIntelligence - Advanced analysis (if requested)',
            metadata: 'AnalysisMetadata - Analysis information and performance metrics'
          }
        }
      }
    },
    features: {
      basic: [
        'Website content analysis',
        'Brand personality extraction',
        'Visual style analysis',
        'Business information extraction',
        'OpenRouter AI analysis'
      ],
      comprehensive: [
        'Multi-page website scraping',
        'Social media discovery and analysis',
        'Brand DNA extraction with NLP',
        'Visual identity analysis',
        'Competitive positioning',
        'Content strategy recommendations',
        'Marketing insights',
        'Brand strength scoring'
      ]
    },
    examples: {
      basicAnalysis: {
        websiteUrl: 'https://example.com',
        analysisType: 'basic'
      },
      comprehensiveAnalysis: {
        websiteUrl: 'https://example.com',
        analysisType: 'comprehensive',
        options: {
          includeSocialMedia: true,
          includeVisualAnalysis: true,
          maxPages: 30,
          maxImages: 50
        }
      }
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
}
