/**
 * Claude 4 Pricing Analysis
 * Calculate actual costs for Claude Haiku 4.5 vs previous models
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');

async function analyzeClaude4Pricing() {
  console.log('💰 Claude 4 Pricing Analysis for Revo 2.0\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not found');
    return;
  }

  const anthropic = new Anthropic({ apiKey });

  // Test prompt (typical Revo 2.0 generation)
  const testPrompt = `Create engaging social media content for Paya (Financial Technology) on Instagram.

🎯 BUSINESS CONTEXT:
- Business: Paya
- Industry: Financial Technology (Fintech)
- Location: Kenya
- Platform: Instagram

Generate JSON:
{
  "headline": "Max 6 words - punchy and memorable",
  "subheadline": "Max 12 words - supports headline", 
  "caption": "Max 25 words - engaging story with Swahili mix",
  "cta": "2-3 words - clear action",
  "hashtags": ["#Paya", "#DigitalBanking", "#Kenya"]
}`;

  // Claude pricing (as of October 2025)
  const pricingData = {
    'claude-haiku-4-5-20251001': {
      name: 'Claude Haiku 4.5',
      inputPrice: 0.00025,  // per 1K tokens
      outputPrice: 0.00125, // per 1K tokens
      description: 'Fastest model with near-frontier intelligence'
    },
    'claude-sonnet-4-5-20250929': {
      name: 'Claude Sonnet 4.5', 
      inputPrice: 0.003,    // per 1K tokens
      outputPrice: 0.015,   // per 1K tokens
      description: 'Smartest model for complex agents and coding'
    },
    'claude-opus-4-1-20250805': {
      name: 'Claude Opus 4.1',
      inputPrice: 0.015,    // per 1K tokens
      outputPrice: 0.075,   // per 1K tokens
      description: 'Exceptional model for specialized reasoning tasks'
    },
    'claude-3-5-haiku-20241022': {
      name: 'Claude 3.5 Haiku (Previous)',
      inputPrice: 0.00025,  // per 1K tokens
      outputPrice: 0.00125, // per 1K tokens
      description: 'Previous model'
    },
    'claude-3-haiku-20240307': {
      name: 'Claude 3 Haiku (Old)',
      inputPrice: 0.00025,  // per 1K tokens
      outputPrice: 0.00125, // per 1K tokens
      description: 'Older model'
    }
  };

  console.log('🧪 Testing models for cost analysis...\n');

  const results = [];

  for (const [modelId, pricing] of Object.entries(pricingData)) {
    try {
      console.log(`⚡ Testing: ${pricing.name}`);
      
      const startTime = Date.now();
      
      const message = await anthropic.messages.create({
        model: modelId,
        max_tokens: 300,
        temperature: 0.8,
        messages: [{ role: 'user', content: testPrompt }]
      });

      const processingTime = Date.now() - startTime;
      const inputTokens = message.usage.input_tokens;
      const outputTokens = message.usage.output_tokens;
      const totalTokens = inputTokens + outputTokens;
      
      // Calculate actual cost
      const inputCost = (inputTokens / 1000) * pricing.inputPrice;
      const outputCost = (outputTokens / 1000) * pricing.outputPrice;
      const totalCost = inputCost + outputCost;
      
      console.log(`   ⏱️  Speed: ${processingTime}ms`);
      console.log(`   📊 Tokens: ${inputTokens} in + ${outputTokens} out = ${totalTokens} total`);
      console.log(`   💰 Cost: $${totalCost.toFixed(6)} ($${inputCost.toFixed(6)} + $${outputCost.toFixed(6)})`);
      
      results.push({
        model: pricing.name,
        modelId,
        speed: processingTime,
        inputTokens,
        outputTokens,
        totalTokens,
        totalCost,
        costPer1000: (totalCost / totalTokens) * 1000,
        description: pricing.description
      });
      
      console.log('');
      
    } catch (error) {
      if (error.message.includes('not_found_error')) {
        console.log(`   ❌ ${pricing.name} not available`);
      } else {
        console.log(`   ❌ Error: ${error.message.substring(0, 60)}...`);
      }
      console.log('');
    }
    
    // Delay between tests
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Cost analysis
  console.log('💰 COST ANALYSIS FOR REVO 2.0:\n');
  
  if (results.length > 0) {
    // Sort by cost
    const sortedByCost = [...results].sort((a, b) => a.totalCost - b.totalCost);
    
    console.log('📊 **COST COMPARISON** (per generation):');
    sortedByCost.forEach((r, i) => {
      const costMultiplier = i === 0 ? 1 : (r.totalCost / sortedByCost[0].totalCost);
      console.log(`   ${i + 1}. ${r.model}: $${r.totalCost.toFixed(6)} (${costMultiplier.toFixed(1)}x)`);
      console.log(`      Speed: ${r.speed}ms | Tokens: ${r.totalTokens} | Per 1K: $${r.costPer1000.toFixed(4)}`);
      console.log('');
    });
    
    // Volume calculations
    console.log('📈 **VOLUME COST PROJECTIONS**:');
    const baseModel = sortedByCost[0];
    const volumes = [100, 1000, 10000, 100000];
    
    console.log(`\nUsing ${baseModel.model} as baseline ($${baseModel.totalCost.toFixed(6)} per generation):\n`);
    
    volumes.forEach(volume => {
      console.log(`📊 **${volume.toLocaleString()} generations per month**:`);
      sortedByCost.forEach(r => {
        const monthlyCost = r.totalCost * volume;
        const yearlyProjection = monthlyCost * 12;
        console.log(`   ${r.model}: $${monthlyCost.toFixed(2)}/month ($${yearlyProjection.toFixed(0)}/year)`);
      });
      console.log('');
    });
    
    // Current vs upgrade comparison
    const currentModel = results.find(r => r.model.includes('Claude 3.5 Haiku'));
    const upgradeModel = results.find(r => r.model.includes('Claude Haiku 4.5'));
    
    if (currentModel && upgradeModel) {
      console.log('🔄 **UPGRADE COST IMPACT**:');
      console.log(`Current: ${currentModel.model}`);
      console.log(`Upgrade: ${upgradeModel.model}`);
      console.log('');
      
      const costDifference = upgradeModel.totalCost - currentModel.totalCost;
      const costMultiplier = upgradeModel.totalCost / currentModel.totalCost;
      const speedImprovement = currentModel.speed - upgradeModel.speed;
      
      console.log(`💰 Cost per generation: $${currentModel.totalCost.toFixed(6)} → $${upgradeModel.totalCost.toFixed(6)}`);
      console.log(`📈 Cost change: ${costDifference >= 0 ? '+' : ''}$${costDifference.toFixed(6)} (${costMultiplier.toFixed(1)}x)`);
      console.log(`⚡ Speed change: ${currentModel.speed}ms → ${upgradeModel.speed}ms (${speedImprovement > 0 ? speedImprovement + 'ms faster' : Math.abs(speedImprovement) + 'ms slower'})`);
      console.log('');
      
      // Monthly cost projections for upgrade
      console.log('📊 **MONTHLY COST IMPACT**:');
      [1000, 5000, 10000, 50000].forEach(volume => {
        const currentMonthlyCost = currentModel.totalCost * volume;
        const upgradeMonthlyCost = upgradeModel.totalCost * volume;
        const monthlyIncrease = upgradeMonthlyCost - currentMonthlyCost;
        
        console.log(`   ${volume.toLocaleString()} generations: $${currentMonthlyCost.toFixed(2)} → $${upgradeMonthlyCost.toFixed(2)} (+$${monthlyIncrease.toFixed(2)})`);
      });
    }
    
    console.log('\n🎯 **COST RECOMMENDATION**:');
    const cheapest = sortedByCost[0];
    const fastest = results.reduce((prev, curr) => prev.speed < curr.speed ? prev : curr);
    const smartest = results.find(r => r.model.includes('Sonnet 4.5'));
    
    console.log(`💰 **Most Cost-Effective**: ${cheapest.model} ($${cheapest.totalCost.toFixed(6)} per generation)`);
    console.log(`⚡ **Fastest**: ${fastest.model} (${fastest.speed}ms, $${fastest.totalCost.toFixed(6)} per generation)`);
    if (smartest) {
      console.log(`🧠 **Smartest**: ${smartest.model} ($${smartest.totalCost.toFixed(6)} per generation)`);
    }
    
  } else {
    console.log('❌ No cost data available - models not accessible');
  }

  console.log('\n💡 **COST OPTIMIZATION TIPS**:');
  console.log('1. Use Claude Haiku 4.5 for high-volume daily content');
  console.log('2. Use Claude Sonnet 4.5 for premium campaigns only');
  console.log('3. Optimize prompts to reduce token usage');
  console.log('4. Monitor monthly usage and adjust model selection');
  console.log('5. Consider hybrid approach: Haiku for volume, Sonnet for quality');
}

analyzeClaude4Pricing();
