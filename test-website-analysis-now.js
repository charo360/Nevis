/**
 * Test website analysis with Claude 4.5 Haiku
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testWebsiteAnalysis() {
  console.log('🧪 Testing Website Analysis with Claude 4.5 Haiku...\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Simulate what the API does
  const testUrl = 'https://example.com';
  const testHtml = `
    <html>
      <head>
        <title>Example Business - Quality Services</title>
        <meta name="description" content="We provide quality services to businesses worldwide">
      </head>
      <body>
        <h1>Example Business</h1>
        <p>We offer professional consulting services</p>
        <p>Contact: info@example.com | +1-555-0123</p>
      </body>
    </html>
  `;

  const prompt = `Analyze this website and extract business information.

Website URL: ${testUrl}

HTML Content:
${testHtml}

Extract and return ONLY a JSON object with this structure:
{
  "businessName": "string",
  "description": "string",
  "businessType": "string",
  "services": "string",
  "contactInfo": {
    "email": "string",
    "phone": "string"
  }
}

JSON Response:`;

  try {
    console.log('📤 Sending request to Claude 4.5 Haiku...\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('✅ SUCCESS! Claude responded!\n');
    console.log('📝 Raw Response:');
    console.log(message.content[0].text);
    console.log('');
    console.log('📊 Token usage:');
    console.log('   - Input tokens:', message.usage.input_tokens);
    console.log('   - Output tokens:', message.usage.output_tokens);
    console.log('   - Total tokens:', message.usage.input_tokens + message.usage.output_tokens);
    console.log('');

    // Try to parse JSON
    try {
      let cleanText = message.content[0].text.trim();
      if (cleanText.includes('```json')) {
        cleanText = cleanText.split('```json')[1].split('```')[0].trim();
      } else if (cleanText.includes('```')) {
        cleanText = cleanText.split('```')[1].split('```')[0].trim();
      }
      
      const parsed = JSON.parse(cleanText);
      console.log('✅ Successfully parsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('');
      console.log('🎉 Website analysis is WORKING!');
      
    } catch (parseError) {
      console.log('⚠️ Could not parse as JSON, but Claude responded successfully');
      console.log('Parse error:', parseError.message);
    }

  } catch (error) {
    console.error('❌ FAILED! Website analysis is NOT working!\n');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.error) {
      console.error('API Error:', JSON.stringify(error.error, null, 2));
    }
  }
}

testWebsiteAnalysis();

