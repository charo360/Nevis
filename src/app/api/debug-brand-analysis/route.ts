import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      passed: 0,
      failed: 0,
      errors: []
    }
  };

  try {
    const { websiteUrl = 'https://stripe.com' } = await request.json();
    
    console.log('🔍 Starting Brand Analysis Diagnostics...');
    console.log(`🌐 Testing URL: ${websiteUrl}`);

    // Test 1: Environment Variables
    console.log('\n📋 Test 1: Environment Variables');
    try {
      const envTest = {
        openRouterKey: !!process.env.OPENROUTER_API_KEY,
        openRouterKeyLength: process.env.OPENROUTER_API_KEY?.length || 0,
        geminiKey: !!process.env.GEMINI_API_KEY,
        anthropicKey: !!process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3001'
      };
      
      diagnostics.tests.environment = {
        status: 'passed',
        data: envTest,
        message: 'Environment variables loaded'
      };
      diagnostics.summary.passed++;
      console.log('✅ Environment variables test passed');
      
    } catch (error) {
      diagnostics.tests.environment = {
        status: 'failed',
        error: error.message,
        message: 'Environment variables test failed'
      };
      diagnostics.summary.failed++;
      diagnostics.summary.errors.push(`Environment: ${error.message}`);
      console.log('❌ Environment variables test failed:', error.message);
    }

    // Test 2: Website Scraping
    console.log('\n📋 Test 2: Website Scraping');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3001';

      const scrapeResponse = await fetch(`${baseUrl}/api/scrape-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const scrapeResult = await scrapeResponse.json();
      
      if (scrapeResult.success && scrapeResult.data?.content) {
        diagnostics.tests.scraping = {
          status: 'passed',
          data: {
            contentLength: scrapeResult.data.content.length,
            phoneNumbers: scrapeResult.data.phoneNumbers?.length || 0,
            emailAddresses: scrapeResult.data.emailAddresses?.length || 0,
            competitiveAdvantages: scrapeResult.data.competitiveAdvantages?.length || 0
          },
          message: 'Website scraping successful'
        };
        diagnostics.summary.passed++;
        console.log(`✅ Website scraping test passed - ${scrapeResult.data.content.length} characters`);
      } else {
        throw new Error(`Scraping failed: ${scrapeResult.error || 'No content extracted'}`);
      }
      
    } catch (error) {
      diagnostics.tests.scraping = {
        status: 'failed',
        error: error.message,
        message: 'Website scraping test failed'
      };
      diagnostics.summary.failed++;
      diagnostics.summary.errors.push(`Scraping: ${error.message}`);
      console.log('❌ Website scraping test failed:', error.message);
    }

    // Test 3: OpenRouter API Connectivity
    console.log('\n📋 Test 3: OpenRouter API Connectivity');
    try {
      const { OpenRouterClient } = await import('@/lib/services/openrouter-client');
      const client = new OpenRouterClient();
      
      // Test with a simple prompt
      const testPrompt = 'Respond with exactly: "OpenRouter API is working"';
      const testResult = await client.callOpenRouterAPI('openai/gpt-3.5-turbo', testPrompt);
      
      if (testResult && testResult.includes('working')) {
        diagnostics.tests.openrouter = {
          status: 'passed',
          data: { response: testResult },
          message: 'OpenRouter API connectivity successful'
        };
        diagnostics.summary.passed++;
        console.log('✅ OpenRouter API test passed');
      } else {
        throw new Error(`Unexpected response: ${testResult}`);
      }
      
    } catch (error) {
      diagnostics.tests.openrouter = {
        status: 'failed',
        error: error.message,
        message: 'OpenRouter API connectivity test failed'
      };
      diagnostics.summary.failed++;
      diagnostics.summary.errors.push(`OpenRouter: ${error.message}`);
      console.log('❌ OpenRouter API test failed:', error.message);
    }

    // Test 4: Full Analysis Pipeline
    console.log('\n📋 Test 4: Full Analysis Pipeline');
    try {
      const { analyzeBrand } = await import('@/ai/flows/analyze-brand');
      
      const analysisResult = await analyzeBrand({
        websiteUrl,
        designImageUris: []
      });
      
      // Check if we got real analysis or fallback data
      const isFallbackData = (
        analysisResult.businessName === 'New Business' ||
        analysisResult.description?.includes('This business provides professional services and solutions') ||
        analysisResult.businessType === 'Professional Services'
      );
      
      if (!isFallbackData && analysisResult.businessName && analysisResult.businessName !== 'New Business') {
        diagnostics.tests.fullAnalysis = {
          status: 'passed',
          data: {
            businessName: analysisResult.businessName,
            businessType: analysisResult.businessType,
            descriptionLength: analysisResult.description?.length || 0,
            isFallbackData: false
          },
          message: 'Full analysis pipeline successful - real AI analysis'
        };
        diagnostics.summary.passed++;
        console.log(`✅ Full analysis test passed - Real analysis for: ${analysisResult.businessName}`);
      } else {
        diagnostics.tests.fullAnalysis = {
          status: 'warning',
          data: {
            businessName: analysisResult.businessName,
            businessType: analysisResult.businessType,
            isFallbackData: true
          },
          message: 'Full analysis returned fallback data - this is the problem!'
        };
        diagnostics.summary.errors.push('Analysis: Returning fallback data instead of real analysis');
        console.log('⚠️ Full analysis test returned fallback data - this is the issue!');
      }
      
    } catch (error) {
      diagnostics.tests.fullAnalysis = {
        status: 'failed',
        error: error.message,
        message: 'Full analysis pipeline test failed'
      };
      diagnostics.summary.failed++;
      diagnostics.summary.errors.push(`Full Analysis: ${error.message}`);
      console.log('❌ Full analysis test failed:', error.message);
    }

    // Test 5: Direct OpenRouter Website Analysis
    console.log('\n📋 Test 5: Direct OpenRouter Website Analysis');
    try {
      const { OpenRouterClient } = await import('@/lib/services/openrouter-client');
      const client = new OpenRouterClient();
      
      // Get some content to analyze
      const testContent = `
        Stripe is a technology company that builds economic infrastructure for the internet. 
        Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.
        We help companies accept payments, send payouts, and manage their businesses online.
      `;
      
      const analysisResult = await client.analyzeWebsite(testContent, websiteUrl, []);
      
      if (analysisResult && typeof analysisResult === 'object' && analysisResult.businessName) {
        diagnostics.tests.directOpenRouter = {
          status: 'passed',
          data: {
            businessName: analysisResult.businessName,
            businessType: analysisResult.businessType,
            hasRealData: analysisResult.businessName !== 'New Business'
          },
          message: 'Direct OpenRouter analysis successful'
        };
        diagnostics.summary.passed++;
        console.log(`✅ Direct OpenRouter test passed - ${analysisResult.businessName}`);
      } else {
        throw new Error('Invalid or empty response from OpenRouter analysis');
      }
      
    } catch (error) {
      diagnostics.tests.directOpenRouter = {
        status: 'failed',
        error: error.message,
        message: 'Direct OpenRouter analysis test failed'
      };
      diagnostics.summary.failed++;
      diagnostics.summary.errors.push(`Direct OpenRouter: ${error.message}`);
      console.log('❌ Direct OpenRouter test failed:', error.message);
    }

    // Generate summary
    const totalTests = Object.keys(diagnostics.tests).length;
    diagnostics.summary.total = totalTests;
    diagnostics.summary.successRate = Math.round((diagnostics.summary.passed / totalTests) * 100);

    console.log('\n📊 Diagnostic Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${diagnostics.summary.passed}`);
    console.log(`   Failed: ${diagnostics.summary.failed}`);
    console.log(`   Success Rate: ${diagnostics.summary.successRate}%`);
    
    if (diagnostics.summary.errors.length > 0) {
      console.log('   Errors:');
      diagnostics.summary.errors.forEach(error => console.log(`     - ${error}`));
    }

    return NextResponse.json({
      success: true,
      diagnostics,
      recommendation: diagnostics.summary.errors.length > 0 
        ? 'Issues found - check the errors above to fix the fallback data problem'
        : 'All tests passed - brand analysis should be working correctly'
    });

  } catch (error) {
    console.error('❌ Diagnostic test suite failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      diagnostics,
      recommendation: 'Diagnostic suite failed - check server logs for details'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'Brand Analysis Diagnostics',
    description: 'Comprehensive diagnostic tests for brand analysis pipeline',
    usage: 'POST with optional websiteUrl to test the analysis pipeline',
    tests: [
      'Environment Variables',
      'Website Scraping',
      'OpenRouter API Connectivity', 
      'Full Analysis Pipeline',
      'Direct OpenRouter Analysis'
    ]
  });
}
