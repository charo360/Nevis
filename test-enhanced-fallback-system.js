/**
 * Test Enhanced 3-Tier Fallback System
 * Tests the new fallback architecture: Google Key 1 → Google Key 2 → Google Key 3 → OpenRouter
 */

const axios = require('axios');

const PROXY_URL = 'http://localhost:8000';
const TEST_USER_ID = 'test-fallback-user';

// Test configurations for different Revo versions
const TEST_CONFIGS = [
    {
        name: "Revo 1.0 Image Generation",
        endpoint: "/generate-image",
        payload: {
            prompt: "Create a professional business card design with modern typography",
            user_id: TEST_USER_ID,
            user_tier: "free",
            model: "gemini-2.5-flash-image-preview",
            revo_version: "1.0",
            max_tokens: 8192,
            temperature: 0.7
        }
    },
    {
        name: "Revo 1.5 Text Generation",
        endpoint: "/generate-text",
        payload: {
            prompt: "Write a compelling social media caption for a coffee shop",
            user_id: TEST_USER_ID,
            user_tier: "free", 
            model: "gemini-2.5-flash",
            revo_version: "1.5",
            max_tokens: 8192,
            temperature: 0.7
        }
    },
    {
        name: "Revo 2.0 Image Generation",
        endpoint: "/generate-image",
        payload: {
            prompt: "Design a modern restaurant menu layout with elegant styling",
            user_id: TEST_USER_ID,
            user_tier: "free",
            model: "gemini-2.5-flash-image-preview", 
            revo_version: "2.0",
            max_tokens: 8192,
            temperature: 0.7
        }
    }
];

async function testHealthEndpoint() {
    console.log('\n🏥 Testing Health Endpoint...');
    try {
        const response = await axios.get(`${PROXY_URL}/health`);
        console.log('✅ Health Check Response:');
        console.log(`   Status: ${response.data.status}`);
        console.log(`   Fallback System: ${response.data.fallback_system}`);
        console.log(`   OpenRouter Configured: ${response.data.openrouter_configured}`);
        
        console.log('\n📊 API Key Status:');
        Object.entries(response.data.api_key_status).forEach(([version, status]) => {
            console.log(`   ${version.toUpperCase()}:`);
            console.log(`     Primary: ${status.primary_configured ? '✅' : '❌'}`);
            console.log(`     Secondary: ${status.secondary_configured ? '✅' : '❌'}`);
            console.log(`     Tertiary: ${status.tertiary_configured ? '✅' : '❌'}`);
            console.log(`     Total Keys: ${status.total_keys}/3`);
        });

        console.log('\n🔄 Fallback Levels:');
        response.data.fallback_levels.forEach((level, index) => {
            console.log(`   ${index + 1}. ${level}`);
        });

        return true;
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        return false;
    }
}

async function testEnhancedFallback(config) {
    console.log(`\n🧪 Testing ${config.name}...`);
    
    try {
        const startTime = Date.now();
        const response = await axios.post(`${PROXY_URL}${config.endpoint}`, config.payload);
        const endTime = Date.now();
        
        if (response.data.success) {
            console.log('✅ Request successful!');
            console.log(`   Model Used: ${response.data.model_used}`);
            console.log(`   Provider Used: ${response.data.provider_used}`);
            console.log(`   Fallback Level: ${response.data.fallback_level}`);
            console.log(`   Endpoint Used: ${response.data.endpoint_used}`);
            console.log(`   Response Time: ${endTime - startTime}ms`);
            console.log(`   User Credits Remaining: ${response.data.user_credits}`);
            
            // Log which fallback level was used
            if (response.data.fallback_level.startsWith('google-key-1')) {
                console.log('   🎯 Used Primary Google API Key (Best case)');
            } else if (response.data.fallback_level.startsWith('google-key-2')) {
                console.log('   🔄 Used Secondary Google API Key (Good fallback)');
            } else if (response.data.fallback_level.startsWith('google-key-3')) {
                console.log('   ⚠️ Used Tertiary Google API Key (Last Google option)');
            } else if (response.data.fallback_level === 'openrouter') {
                console.log('   🆘 Used OpenRouter (Final fallback - quality may be reduced)');
            }
            
            return true;
        } else {
            console.log('❌ Request failed:', response.data);
            return false;
        }
    } catch (error) {
        console.error(`❌ ${config.name} failed:`, error.response?.data || error.message);
        return false;
    }
}

async function testCreditsEndpoint() {
    console.log('\n💳 Testing Credits Endpoint...');
    try {
        const response = await axios.get(`${PROXY_URL}/credits/${TEST_USER_ID}`);
        console.log('✅ Credits Response:');
        console.log(`   User ID: ${response.data.user_id}`);
        console.log(`   Tier: ${response.data.tier}`);
        console.log(`   Credits Remaining: ${response.data.credits_remaining}`);
        console.log(`   Total AI Cost: ${response.data.total_ai_cost_incurred}`);
        return true;
    } catch (error) {
        console.error('❌ Credits check failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Enhanced Fallback System Tests');
    console.log('=' .repeat(60));
    
    // Test health endpoint first
    const healthOk = await testHealthEndpoint();
    if (!healthOk) {
        console.log('❌ Health check failed, aborting tests');
        return;
    }
    
    // Test each configuration
    let successCount = 0;
    let totalTests = TEST_CONFIGS.length;
    
    for (const config of TEST_CONFIGS) {
        const success = await testEnhancedFallback(config);
        if (success) successCount++;
    }
    
    // Test credits endpoint
    await testCreditsEndpoint();
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Summary:');
    console.log(`   Successful Tests: ${successCount}/${totalTests}`);
    console.log(`   Success Rate: ${((successCount/totalTests) * 100).toFixed(1)}%`);
    
    if (successCount === totalTests) {
        console.log('🎉 All tests passed! Enhanced fallback system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above for details.');
    }
}

// Run the tests
runAllTests().catch(console.error);
