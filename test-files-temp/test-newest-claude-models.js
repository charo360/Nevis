/**
 * Test for Newest Claude Models (Claude 4.5, etc.)
 * Check if there are newer, more advanced Claude models available
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function testNewestClaudeModels() {
  console.log('🔍 Searching for Newest Claude Models (Claude 4.5, etc.)\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test potential newer Claude models
  const potentialModels = [
    // Claude 4.x series (hypothetical)
    'claude-4.5-sonnet',
    'claude-4.5-haiku', 
    'claude-4-sonnet',
    'claude-4-haiku',
    'claude-4',
    
    // Latest Claude 3.5 variations
    'claude-3-5-sonnet-20241220',
    'claude-3-5-sonnet-20250101',
    'claude-3-5-sonnet-latest',
    'claude-3-5-sonnet-v2',
    'claude-3-5-haiku-20241220',
    'claude-3-5-haiku-20250101',
    'claude-3-5-haiku-v2',
    
    // Other potential naming patterns
    'claude-sonnet-latest',
    'claude-haiku-latest',
    'claude-latest',
    'claude-pro',
    'claude-premium',
    'claude-ultra'
  ];

  // Social media test prompt
  const socialMediaPrompt = `Create a catchy Instagram post for Paya fintech in Kenya.

Generate JSON:
{
  "headline": "Max 6 words - creative and punchy",
  "caption": "Max 25 words - engaging with Swahili mix", 
  "hashtags": ["#Paya", "#Kenya", "#Fintech"]
}`;

  console.log('🧪 Testing potential newer Claude models...\n');

  const workingModels = [];
  const notFoundModels = [];

  for (const model of potentialModels) {
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
      
      console.log(`   ✅ FOUND NEW MODEL!`);
      console.log(`   ⏱️  Speed: ${processingTime}ms`);
      console.log(`   📊 Tokens: ${totalTokens}`);
      
      // Check content quality
      let hasSwahili = false;
      let sampleContent = '';
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const content = JSON.parse(jsonMatch[0]);
          hasSwahili = /karibu|haraka|pesa|hakuna|twende|sawa|poa|mambo/i.test(response.toLowerCase());
          sampleContent = content.headline || 'No headline';
          console.log(`   📝 Sample: "${sampleContent}"`);
          console.log(`   🌍 Swahili: ${hasSwahili ? '✅' : '❌'}`);
        }
      } catch (e) {
        sampleContent = response.substring(0, 50) + '...';
        console.log(`   📝 Sample: "${sampleContent}"`);
      }
      
      workingModels.push({
        model,
        speed: processingTime,
        tokens: totalTokens,
        hasSwahili,
        sample: sampleContent,
        isNew: true
      });
      
      console.log('   🎉 THIS IS A NEW MODEL! Adding to recommendations...\n');
      
    } catch (error) {
      if (error.message.includes('not_found_error')) {
        notFoundModels.push(model);
        console.log(`   ❌ Not available`);
      } else if (error.message.includes('rate_limit')) {
        console.log(`   ⚠️  Rate limited (but model exists!)`);
        workingModels.push({
          model,
          speed: 'Rate limited',
          tokens: 'Unknown',
          hasSwahili: 'Unknown',
          sample: 'Rate limited',
          isNew: true
        });
      } else {
        console.log(`   ❌ Error: ${error.message.substring(0, 60)}...`);
      }
      console.log('');
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Results analysis
  console.log('🎯 ANALYSIS RESULTS:\n');
  
  if (workingModels.length > 0) {
    console.log('🚀 **NEW CLAUDE MODELS FOUND**:');
    workingModels.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.model}`);
      console.log(`      Speed: ${m.speed}ms | Tokens: ${m.tokens} | Swahili: ${m.hasSwahili ? '✅' : '❌'}`);
      console.log(`      Sample: "${m.sample}"`);
      console.log('');
    });
    
    // Recommend best new model
    const bestNew = workingModels.find(m => m.hasSwahili) || workingModels[0];
    console.log('🏆 **RECOMMENDED UPGRADE**:');
    console.log(`✅ **${bestNew.model}** - Latest available Claude model`);
    console.log(`   Performance: ${bestNew.speed}ms | Quality: ${bestNew.hasSwahili ? 'Excellent (Swahili)' : 'Good'}`);
    
  } else {
    console.log('❌ **NO NEWER MODELS FOUND**');
    console.log('');
    console.log('📊 **CURRENT BEST OPTIONS** (from previous testing):');
    console.log('   1. claude-3-5-haiku-20241022 - Best for social media (2.6s, excellent Swahili)');
    console.log('   2. claude-3-haiku-20240307 - Fastest (1.0s, English only)');
    console.log('   3. claude-3-opus-20240229 - Highest quality (5.6s, excellent but slow)');
    console.log('');
    console.log('🎯 **RECOMMENDATION**: Stick with claude-3-5-haiku-20241022');
    console.log('   - Latest available Haiku model');
    console.log('   - Perfect balance of speed, cost, and quality');
    console.log('   - Excellent Swahili integration for Kenya market');
  }

  console.log('\n📋 **MODELS TESTED BUT NOT FOUND**:');
  console.log(`   Total tested: ${potentialModels.length}`);
  console.log(`   Not available: ${notFoundModels.length}`);
  
  if (notFoundModels.length > 0) {
    console.log('   Examples of unavailable models:');
    notFoundModels.slice(0, 5).forEach(model => {
      console.log(`   - ${model}`);
    });
    if (notFoundModels.length > 5) {
      console.log(`   ... and ${notFoundModels.length - 5} more`);
    }
  }

  console.log('\n💡 **CONCLUSION**:');
  if (workingModels.length > 0) {
    console.log('🎉 Found newer Claude models! Upgrade recommended.');
  } else {
    console.log('✅ Claude 3.5 Haiku-20241022 is currently the best available for social media.');
    console.log('🔄 Anthropic may release Claude 4.x in the future - check periodically.');
  }
}

testNewestClaudeModels();
