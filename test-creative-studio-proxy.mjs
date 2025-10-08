import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testCreativeStudioProxy() {
    console.log('🎨 Testing Creative Studio Proxy Integration...\n');
    
    // Check environment configuration
    console.log('📋 Environment Configuration:');
    console.log(`AI_PROXY_ENABLED: ${process.env.AI_PROXY_ENABLED}`);
    console.log(`AI_PROXY_URL: ${process.env.AI_PROXY_URL}`);
    console.log(`NEXT_PUBLIC_PROXY_URL: ${process.env.NEXT_PUBLIC_PROXY_URL}`);
    console.log('');
    
    const proxyUrl = process.env.AI_PROXY_URL || process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:8000';
    const testUserId = 'creative-studio-test-user';
    
    try {
        // Test 1: Check proxy server health
        console.log('1. 🔍 Checking proxy server health...');
        const healthResponse = await fetch(`${proxyUrl}/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ Proxy server is healthy');
            console.log(`📊 Available models: ${health.allowed_models?.join(', ') || 'Unknown'}`);
        } else {
            console.log(`❌ Proxy health check failed: ${healthResponse.status}`);
            return;
        }
        console.log('');
        
        // Test 2: Check user credits
        console.log('2. 💳 Checking user credits...');
        const creditsResponse = await fetch(`${proxyUrl}/credits/${testUserId}`);
        if (creditsResponse.ok) {
            const credits = await creditsResponse.json();
            console.log('✅ Credits retrieved successfully');
            console.log(`💰 Credits remaining: ${credits.credits_remaining}`);
            console.log(`🎯 User tier: ${credits.tier}`);
            console.log(`🤖 Available models: ${credits.tier_info.available_models.join(', ')}`);
        } else {
            console.log(`❌ Credits check failed: ${creditsResponse.status}`);
        }
        console.log('');
        
        // Test 3: Test image generation (Creative Studio's primary function)
        console.log('3. 🖼️ Testing image generation through proxy...');
        const imageRequest = {
            prompt: 'Create a professional business logo with modern design',
            user_id: testUserId,
            user_tier: 'free',
            model: 'gemini-2.5-flash-image-preview',
            temperature: 0.7,
            max_tokens: 1024
        };
        
        const imageResponse = await fetch(`${proxyUrl}/generate-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(imageRequest)
        });
        
        if (imageResponse.ok) {
            const result = await imageResponse.json();
            console.log('✅ Image generation successful');
            console.log(`🤖 Model used: ${result.model_used}`);
            console.log(`🔧 Provider: ${result.provider_used}`);
            console.log(`💳 Credits remaining: ${result.user_credits}`);
            console.log(`📊 Fallback level: ${result.fallback_level}`);
        } else {
            const error = await imageResponse.text();
            console.log(`❌ Image generation failed: ${imageResponse.status}`);
            console.log(`Error details: ${error}`);
        }
        console.log('');
        
        // Test 4: Test text generation (for AI explanations)
        console.log('4. 📝 Testing text generation through proxy...');
        const textRequest = {
            prompt: 'Explain the design choices for a modern business logo',
            user_id: testUserId,
            user_tier: 'free',
            model: 'gemini-2.5-flash',
            temperature: 0.7,
            max_tokens: 500
        };
        
        const textResponse = await fetch(`${proxyUrl}/generate-text`, {
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
            console.log(`❌ Text generation failed: ${textResponse.status}`);
            console.log(`Error details: ${error}`);
        }
        console.log('');
        
        // Test 5: Check final credits after tests
        console.log('5. 📊 Final credits check...');
        const finalCreditsResponse = await fetch(`${proxyUrl}/credits/${testUserId}`);
        if (finalCreditsResponse.ok) {
            const finalCredits = await finalCreditsResponse.json();
            console.log(`💰 Final credits: ${finalCredits.credits_remaining}`);
            console.log(`💸 Total cost incurred: ${finalCredits.total_ai_cost_incurred}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure proxy server is running: python proxy-server/main.py');
        console.log('2. Check AI_PROXY_ENABLED=true in .env.local');
        console.log('3. Verify proxy URL is correct');
        console.log('4. Check if Creative Studio is configured to use proxy');
    }
}

// Run the test
testCreativeStudioProxy();
