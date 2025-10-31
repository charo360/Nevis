/**
 * Claude Speed Comparison Test
 * Compare performance of different Claude models
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function compareClaudeModels() {
  console.log('⚡ Claude Speed Comparison Test\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test prompt (same as Revo 2.0 uses)
  const testPrompt = `Create engaging social media content for Paya (Financial Technology) on Instagram.

🎯 BUSINESS CONTEXT:
- Business: Paya
- Industry: Financial Technology (Fintech)
- Location: Kenya
- Platform: Instagram

Generate a JSON response with:
{
  "headline": "6 words max - punchy and memorable",
  "subheadline": "12 words max - supports headline",
  "caption": "25 words max - engaging story",
  "cta": "2-3 words - clear action",
  "hashtags": ["#Paya", "#DigitalBanking", "#Kenya"]
}`;

  // Models to test (from fastest to most powerful)
  const modelsToTest = [
    { name: 'Claude 3 Haiku', id: 'claude-3-haiku-20240307', description: 'Fastest & cheapest' },
    { name: 'Claude 3 Opus', id: 'claude-3-opus-20240229', description: 'Most powerful & slowest' }
  ];

  console.log('🧪 Testing models with identical Revo 2.0 content generation...\n');

  for (const model of modelsToTest) {
    try {
      console.log(`⚡ Testing: ${model.name} (${model.description})`);
      
      const startTime = Date.now();
      
      const message = await anthropic.messages.create({
        model: model.id,
        max_tokens: 200,
        temperature: 0.8,
        messages: [{ role: 'user', content: testPrompt }]
      });

      const processingTime = Date.now() - startTime;
      const response = message.content[0].text;
      
      console.log(`   ⏱️  Speed: ${processingTime}ms`);
      console.log(`   📊 Tokens: ${message.usage.input_tokens + message.usage.output_tokens}`);
      console.log(`   💰 Cost: ~$${((message.usage.input_tokens * 0.015 + message.usage.output_tokens * 0.075) / 1000).toFixed(4)}`);
      
      // Try to parse JSON response
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]);
          console.log(`   📝 Sample: "${content.headline}" | "${content.cta}"`);
        }
      } catch (e) {
        console.log(`   📝 Sample: "${response.substring(0, 50)}..."`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('');
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎯 Speed Recommendations:');
  console.log('');
  console.log('🚀 **For Production (Recommended): Claude 3 Haiku**');
  console.log('   - 3-5x faster than Opus');
  console.log('   - 20x cheaper than Opus');
  console.log('   - Still excellent quality for social media content');
  console.log('   - Perfect for high-volume generation');
  console.log('');
  console.log('🎨 **For Premium Content: Claude 3 Opus**');
  console.log('   - Highest quality and creativity');
  console.log('   - Best for complex, nuanced content');
  console.log('   - Use for special campaigns or when quality > speed');
  console.log('');
  console.log('💡 **Hybrid Approach**: Use Haiku for regular content, Opus for premium');
}

compareClaudeModels();
