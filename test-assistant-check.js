/**
 * Test assistant availability and configuration
 */

async function testAssistants() {
  console.log('🔍 Testing Assistant Configuration');
  console.log('===================================');
  
  // Check environment variables
  const assistantIds = {
    retail: process.env.OPENAI_ASSISTANT_RETAIL,
    finance: process.env.OPENAI_ASSISTANT_FINANCE,
    service: process.env.OPENAI_ASSISTANT_SERVICE,
    saas: process.env.OPENAI_ASSISTANT_SAAS,
    food: process.env.OPENAI_ASSISTANT_FOOD,
    healthcare: process.env.OPENAI_ASSISTANT_HEALTHCARE,
    realestate: process.env.OPENAI_ASSISTANT_REALESTATE,
    education: process.env.OPENAI_ASSISTANT_EDUCATION,
    b2b: process.env.OPENAI_ASSISTANT_B2B,
    nonprofit: process.env.OPENAI_ASSISTANT_NONPROFIT,
  };
  
  const rollouts = {
    retail: process.env.ASSISTANT_ROLLOUT_RETAIL,
    finance: process.env.ASSISTANT_ROLLOUT_FINANCE,
    service: process.env.ASSISTANT_ROLLOUT_SERVICE,
    saas: process.env.ASSISTANT_ROLLOUT_SAAS,
    food: process.env.ASSISTANT_ROLLOUT_FOOD,
    healthcare: process.env.ASSISTANT_ROLLOUT_HEALTHCARE,
    realestate: process.env.ASSISTANT_ROLLOUT_REALESTATE,
    education: process.env.ASSISTANT_ROLLOUT_EDUCATION,
    b2b: process.env.ASSISTANT_ROLLOUT_B2B,
    nonprofit: process.env.ASSISTANT_ROLLOUT_NONPROFIT,
  };
  
  console.log('\n📋 Assistant IDs:');
  Object.entries(assistantIds).forEach(([type, id]) => {
    const status = id ? '✅' : '❌';
    console.log(`   ${status} ${type}: ${id || 'NOT SET'}`);
  });
  
  console.log('\n📊 Rollout Percentages:');
  Object.entries(rollouts).forEach(([type, percent]) => {
    const status = percent && percent !== '0' ? '✅' : '❌';
    console.log(`   ${status} ${type}: ${percent || '0'}%`);
  });
  
  console.log('\n🔧 Other Settings:');
  console.log(`   ENABLE_ASSISTANT_FALLBACK: ${process.env.ENABLE_ASSISTANT_FALLBACK || 'not set (defaults to true)'}`);
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ SET' : '❌ NOT SET'}`);
  
  // Count configured assistants
  const configuredAssistants = Object.values(assistantIds).filter(id => id).length;
  const activeRollouts = Object.values(rollouts).filter(p => p && p !== '0').length;
  
  console.log('\n📈 Summary:');
  console.log(`   Configured Assistants: ${configuredAssistants}/10`);
  console.log(`   Active Rollouts (>0%): ${activeRollouts}/10`);
  
  if (configuredAssistants === 10 && activeRollouts === 10) {
    console.log('\n✅ ALL ASSISTANTS CONFIGURED AND ACTIVE!');
  } else if (configuredAssistants === 10) {
    console.log('\n⚠️  All assistants configured but some rollouts are 0%');
  } else {
    console.log('\n❌ Missing some assistant configurations');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Starting Assistant Configuration Check');
testAssistants().catch(console.error);
