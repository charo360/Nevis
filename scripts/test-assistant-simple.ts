#!/usr/bin/env tsx

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testAssistantSimple() {
  console.log('🧪 Testing Assistant Availability\n');

  try {
    // Check environment variables
    console.log('🔍 Environment Check:');
    console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   OPENAI_ASSISTANT_FOOD: ${process.env.OPENAI_ASSISTANT_FOOD || '❌ Missing'}`);
    console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   VERTEX_AI_ENABLED: ${process.env.VERTEX_AI_ENABLED || '❌ Missing'}`);
    console.log('');

    // Test Assistant Manager
    console.log('🤖 Testing Assistant Manager...');
    const { assistantManager } = await import('../src/ai/assistants/assistant-manager');
    
    console.log('✅ Assistant Manager imported');
    
    // Check if food assistant is available
    const isAvailable = assistantManager.isAvailable('food');
    console.log(`🍕 Food Assistant Available: ${isAvailable ? '✅ YES' : '❌ NO'}`);
    
    if (isAvailable) {
      console.log('🎉 SUCCESS: Food Assistant is ready to use!');
    } else {
      console.log('❌ ISSUE: Food Assistant not available');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the test
testAssistantSimple().catch(console.error);
