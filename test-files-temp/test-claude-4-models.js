/**
 * Test Current Claude 4 Models (October 2025)
 * Test the actual available Claude 4 family models
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testClaude4Models() {
  console.log('🔍 Testing Current Claude 4 Models (October 2025)\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test actual Claude 4 models based on user correction
  const claude4Models = [
    // Claude 4 Opus models
    'claude-4-opus',
    'claude-opus-4.1',
    'claude-opus-4',
    'claude-4.1-opus',
    
    // Claude 4 Sonnet models (including the "smartest model")
    'claude-sonnet-4.5',
    'claude-4.5-sonnet',
    'claude-sonnet-4',
    'claude-4-sonnet',
    
    // Other potential Claude 4 variations
    'claude-4',
    'claude-4.5',
    'claude-4.1'
  ];

  // Revo 2.0 social media test prompt
  const revo2Prompt = `Create engaging social media content for Paya (Financial Technology) on Instagram.

🎯 BUSINESS CONTEXT:
- Business: Paya
- Industry: Financial Technology (Fintech)
- Location: Kenya
- Platform: Instagram
- Content Approach: Innovation-Showcase

🌍 LOCAL LANGUAGE INTEGRATION FOR KENYA:
- Mix English (70%) with Swahili elements (30%)
- Use: "Karibu" (welcome), "Haraka" (fast), "Pesa" (money), "Hakuna matata" (no problem)

Generate JSON:
{
  "headline": "Max 6 words - punchy and memorable",
  "subheadline": "Max 12 words - supports headline with proof/benefit", 
  "caption": "Max 25 words - engaging story with Swahili mix",
  "cta": "2-3 words - clear action",
  "hashtags": ["#Paya", "#DigitalBanking", "#Kenya", "#Fintech", "#Innovation"]
}`;

  console.log('🧪 Testing Claude 4 models for Revo 2.0 social media generation...\n');

  const workingModels = [];

  for (const model of claude4Models) {
    try {
      console.log(`⚡ Testing: ${model}`);
      
      const startTime = Date.now();
      
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 300,
        temperature: 0.8,
        messages: [{ role: 'user', content: revo2Prompt }]
      });

      const processingTime = Date.now() - startTime;
      const response = message.content[0].text;
      const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
      
      // Estimate cost (will need to check actual Claude 4 pricing)
      const estimatedCost = totalTokens * 0.001; // Placeholder - need real pricing
      
      console.log(`   ✅ CLAUDE 4 MODEL FOUND!`);
      console.log(`   ⏱️  Speed: ${processingTime}ms`);
      console.log(`   📊 Tokens: ${totalTokens}`);
      console.log(`   💰 Est. Cost: ~$${estimatedCost.toFixed(5)}`);
      
      // Analyze content quality
      let contentAnalysis = {
        hasSwahili: false,
        hasJSON: false,
        headline: '',
        creativity: 'Unknown'
      };
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]);
          contentAnalysis.hasJSON = true;
          contentAnalysis.headline = content.headline || '';
          contentAnalysis.hasSwahili = /karibu|haraka|pesa|hakuna|twende|sawa|poa|mambo/i.test(response.toLowerCase());
          
          console.log(`   📝 Headline: "${content.headline}"`);
          console.log(`   📝 Caption: "${content.caption?.substring(0, 40)}..."`);
          console.log(`   🌍 Swahili Integration: ${contentAnalysis.hasSwahili ? '✅ Detected' : '❌ Missing'}`);
          console.log(`   📋 JSON Format: ${contentAnalysis.hasJSON ? '✅ Perfect' : '❌ Failed'}`);
        }
      } catch (e) {
        console.log(`   📝 Sample: "${response.substring(0, 60)}..."`);
        console.log(`   ⚠️  JSON parsing failed`);
      }
      
      workingModels.push({
        model,
        speed: processingTime,
        tokens: totalTokens,
        cost: estimatedCost,
        ...contentAnalysis,
        isClaud4: true
      });
      
      console.log('   🎉 CLAUDE 4 MODEL CONFIRMED!\n');
      
    } catch (error) {
      if (error.message.includes('not_found_error')) {
        console.log(`   ❌ Not available`);
      } else if (error.message.includes('rate_limit')) {
        console.log(`   ⚠️  Rate limited (but model exists!)`);
      } else {
        console.log(`   ❌ Error: ${error.message.substring(0, 80)}...`);
      }
      console.log('');
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Analysis and recommendations
  console.log('🎯 CLAUDE 4 ANALYSIS FOR REVO 2.0:\n');
  
  if (workingModels.length > 0) {
    console.log('🚀 **CLAUDE 4 MODELS AVAILABLE**:');
    workingModels.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.model}`);
      console.log(`      Speed: ${m.speed}ms | Tokens: ${m.tokens} | Cost: ~$${m.cost.toFixed(5)}`);
      console.log(`      Swahili: ${m.hasSwahili ? '✅' : '❌'} | JSON: ${m.hasJSON ? '✅' : '❌'}`);
      console.log(`      Sample: "${m.headline}"`);
      console.log('');
    });
    
    // Recommend best Claude 4 model for Revo 2.0
    const bestForSocial = workingModels.find(m => m.hasSwahili && m.hasJSON && m.speed < 5000) || workingModels[0];
    const smartestModel = workingModels.find(m => m.model.includes('sonnet-4.5') || m.model.includes('4.5-sonnet'));
    
    console.log('🏆 **RECOMMENDATIONS FOR REVO 2.0**:');
    
    if (smartestModel) {
      console.log(`🧠 **For Highest Quality**: ${smartestModel.model} (Claude Sonnet 4.5 - "smartest model")`);
      console.log(`   Speed: ${smartestModel.speed}ms | Quality: Maximum creativity and nuance`);
      console.log(`   Best for: Complex strategy, premium content, brand campaigns`);
      console.log('');
    }
    
    if (bestForSocial) {
      console.log(`⚡ **For Social Media**: ${bestForSocial.model}`);
      console.log(`   Speed: ${bestForSocial.speed}ms | Swahili: ${bestForSocial.hasSwahili ? '✅' : '❌'}`);
      console.log(`   Best for: High-volume social media generation`);
      console.log('');
    }
    
    console.log('💡 **UPGRADE RECOMMENDATION**:');
    if (smartestModel && smartestModel.hasSwahili) {
      console.log(`✅ Upgrade to ${smartestModel.model} for maximum quality`);
    } else if (bestForSocial) {
      console.log(`✅ Upgrade to ${bestForSocial.model} for better performance`);
    } else {
      console.log(`✅ Test ${workingModels[0].model} - first available Claude 4 model`);
    }
    
  } else {
    console.log('❌ **NO CLAUDE 4 MODELS ACCESSIBLE**');
    console.log('');
    console.log('🔍 **POSSIBLE REASONS**:');
    console.log('   1. API key may not have Claude 4 access');
    console.log('   2. Models may use different naming convention');
    console.log('   3. May need to request Claude 4 access from Anthropic');
    console.log('');
    console.log('📋 **NEXT STEPS**:');
    console.log('   1. Check https://docs.claude.com for official model names');
    console.log('   2. Verify API key has Claude 4 access');
    console.log('   3. Contact Anthropic support if needed');
    console.log('');
    console.log('⚡ **CURRENT FALLBACK**: Continue with Claude 3.5 Haiku-20241022');
  }

  console.log('\n🎯 **REVO 2.0 SPECIFIC NEEDS**:');
  console.log('For your social media content generation, consider:');
  console.log('   📱 Speed: Sub-3 second generation for user experience');
  console.log('   🌍 Localization: Strong Swahili integration for Kenya market');
  console.log('   💰 Cost: Efficient for high-volume generation');
  console.log('   🎨 Creativity: Engaging, varied social media content');
  console.log('   📋 Structure: Reliable JSON format for system integration');
}

testClaude4Models();
