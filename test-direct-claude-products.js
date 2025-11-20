/**
 * Test Claude directly for product extraction to debug JSON parsing issues
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testClaudeProductExtraction() {
  console.log('🧪 Testing Claude Product Extraction');
  console.log('===================================');
  
  const testUrl = 'https://zentechelectronics.com/';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No ANTHROPIC_API_KEY found');
    return;
  }
  
  try {
    // Step 1: Fetch website content
    console.log('📡 Fetching website content...');
    const response = await fetch(testUrl);
    const html = await response.text();
    
    // Extract basic content
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 'No title';
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);
    
    console.log(`📄 Title: ${title}`);
    console.log(`📝 Content length: ${bodyText.length} chars`);
    
    // Step 2: Simple product extraction prompt
    const prompt = `Analyze this website and extract individual products with their details.

Website: ${testUrl}
Title: ${title}
Content: ${bodyText}

Extract specific products (like iPhone 14 Plus, Samsung Galaxy S23, etc.) with their storage options, prices, and payment plans.

Return JSON in this simple format:
{
  "business_name": "string",
  "business_type": "string",
  "products": [
    {
      "name": "iPhone 14 Plus",
      "variants": [
        {
          "storage": "128GB",
          "price": "KSh 120,000",
          "payment_plan": "Deposit KSh 48,000, Weekly KSh 5,400 for 6 months"
        }
      ]
    }
  ]
}

Focus on extracting ACTUAL individual products with specific model names, storage options, and exact prices.
Return ONLY valid JSON, no explanations.`;

    // Step 3: Call Claude
    console.log('🤖 Calling Claude API...');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ Claude API Error:', errorText);
      return;
    }

    const claudeResult = await claudeResponse.json();
    const responseText = claudeResult.content?.[0]?.text || '';
    
    console.log('📝 Raw Claude Response:');
    console.log('=' .repeat(50));
    console.log(responseText);
    console.log('=' .repeat(50));
    
    // Try to parse JSON
    try {
      let cleanText = responseText.trim();
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }
      
      const parsedData = JSON.parse(cleanText);
      console.log('✅ Successfully parsed JSON:');
      console.log(JSON.stringify(parsedData, null, 2));
      
      // Display products in readable format
      if (parsedData.products && parsedData.products.length > 0) {
        console.log('\n🛍️ Extracted Products:');
        parsedData.products.forEach((product, index) => {
          console.log(`\n${index + 1}. ${product.name}`);
          if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
              console.log(`   ${variant.storage} - ${variant.price}`);
              if (variant.payment_plan) {
                console.log(`   Payment: ${variant.payment_plan}`);
              }
            });
          }
        });
      }
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.log('Raw text that failed to parse:');
      console.log(responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚀 Starting Direct Claude Product Test');
testClaudeProductExtraction().catch(console.error);
