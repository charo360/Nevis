/**
 * Debug Website Analysis Issue
 * Simple test to check what's happening with website analysis
 */

console.log('🔍 Debugging Website Analysis Issue...\n');

async function debugWebsiteAnalysis() {
  console.log('🧪 Testing Website Analysis...');
  console.log('');
  
  // Test the server action API endpoint
  console.log('📡 Testing server action API endpoint...');
  try {
    const response = await fetch('http://localhost:3001/api/test-analyze-brand-action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        websiteUrl: 'https://paya.co.ke',
        designImageUris: []
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server action test - SUCCESS');
      console.log('📊 Result:', {
        success: data.success,
        error: data.error,
        errorType: data.errorType,
        hasData: !!data.data,
        businessName: data.data?.businessName,
        businessType: data.data?.businessType,
        descriptionLength: data.data?.description?.length || 0
      });
      
      if (data.data?.description) {
        console.log('📝 Description preview:', data.data.description.substring(0, 200) + '...');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ Server action test - FAILED:', response.status);
      console.log('📊 Error:', errorData);
    }
  } catch (error) {
    console.log('❌ Server action test - ERROR:', error.message);
  }
  
  console.log('');
  console.log('🔍 What to Check:');
  console.log('1. Check the server terminal for error messages');
  console.log('2. Look for OpenRouter API key issues');
  console.log('3. Check if website scraping is working');
  console.log('4. Verify AI analysis is completing');
  console.log('');
  
  console.log('🎯 Expected Server Logs:');
  console.log('- "🎯 Testing analyzeBrandAction server action..."');
  console.log('- "🌐 Starting website analysis for: https://paya.co.ke"');
  console.log('- "📄 Scraped content length: [number] characters"');
  console.log('- "🔍 Starting direct OpenRouter brand analysis..."');
  console.log('- "✅ analyzeBrandAction completed"');
  console.log('');
  
  console.log('🚨 Error Messages to Watch For:');
  console.log('- "❌ Website scraping failed:"');
  console.log('- "❌ Website analysis failed:"');
  console.log('- "❌ Direct OpenRouter brand analysis failed:"');
  console.log('- "All OpenRouter models failed"');
  console.log('');
  
  console.log('📋 Next Steps:');
  console.log('1. Run this test and watch the server terminal');
  console.log('2. Report back what error messages you see');
  console.log('3. Check if OPENROUTER_API_KEY is set in .env.local');
}

// Run the test
debugWebsiteAnalysis().catch(console.error);
