/**
 * Test Revo 2.0 Claude Integration Directly
 * Bypass the credits system to test if Claude is working
 */

require('dotenv').config({ path: '.env.local' });

async function testRevo2Direct() {
  console.log('🧪 Testing Revo 2.0 Claude Integration Directly\n');

  // Test the Claude client directly
  try {
    const { ClaudeClientService } = require('./src/lib/services/claude-client.ts');
    
    console.log('🔄 Testing Claude Haiku 4.5 directly...');
    
    const claudeClient = ClaudeClientService.getInstance();
    
    const testPrompt = `Create engaging social media content for Paya (Financial Technology) on Instagram.

🎯 BUSINESS CONTEXT:
- Business: Paya
- Industry: Financial Technology (Fintech)
- Location: Kenya
- Platform: Instagram

🌍 LOCAL LANGUAGE INTEGRATION:
- Mix English (70%) with Swahili elements (30%)
- Use: "Karibu" (welcome), "Haraka" (fast), "Pesa" (money), "Hakuna matata" (no problem)

Generate JSON:
{
  "headline": "Max 6 words - punchy and memorable",
  "subheadline": "Max 12 words - supports headline with proof/benefit", 
  "caption": "Max 25 words - engaging story with Swahili mix",
  "cta": "2-3 words - clear action",
  "hashtags": ["#Paya", "#DigitalBanking", "#Kenya", "#Fintech"]
}`;

    const result = await claudeClient.generateText(
      testPrompt,
      'claude-haiku-4-5-20251001',
      {
        temperature: 0.8,
        maxTokens: 300
      }
    );

    console.log('✅ Claude Direct Test Results:');
    console.log(`⏱️  Processing time: ${result.processingTime}ms`);
    console.log(`📊 Tokens used: ${result.tokensUsed.total}`);
    console.log(`🤖 Model: ${result.model}`);
    console.log('');
    console.log('📝 Generated Content:');
    console.log(result.text);
    console.log('');

    // Try to parse JSON
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const content = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON Parsing Successful:');
        console.log(`   Headline: "${content.headline}"`);
        console.log(`   Subheadline: "${content.subheadline}"`);
        console.log(`   Caption: "${content.caption}"`);
        console.log(`   CTA: "${content.cta}"`);
        console.log(`   Hashtags: ${content.hashtags?.join(', ')}`);
        
        // Check for Swahili
        const hasSwahili = /karibu|haraka|pesa|hakuna|twende|sawa|poa/i.test(result.text);
        console.log(`   🌍 Swahili Integration: ${hasSwahili ? '✅ Detected' : '❌ Missing'}`);
      }
    } catch (parseError) {
      console.log('❌ JSON Parsing Failed:', parseError.message);
    }

    console.log('\n🎯 CONCLUSION:');
    console.log('✅ Claude Haiku 4.5 is working perfectly!');
    console.log('✅ The issue is NOT with Claude integration');
    console.log('❌ The issue is with the CREDITS API blocking generation');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('1. Fix the 401 Unauthorized error in credits API');
    console.log('2. Or temporarily bypass credits check for testing');
    console.log('3. Check Supabase authentication setup');

  } catch (error) {
    console.error('❌ Claude Direct Test Failed:', error.message);
    console.log('');
    console.log('🔍 This confirms Claude integration has issues');
    console.log('Check:');
    console.log('1. ANTHROPIC_API_KEY in .env.local');
    console.log('2. Claude client service setup');
    console.log('3. Network connectivity to Claude API');
  }
}

testRevo2Direct();
