/**
 * Test Official Claude 4 Models (Correct Names from Documentation)
 * Using the actual model identifiers from Anthropic docs
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testOfficialClaude4Models() {
  console.log('🔍 Testing Official Claude 4 Models (Correct Names)\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Official Claude 4 model names from the documentation
  const officialModels = [
    // Claude 4.5 models (newest)
    {
      name: 'Claude Sonnet 4.5',
      id: 'claude-sonnet-4-5-20250929',
      alias: 'claude-sonnet-4-5',
      description: 'Smartest model for complex agents and coding'
    },
    {
      name: 'Claude Haiku 4.5', 
      id: 'claude-haiku-4-5-20251001',
      alias: 'claude-haiku-4-5',
      description: 'Fastest model with near-frontier intelligence'
    },
    
    // Claude 4.1 models
    {
      name: 'Claude Opus 4.1',
      id: 'claude-opus-4-1-20250805',
      alias: 'claude-opus-4-1', 
      description: 'Exceptional model for specialized reasoning tasks'
    }
  ];

  // Revo 2.0 social media test prompt
  const revo2Prompt = `Create engaging social media content for Paya (Financial Technology) on Instagram.

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

  console.log('🧪 Testing official Claude 4 models for Revo 2.0...\n');

  const results = [];

  for (const model of officialModels) {
    console.log(`⚡ Testing: ${model.name} (${model.description})`);
    console.log(`   Model ID: ${model.id}`);
    console.log(`   Alias: ${model.alias}`);
    
    // Test both full ID and alias
    const modelsToTry = [model.id, model.alias];
    
    for (const modelId of modelsToTry) {
      try {
        console.log(`   🔄 Trying: ${modelId}`);
        
        const startTime = Date.now();
        
        const message = await anthropic.messages.create({
          model: modelId,
          max_tokens: 300,
          temperature: 0.8,
          messages: [{ role: 'user', content: revo2Prompt }]
        });

        const processingTime = Date.now() - startTime;
        const response = message.content[0].text;
        const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
        
        console.log(`   ✅ SUCCESS! ${model.name} is available!`);
        console.log(`   ⏱️  Speed: ${processingTime}ms`);
        console.log(`   📊 Tokens: ${totalTokens}`);
        
        // Analyze content quality for social media
        let contentQuality = {
          hasSwahili: false,
          hasJSON: false,
          headline: '',
          caption: '',
          socialMediaReady: false
        };
        
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const content = JSON.parse(jsonMatch[0]);
            contentQuality.hasJSON = true;
            contentQuality.headline = content.headline || '';
            contentQuality.caption = content.caption || '';
            contentQuality.hasSwahili = /karibu|haraka|pesa|hakuna|twende|sawa|poa|mambo/i.test(response.toLowerCase());
            contentQuality.socialMediaReady = contentQuality.hasJSON && contentQuality.headline.length > 0;
            
            console.log(`   📝 Headline: "${content.headline}"`);
            console.log(`   📝 Caption: "${content.caption?.substring(0, 50)}..."`);
            console.log(`   🌍 Swahili: ${contentQuality.hasSwahili ? '✅ Detected' : '❌ Missing'}`);
            console.log(`   📱 Social Media Ready: ${contentQuality.socialMediaReady ? '✅ Yes' : '❌ No'}`);
          }
        } catch (e) {
          console.log(`   📝 Raw response: "${response.substring(0, 80)}..."`);
          console.log(`   ⚠️  JSON parsing failed`);
        }
        
        results.push({
          ...model,
          workingModelId: modelId,
          speed: processingTime,
          tokens: totalTokens,
          ...contentQuality,
          available: true
        });
        
        console.log(`   🎉 ${model.name} CONFIRMED AND WORKING!\n`);
        break; // Success, no need to try alias
        
      } catch (error) {
        if (error.message.includes('not_found_error')) {
          console.log(`   ❌ ${modelId} not available`);
        } else if (error.message.includes('rate_limit')) {
          console.log(`   ⚠️  Rate limited (but model exists!)`);
          results.push({
            ...model,
            workingModelId: modelId,
            speed: 'Rate limited',
            available: true,
            rateLimited: true
          });
          break;
        } else {
          console.log(`   ❌ Error with ${modelId}: ${error.message.substring(0, 60)}...`);
        }
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (!results.find(r => r.id === model.id)) {
      console.log(`   ❌ ${model.name} not accessible with current API key\n`);
    }
    
    // Delay between different models
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Analysis and recommendations
  console.log('🎯 CLAUDE 4 ANALYSIS FOR REVO 2.0:\n');
  
  const availableModels = results.filter(r => r.available);
  
  if (availableModels.length > 0) {
    console.log('🚀 **AVAILABLE CLAUDE 4 MODELS**:');
    availableModels.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (${m.workingModelId})`);
      console.log(`      Description: ${m.description}`);
      if (!m.rateLimited) {
        console.log(`      Speed: ${m.speed}ms | Tokens: ${m.tokens}`);
        console.log(`      Swahili: ${m.hasSwahili ? '✅' : '❌'} | Social Ready: ${m.socialMediaReady ? '✅' : '❌'}`);
        if (m.headline) console.log(`      Sample: "${m.headline}"`);
      } else {
        console.log(`      Status: Rate limited (but accessible)`);
      }
      console.log('');
    });
    
    // Recommendations based on Revo 2.0 needs
    console.log('🏆 **RECOMMENDATIONS FOR REVO 2.0 SOCIAL MEDIA**:\n');
    
    const smartestModel = availableModels.find(m => m.name.includes('Sonnet 4.5'));
    const fastestModel = availableModels.find(m => m.name.includes('Haiku 4.5'));
    const reasoningModel = availableModels.find(m => m.name.includes('Opus 4.1'));
    
    if (fastestModel && !fastestModel.rateLimited) {
      console.log(`⚡ **For High-Volume Social Media**: ${fastestModel.name}`);
      console.log(`   Model: ${fastestModel.workingModelId}`);
      console.log(`   Speed: ${fastestModel.speed}ms (${fastestModel.description.toLowerCase()})`);
      console.log(`   Best for: Daily social media posts, high-volume generation`);
      console.log('');
    }
    
    if (smartestModel && !smartestModel.rateLimited) {
      console.log(`🧠 **For Premium Content**: ${smartestModel.name}`);
      console.log(`   Model: ${smartestModel.workingModelId}`);
      console.log(`   Speed: ${smartestModel.speed}ms (${smartestModel.description.toLowerCase()})`);
      console.log(`   Best for: Brand campaigns, complex strategy, premium content`);
      console.log('');
    }
    
    if (reasoningModel && !reasoningModel.rateLimited) {
      console.log(`🎯 **For Strategic Content**: ${reasoningModel.name}`);
      console.log(`   Model: ${reasoningModel.workingModelId}`);
      console.log(`   Speed: ${reasoningModel.speed}ms (${reasoningModel.description.toLowerCase()})`);
      console.log(`   Best for: Complex reasoning, specialized campaigns`);
      console.log('');
    }
    
    // Final recommendation
    const bestForSocial = fastestModel || smartestModel || availableModels[0];
    console.log('💡 **IMMEDIATE UPGRADE RECOMMENDATION**:');
    console.log(`✅ Upgrade Revo 2.0 to: ${bestForSocial.name}`);
    console.log(`   Model ID: ${bestForSocial.workingModelId}`);
    console.log(`   Reason: ${bestForSocial.name.includes('Haiku') ? 'Fastest with near-frontier intelligence' : 'Most advanced available'}`);
    
  } else {
    console.log('❌ **NO CLAUDE 4 MODELS ACCESSIBLE**');
    console.log('');
    console.log('🔍 **POSSIBLE SOLUTIONS**:');
    console.log('   1. API key needs Claude 4 access - contact Anthropic');
    console.log('   2. Upgrade billing plan to access Claude 4 models');
    console.log('   3. Request beta access for Claude 4 family');
    console.log('');
    console.log('📞 **CONTACT ANTHROPIC**: Request Claude 4 API access');
    console.log('📋 **CURRENT FALLBACK**: Continue with Claude 3.5 Haiku-20241022');
  }

  console.log('\n🎯 **REVO 2.0 OPTIMIZATION SUMMARY**:');
  console.log('Current: Claude 3.5 Haiku-20241022 (2.6s, excellent Swahili)');
  if (availableModels.length > 0) {
    const best = availableModels[0];
    console.log(`Upgrade: ${best.name} (${best.speed}ms, ${best.description.toLowerCase()})`);
    console.log('Expected: Better creativity, nuanced content, advanced reasoning');
  } else {
    console.log('Upgrade: Pending Claude 4 API access');
  }
}

testOfficialClaude4Models();
