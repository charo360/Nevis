import { getClaudeClient } from './src/lib/services/claude-client.ts';

async function testClaudeSonnet45() {
  console.log('🧪 Testing Claude Sonnet 4.5 Model...\n');
  
  try {
    const client = getClaudeClient();
    
    // Test the exact model we're using in Revo 2.0
    console.log('🤖 Testing: claude-sonnet-4-5-20250929');
    
    const result = await client.generateText(
      'Generate a creative 5-word headline for a Kenyan fintech company called Paya that offers Buy Now Pay Later services.',
      'claude-sonnet-4-5-20250929',
      { 
        temperature: 0.9, 
        maxTokens: 100 
      }
    );
    
    console.log('✅ SUCCESS! Claude Sonnet 4.5 is working!');
    console.log(`📝 Response: "${result.text}"`);
    console.log(`📊 Tokens used: ${result.tokensUsed.total} (${result.tokensUsed.input} input + ${result.tokensUsed.output} output)`);
    console.log(`⏱️ Processing time: ${result.processingTime}ms`);
    console.log(`🎯 Model: ${result.model}`);
    
    return true;
    
  } catch (error) {
    console.log('❌ FAILED! Claude Sonnet 4.5 is NOT working!');
    console.log(`💥 Error: ${error.message}`);
    
    // Test fallback models
    console.log('\n🔄 Testing fallback models...');
    
    const fallbackModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307'
    ];
    
    for (const model of fallbackModels) {
      try {
        console.log(`🧪 Testing: ${model}`);
        const client = getClaudeClient();
        const result = await client.generateText(
          'Generate a 5-word headline for a fintech company.',
          model,
          { temperature: 0.7, maxTokens: 50 }
        );
        console.log(`✅ ${model} - WORKS!`);
        console.log(`   Response: "${result.text.substring(0, 50)}"`);
        break;
      } catch (err) {
        console.log(`❌ ${model} - FAILED: ${err.message.substring(0, 100)}`);
      }
    }
    
    return false;
  }
}

testClaudeSonnet45().catch(console.error);
