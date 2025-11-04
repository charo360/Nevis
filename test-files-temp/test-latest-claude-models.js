/**
 * Test Latest Claude Models for Social Media Content
 * Check what's actually available and best for social media
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testLatestClaudeModels() {
  console.log('🔍 Testing Latest Claude Models for Social Media Content\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test all possible Claude model variations
  const modelsToTest = [
    // Latest Claude 3.5 Sonnet variations
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620', 
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet',
    
    // Claude 3.5 Haiku (newer, faster)
    'claude-3-5-haiku-20241022',
    'claude-3-5-haiku-latest',
    'claude-3-5-haiku',
    
    // Claude 3 models (older but working)
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229', 
    'claude-3-haiku-20240307'
  ];

  // Social media content test prompt
  const socialMediaPrompt = `Create a catchy Instagram post for Paya fintech in Kenya.

Generate JSON:
{
  "headline": "Max 6 words - punchy",
  "caption": "Max 25 words - engaging with Swahili mix", 
  "hashtags": ["#Paya", "#Kenya", "#Fintech"]
}`;

  console.log('🧪 Testing models for social media content quality and speed...\n');

  const workingModels = [];

  for (const model of modelsToTest) {
    try {
      console.log(`⚡ Testing: ${model}`);
      
      const startTime = Date.now();
      
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 150,
        temperature: 0.8,
        messages: [{ role: 'user', content: socialMediaPrompt }]
      });

      const processingTime = Date.now() - startTime;
      const response = message.content[0].text;
      const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
      
      // Calculate cost (approximate)
      let cost = 0;
      if (model.includes('3-5-sonnet')) {
        cost = (message.usage.input_tokens * 0.003 + message.usage.output_tokens * 0.015) / 1000;
      } else if (model.includes('3-5-haiku')) {
        cost = (message.usage.input_tokens * 0.00025 + message.usage.output_tokens * 0.00125) / 1000;
      } else if (model.includes('opus')) {
        cost = (message.usage.input_tokens * 0.015 + message.usage.output_tokens * 0.075) / 1000;
      } else if (model.includes('sonnet')) {
        cost = (message.usage.input_tokens * 0.003 + message.usage.output_tokens * 0.015) / 1000;
      } else if (model.includes('haiku')) {
        cost = (message.usage.input_tokens * 0.00025 + message.usage.output_tokens * 0.00125) / 1000;
      }
      
      console.log(`   ✅ Working!`);
      console.log(`   ⏱️  Speed: ${processingTime}ms`);
      console.log(`   📊 Tokens: ${totalTokens}`);
      console.log(`   💰 Cost: ~$${cost.toFixed(5)}`);
      
      // Try to parse and evaluate content quality
      let contentQuality = 'Unknown';
      let hasSwahili = false;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]);
          hasSwahili = /karibu|haraka|pesa|hakuna|twende|sawa|poa/i.test(response.toLowerCase());
          contentQuality = hasSwahili ? 'Excellent (with Swahili)' : 'Good (English only)';
          console.log(`   📝 Sample: "${content.headline}"`);
          console.log(`   🌍 Swahili: ${hasSwahili ? '✅' : '❌'}`);
        }
      } catch (e) {
        console.log(`   📝 Sample: "${response.substring(0, 50)}..."`);
      }
      
      workingModels.push({
        model,
        speed: processingTime,
        cost,
        quality: contentQuality,
        hasSwahili,
        tokens: totalTokens
      });
      
      console.log('');
      
    } catch (error) {
      if (error.message.includes('not_found_error')) {
        console.log(`   ❌ Not available`);
      } else if (error.message.includes('rate_limit')) {
        console.log(`   ⚠️  Rate limited (but exists)`);
      } else {
        console.log(`   ❌ Error: ${error.message.substring(0, 60)}...`);
      }
      console.log('');
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Analyze and recommend best models
  console.log('🎯 ANALYSIS & RECOMMENDATIONS:\n');
  
  if (workingModels.length === 0) {
    console.log('❌ No working models found');
    return;
  }

  // Sort by speed for social media (speed is crucial)
  const bySpeed = [...workingModels].sort((a, b) => a.speed - b.speed);
  
  // Sort by cost efficiency
  const byCost = [...workingModels].sort((a, b) => a.cost - b.cost);
  
  // Sort by quality (Swahili integration)
  const byQuality = [...workingModels].filter(m => m.hasSwahili).sort((a, b) => a.speed - b.speed);

  console.log('🚀 **FASTEST MODELS** (Best for high-volume social media):');
  bySpeed.slice(0, 3).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.model}: ${m.speed}ms, $${m.cost.toFixed(5)}, ${m.quality}`);
  });

  console.log('\n💰 **MOST COST-EFFECTIVE**:');
  byCost.slice(0, 3).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.model}: $${m.cost.toFixed(5)}, ${m.speed}ms, ${m.quality}`);
  });

  console.log('\n🌍 **BEST FOR KENYAN CONTENT** (With Swahili):');
  if (byQuality.length > 0) {
    byQuality.slice(0, 3).forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.model}: ${m.speed}ms, $${m.cost.toFixed(5)}, ${m.quality}`);
    });
  } else {
    console.log('   ⚠️  No models generated Swahili content in this test');
  }

  // Final recommendation
  console.log('\n🎯 **FINAL RECOMMENDATION FOR SOCIAL MEDIA**:');
  
  const fastest = bySpeed[0];
  const cheapest = byCost[0];
  const bestQuality = byQuality[0] || bySpeed[0];

  if (fastest.speed < 2000 && fastest.hasSwahili) {
    console.log(`✅ **${fastest.model}** - Perfect balance of speed, quality, and localization`);
    console.log(`   Speed: ${fastest.speed}ms | Cost: $${fastest.cost.toFixed(5)} | Quality: ${fastest.quality}`);
  } else if (bestQuality && bestQuality.speed < 3000) {
    console.log(`✅ **${bestQuality.model}** - Best quality with acceptable speed`);
    console.log(`   Speed: ${bestQuality.speed}ms | Cost: $${bestQuality.cost.toFixed(5)} | Quality: ${bestQuality.quality}`);
  } else {
    console.log(`✅ **${fastest.model}** - Fastest available (may need Swahili tuning)`);
    console.log(`   Speed: ${fastest.speed}ms | Cost: $${fastest.cost.toFixed(5)} | Quality: ${fastest.quality}`);
  }
}

testLatestClaudeModels();
