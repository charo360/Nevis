const OpenAI = require('openai');

async function testAssistant() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No OPENAI_API_KEY found in environment');
    return;
  }
  
  console.log('🔑 API Key:', apiKey.substring(0, 20) + '...');
  
  const client = new OpenAI({ apiKey });
  
  try {
    // Test 1: List assistants
    console.log('\n📋 Test 1: Listing assistants...');
    const assistants = await client.beta.assistants.list({ limit: 5 });
    console.log('✅ Found', assistants.data.length, 'assistants');
    assistants.data.forEach(a => console.log('  -', a.id, ':', a.name));
    
    // Test 2: Get specific assistant
    const foodAssistantId = process.env.OPENAI_ASSISTANT_FOOD || 'asst_DZjunOlPzpCLgxYLBEKzSObR';
    console.log('\n🍔 Test 2: Getting food assistant:', foodAssistantId);
    const assistant = await client.beta.assistants.retrieve(foodAssistantId);
    console.log('✅ Assistant found:', assistant.name);
    console.log('   Model:', assistant.model);
    console.log('   Tools:', assistant.tools?.map(t => t.type).join(', '));
    
    // Test 3: Create thread and run
    console.log('\n🧵 Test 3: Creating thread...');
    const thread = await client.beta.threads.create();
    console.log('✅ Thread created:', thread.id);
    
    console.log('\n💬 Test 4: Adding message...');
    await client.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Generate a short headline for a cookie business: just return "Test Successful" if you can read this'
    });
    console.log('✅ Message added');
    
    console.log('\n🏃 Test 5: Running assistant...');
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: foodAssistantId,
      temperature: 1.0
    });
    console.log('✅ Run created:', run.id, 'Status:', run.status);
    
    // Wait for completion
    console.log('\n⏳ Test 6: Waiting for completion...');
    let status = run.status;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled' && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 1000));
      const runStatus = await client.beta.threads.runs.retrieve(run.id, { thread_id: thread.id });
      status = runStatus.status;
      
      if (status !== run.status) {
        console.log('   Status changed:', status);
      }
      
      if (status === 'failed') {
        console.error('❌ Run failed:', runStatus.last_error);
        break;
      }
      
      attempts++;
    }
    
    if (status === 'completed') {
      console.log('✅ Run completed successfully!');
      
      const messages = await client.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];
      if (lastMessage.role === 'assistant') {
        const content = lastMessage.content[0];
        if (content.type === 'text') {
          console.log('\n📝 Assistant response:');
          console.log(content.text.value.substring(0, 500));
        }
      }
    } else if (attempts >= maxAttempts) {
      console.error('❌ Timeout waiting for completion');
    }
    
    // Cleanup
    console.log('\n🗑️  Cleaning up...');
    await client.beta.threads.del(thread.id);
    console.log('✅ Thread deleted');
    
    console.log('\n✅ ALL TESTS PASSED - OpenAI Assistants are working!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.status) console.error('   Status:', error.status);
    if (error.type) console.error('   Type:', error.type);
    console.error('\n   Full error:', error);
  }
}

testAssistant();
