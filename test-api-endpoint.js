/**
 * Test the analyze-website-claude API endpoint directly
 */

require('dotenv').config({ path: '.env.local' });

async function testApiEndpoint() {
  console.log('🧪 Testing /api/analyze-website-claude endpoint...\n');

  const testUrl = 'https://example.com';
  const apiUrl = 'http://localhost:3001/api/analyze-website-claude';

  try {
    console.log(`📤 Sending POST request to: ${apiUrl}`);
    console.log(`🌐 Website URL: ${testUrl}\n`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        analysisType: 'services'
      })
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API returned error:');
      console.error(errorText);
      return;
    }

    const result = await response.json();
    
    console.log('\n✅ SUCCESS! API responded with:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\n❌ FAILED! Error calling API:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

testApiEndpoint();
