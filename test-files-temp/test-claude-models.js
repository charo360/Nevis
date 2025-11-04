const { getClaudeClient } = require('./src/lib/services/claude-client.ts');

async function testClaudeModels() {
  console.log('🧪 Testing Claude Models...\n');
  
  const client = getClaudeClient();
  
  // Test the models that claim to be available
  const testModels = [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229', 
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241220',
    // Test potential Claude 4.5 names
    'claude-4-5-sonnet-20241220',
    'claude-4.5-sonnet-20241220',
    'claude-sonnet-4-5-20250929',
    'claude-3-5-sonnet-20250101'
  ];
  
  for (const model of testModels) {
    try {
      console.log(`🧪 Testing: ${model}`);
      const result = await client.generateText(
        'Generate a 5-word headline for a fintech company.',
        model,
        { temperature: 0.7, maxTokens: 50 }
      );
      console.log(`✅ ${model} - WORKS!`);
      console.log(`   Response: "${result.text.substring(0, 50)}"`);
      console.log(`   Tokens: ${result.tokensUsed.total}\n`);
    } catch (error) {
      console.log(`❌ ${model} - FAILED`);
      console.log(`   Error: ${error.message.substring(0, 100)}\n`);
    }
  }
}

testClaudeModels().catch(console.error);
