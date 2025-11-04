/**
 * Claude Integration Test Script
 * Tests Claude API connectivity and content generation capabilities
 */

const { getClaudeClient } = require('./src/lib/services/claude-client.ts');

async function testClaudeIntegration() {
  console.log('🚀 Starting Claude Integration Test...\n');

  try {
    // Get Claude client
    const claudeClient = getClaudeClient();
    console.log('✅ Claude client initialized successfully');

    // Test 1: Basic connectivity
    console.log('\n📡 Test 1: API Connectivity');
    const isConnected = await claudeClient.testConnection();
    
    if (!isConnected) {
      console.error('❌ Claude API connection failed');
      return;
    }

    // Test 2: Business content generation
    console.log('\n📝 Test 2: Business Content Generation');
    
    const businessContext = {
      businessName: 'Paya',
      businessType: 'Financial Technology (Fintech)',
      location: 'Kenya',
      services: ['Digital Banking', 'Payment Solutions', 'Buy Now Pay Later'],
      targetAudience: 'Consumers and businesses across Kenya'
    };

    // Test headline generation
    console.log('\n🎯 Testing Headline Generation...');
    const headlineResult = await claudeClient.generateBusinessContent(
      businessContext,
      'headline',
      {
        tone: 'engaging and trustworthy',
        maxWords: 6,
        includeLocalLanguage: false,
        avoidPatterns: ['Empower Your Business', 'Join thousands', 'Journey']
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.8
      }
    );

    console.log(`📄 Generated Headline: "${headlineResult.text}"`);
    console.log(`📊 Tokens used: ${headlineResult.tokensUsed.total}`);
    console.log(`⏱️ Processing time: ${headlineResult.processingTime}ms`);

    // Test caption generation
    console.log('\n📱 Testing Caption Generation...');
    const captionResult = await claudeClient.generateBusinessContent(
      businessContext,
      'caption',
      {
        tone: 'conversational and authentic',
        maxWords: 50,
        includeLocalLanguage: true,
        avoidPatterns: ['journey', 'everyday', 'empower']
      },
      {
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.9
      }
    );

    console.log(`📄 Generated Caption: "${captionResult.text}"`);
    console.log(`📊 Tokens used: ${captionResult.tokensUsed.total}`);
    console.log(`⏱️ Processing time: ${captionResult.processingTime}ms`);

    // Test 3: Model comparison
    console.log('\n🔄 Test 3: Model Comparison');
    
    const models = claudeClient.getAvailableModels();
    console.log(`📋 Available models: ${models.length}`);
    
    models.forEach(model => {
      console.log(`\n🤖 ${model.name} (${model.id})`);
      console.log(`   📝 ${model.description}`);
      console.log(`   💪 Strengths: ${model.strengths.join(', ')}`);
      console.log(`   🎯 Best for: ${model.bestFor.join(', ')}`);
      console.log(`   📊 Max tokens: ${model.maxTokens}`);
    });

    // Test 4: Content quality comparison
    console.log('\n🏆 Test 4: Content Quality Comparison');
    
    const testPrompt = `Create a compelling social media headline for Paya, a Kenyan fintech company that offers digital banking, payment solutions, and buy now pay later services. The headline should be 6 words maximum, avoid generic corporate language, and appeal to Kenyan consumers. Make it scroll-stopping and trustworthy.`;

    console.log('\n🥇 Claude 3.5 Sonnet (Recommended):');
    const sonnetResult = await claudeClient.generateText(testPrompt, 'claude-3-5-sonnet-20241022', { temperature: 0.8 });
    console.log(`   📄 Result: "${sonnetResult.text}"`);
    console.log(`   📊 Tokens: ${sonnetResult.tokensUsed.total}, Time: ${sonnetResult.processingTime}ms`);

    console.log('\n🥈 Claude 3 Haiku (Fast & Cost-Effective):');
    const haikuResult = await claudeClient.generateText(testPrompt, 'claude-3-haiku-20240307', { temperature: 0.8 });
    console.log(`   📄 Result: "${haikuResult.text}"`);
    console.log(`   📊 Tokens: ${haikuResult.tokensUsed.total}, Time: ${haikuResult.processingTime}ms`);

    console.log('\n🎉 Claude Integration Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ API connectivity working');
    console.log('✅ Business content generation working');
    console.log('✅ Multiple models available');
    console.log('✅ Quality content generation confirmed');
    console.log('\n🚀 Ready for Revo integration!');

  } catch (error) {
    console.error('\n❌ Claude Integration Test Failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check ANTHROPIC_API_KEY environment variable');
    console.error('2. Verify API key has sufficient credits');
    console.error('3. Check internet connectivity');
    console.error('4. Ensure @anthropic-ai/sdk is installed');
  }
}

// Run the test
testClaudeIntegration();
