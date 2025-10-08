import fetch from 'node-fetch';

async function testProxyCredits() {
    const baseUrl = 'http://localhost:8000';

    console.log('🔍 Testing Proxy Server Credits and Status...\n');

    try {
        // Test 1: Check proxy server stats
        console.log('1. Checking proxy server stats...');
        const statsResponse = await fetch(`${baseUrl}/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Proxy server is running');
            console.log(`📊 Total users: ${stats.total_users}`);
            console.log(`💰 Total credits remaining: ${stats.total_credits_remaining}`);
            console.log(`💸 Total AI cost: ${stats.total_actual_ai_cost}`);
            console.log(`🤖 Available models: ${stats.allowed_models.length}`);
            console.log(`🚫 Blocked models: ${stats.blocked_models.join(', ')}`);
            console.log(`🔄 OpenRouter fallback: ${stats.openrouter_fallback.configured ? 'Configured' : 'Not configured'}`);
            console.log('');
        } else {
            console.log(`❌ Failed to get stats: ${statsResponse.status} ${statsResponse.statusText}`);
        }

        // Test 2: Check credits for a test user
        const testUserId = 'test-user-123';
        console.log(`2. Checking credits for user: ${testUserId}...`);
        const creditsResponse = await fetch(`${baseUrl}/credits/${testUserId}`);
        if (creditsResponse.ok) {
            const credits = await creditsResponse.json();
            console.log('✅ User credits retrieved');
            console.log(`👤 User ID: ${credits.user_id}`);
            console.log(`🎯 Tier: ${credits.tier}`);
            console.log(`💳 Credits remaining: ${credits.credits_remaining}`);
            console.log(`💰 Total AI cost: ${credits.total_ai_cost_incurred}`);
            console.log(`📅 Last updated: ${credits.last_updated || 'Never'}`);
            console.log(`🔧 Available models: ${credits.tier_info.available_models.join(', ')}`);
            console.log('');
        } else {
            console.log(`❌ Failed to get user credits: ${creditsResponse.status} ${creditsResponse.statusText}`);
        }

        // Test 3: Test a simple text generation to see if credits work
        console.log('3. Testing text generation with credits...');
        const textRequest = {
            model: 'gemini-2.5-flash',
            prompt: 'Generate a simple test message',
            user_id: testUserId,
            user_tier: 'free',
            temperature: 0.7,
            max_tokens: 50
        };

        const textResponse = await fetch(`${baseUrl}/generate-text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(textRequest)
        });

        if (textResponse.ok) {
            const result = await textResponse.json();
            console.log('✅ Text generation successful');
            console.log(`🤖 Model used: ${result.model_used}`);
            console.log(`🔧 Provider: ${result.provider_used}`);
            console.log(`💳 Credits remaining: ${result.user_credits}`);
            console.log(`📝 Generated text: ${result.data.substring(0, 100)}...`);
        } else {
            const error = await textResponse.text();
            console.log(`❌ Text generation failed: ${textResponse.status} ${textResponse.statusText}`);
            console.log(`Error details: ${error}`);
        }

    } catch (error) {
        console.error('❌ Error testing proxy:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the proxy server is running: python proxy-server/main.py');
        console.log('2. Check if port 8000 is available');
        console.log('3. Verify environment variables are set');
    }
}

// Run the test
testProxyCredits();
