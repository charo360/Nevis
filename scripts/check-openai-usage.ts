import OpenAI from 'openai';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function checkOpenAIUsage() {
  console.log('🔍 Checking OpenAI API Usage and Assistant Status...\n');

  try {
    // Check if we can access the API
    console.log('📡 **API Connection Test:**');
    const models = await openai.models.list();
    console.log(`✅ Connected to OpenAI API successfully`);
    console.log(`📊 Available models: ${models.data.length} models found\n`);

    // Check assistant status
    console.log('🤖 **Assistant Status Check:**');
    const assistantIds = {
      food: process.env.OPENAI_ASSISTANT_FOOD,
      retail: process.env.OPENAI_ASSISTANT_RETAIL,
      finance: process.env.OPENAI_ASSISTANT_FINANCE,
      service: process.env.OPENAI_ASSISTANT_SERVICE,
    };

    for (const [type, id] of Object.entries(assistantIds)) {
      if (id) {
        try {
          const assistant = await openai.beta.assistants.retrieve(id);
          console.log(`✅ ${type.toUpperCase()} Assistant (${id}): Active`);
          console.log(`   Model: ${assistant.model}`);
          console.log(`   Name: ${assistant.name}`);
          console.log(`   Instructions Length: ${assistant.instructions?.length || 0} chars`);
        } catch (error) {
          console.log(`❌ ${type.toUpperCase()} Assistant (${id}): Error - ${error}`);
        }
      } else {
        console.log(`⚠️ ${type.toUpperCase()} Assistant: No ID configured`);
      }
    }

    console.log('\n💰 **Token Usage Information:**');
    console.log('ℹ️ OpenAI API does not provide real-time usage data via API');
    console.log('ℹ️ To check token usage and billing:');
    console.log('   1. Visit: https://platform.openai.com/usage');
    console.log('   2. Check your current billing period usage');
    console.log('   3. Monitor costs in the billing dashboard');

    console.log('\n🔧 **Assistant API Pricing (as of 2024):**');
    console.log('   • GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens');
    console.log('   • GPT-4: $0.03/1K input tokens, $0.06/1K output tokens');
    console.log('   • Assistant API adds minimal overhead for thread management');

    console.log('\n📈 **Usage Optimization Tips:**');
    console.log('   • Assistants reuse context efficiently across conversations');
    console.log('   • Thread management reduces redundant context passing');
    console.log('   • Specialized assistants generate more targeted content');
    console.log('   • Consider using GPT-4 Turbo for cost optimization');

    // Test a simple assistant call to see actual token usage
    console.log('\n🧪 **Test Assistant Call:**');
    const foodAssistantId = process.env.OPENAI_ASSISTANT_FOOD;
    if (foodAssistantId) {
      try {
        const thread = await openai.beta.threads.create();
        console.log(`📝 Created test thread: ${thread.id}`);

        const message = await openai.beta.threads.messages.create(thread.id, {
          role: 'user',
          content: 'Generate a simple 2-word headline for fish cookies.'
        });

        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: foodAssistantId
        });

        // Wait for completion
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        let attempts = 0;
        while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
          if (attempts++ > 30) break; // 30 second timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }

        if (runStatus.status === 'completed') {
          const messages = await openai.beta.threads.messages.list(thread.id);
          const response = messages.data[0];
          console.log(`✅ Test successful! Response: "${response.content[0].text?.value}"`);
          
          // Check if usage info is available
          if (runStatus.usage) {
            console.log(`📊 Token Usage for this call:`);
            console.log(`   Input tokens: ${runStatus.usage.prompt_tokens}`);
            console.log(`   Output tokens: ${runStatus.usage.completion_tokens}`);
            console.log(`   Total tokens: ${runStatus.usage.total_tokens}`);
          } else {
            console.log(`ℹ️ Token usage data not available in response`);
          }
        } else {
          console.log(`❌ Test failed with status: ${runStatus.status}`);
        }

        // Clean up
        await openai.beta.threads.del(thread.id);
        console.log(`🗑️ Cleaned up test thread`);

      } catch (error) {
        console.log(`❌ Test assistant call failed: ${error}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking OpenAI usage:', error);
    process.exit(1);
  }
}

checkOpenAIUsage();
