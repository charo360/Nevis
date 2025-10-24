/**
 * Debug Website Analysis Issues
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testWebsiteAnalysisDetailed() {
  console.log('🔍 Testing Website Analysis in Detail...');
  
  try {
    console.log('📡 Making request to /api/analyze-brand...');
    
    const response = await axios.post(`${BASE_URL}/api/analyze-brand`, {
      websiteUrl: 'https://example.com',
      designImageUris: []
    }, {
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ Response received:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Website Analysis: SUCCESS');
      console.log(`   Business Name: ${response.data.data.businessName}`);
      console.log(`   Business Type: ${response.data.data.businessType}`);
      console.log(`   Industry: ${response.data.data.industry}`);
      console.log(`   Target Audience: ${response.data.data.targetAudience}`);
      console.log(`   Value Proposition: ${response.data.data.valueProposition}`);
      console.log(`   Model Used: ${response.data.data._metadata?.analyzedBy}`);
      console.log(`   Analysis Source: ${response.data.data._metadata?.source}`);
      return true;
    } else {
      console.log('\n❌ Website Analysis: FAILED');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('\n❌ Website Analysis: ERROR');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Response Data: ${JSON.stringify(error.response?.data, null, 2)}`);
    
    // Check specific error types
    if (error.code === 'ECONNREFUSED') {
      console.log('   🔧 Issue: Server not running on port 3001');
    } else if (error.response?.status === 404) {
      console.log('   🔧 Issue: API endpoint not found');
    } else if (error.response?.status === 500) {
      console.log('   🔧 Issue: Server error - check logs');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   🔧 Issue: DNS resolution failed');
    }
    
    return false;
  }
}

async function testOpenRouterDirectly() {
  console.log('\n🌐 Testing OpenRouter API Directly...');
  
  try {
    const apiKey = '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';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://nevis-ai.com',
        'X-Title': 'Nevis AI - Test'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: 'Analyze this website content and return JSON: "Example Domain - This domain is for use in illustrative examples in documents." Provide business analysis in JSON format with businessName, businessType, description fields.'
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ OpenRouter Direct API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ OpenRouter Direct API Success');
    console.log('📊 Response:', data.choices[0].message.content.substring(0, 200) + '...');
    return true;
    
  } catch (error) {
    console.log('❌ OpenRouter Direct API Error:', error.message);
    return false;
  }
}

async function testScrapingEndpoint() {
  console.log('\n📄 Testing Website Scraping Endpoint...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/scrape-website`, {
      url: 'https://example.com'
    });

    if (response.data.success !== false) {
      console.log('✅ Website Scraping: SUCCESS');
      console.log(`   Content Length: ${response.data.content?.length || 0} characters`);
      console.log(`   Content Preview: ${response.data.content?.substring(0, 100)}...`);
      return true;
    } else {
      console.log('❌ Website Scraping: FAILED');
      console.log(`   Error: ${response.data.error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Website Scraping: ERROR');
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function runDebugTests() {
  console.log('🔧 DEBUGGING WEBSITE ANALYSIS');
  console.log('=' .repeat(50));

  const results = {
    scraping: await testScrapingEndpoint(),
    openRouterDirect: await testOpenRouterDirectly(),
    websiteAnalysis: await testWebsiteAnalysisDetailed()
  };

  console.log('\n📊 DEBUG RESULTS:');
  console.log('=' .repeat(50));
  console.log(`Website Scraping:        ${results.scraping ? '✅ Working' : '❌ Broken'}`);
  console.log(`OpenRouter Direct API:   ${results.openRouterDirect ? '✅ Working' : '❌ Broken'}`);
  console.log(`Website Analysis Flow:   ${results.websiteAnalysis ? '✅ Working' : '❌ Broken'}`);

  console.log('\n🔧 DIAGNOSIS:');
  if (!results.scraping) {
    console.log('❌ Issue: Website scraping is failing');
    console.log('   - Check if /api/scrape-website endpoint exists');
    console.log('   - Check if Cheerio/scraping dependencies are working');
  }
  
  if (!results.openRouterDirect) {
    console.log('❌ Issue: OpenRouter API is not responding');
    console.log('   - Check OPENROUTER_API_KEY configuration');
    console.log('   - Check internet connectivity');
  }
  
  if (!results.websiteAnalysis) {
    console.log('❌ Issue: Website analysis flow is broken');
    console.log('   - Check /api/analyze-brand endpoint');
    console.log('   - Check OpenRouter client integration');
  }

  if (results.scraping && results.openRouterDirect && !results.websiteAnalysis) {
    console.log('⚠️  Components work individually but not together');
    console.log('   - Check integration between scraping and analysis');
    console.log('   - Check error handling in the analysis flow');
  }
}

// Run debug tests
runDebugTests().catch(console.error);
