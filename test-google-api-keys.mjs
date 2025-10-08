import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGoogleAPIKeys() {
    console.log('🔍 Testing Google API Keys...\n');
    
    const apiKeys = [
        { name: 'GEMINI_API_KEY', key: process.env.GEMINI_API_KEY },
        { name: 'GEMINI_API_KEY_REVO_1_0_PRIMARY', key: process.env.GEMINI_API_KEY_REVO_1_0_PRIMARY },
        { name: 'GEMINI_API_KEY_REVO_1_5_PRIMARY', key: process.env.GEMINI_API_KEY_REVO_1_5_PRIMARY },
        { name: 'GEMINI_API_KEY_REVO_2_0_PRIMARY', key: process.env.GEMINI_API_KEY_REVO_2_0_PRIMARY }
    ];
    
    for (const { name, key } of apiKeys) {
        if (!key) {
            console.log(`❌ ${name}: Not configured`);
            continue;
        }
        
        console.log(`🔑 Testing ${name}...`);
        
        try {
            // Test with the models endpoint first
            const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            const modelsResponse = await fetch(modelsUrl);
            
            if (modelsResponse.ok) {
                const models = await modelsResponse.json();
                console.log(`✅ ${name}: Valid (${models.models?.length || 0} models available)`);
                
                // Show available models
                if (models.models && models.models.length > 0) {
                    const modelNames = models.models
                        .filter(m => m.name.includes('gemini'))
                        .slice(0, 3)
                        .map(m => m.name.split('/').pop());
                    console.log(`   📋 Sample models: ${modelNames.join(', ')}`);
                }
            } else {
                const error = await modelsResponse.text();
                console.log(`❌ ${name}: Invalid (${modelsResponse.status})`);
                console.log(`   Error: ${error.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`❌ ${name}: Error - ${error.message}`);
        }
        
        console.log('');
    }
    
    // Test a simple generation with the primary key
    console.log('🧪 Testing text generation with primary key...');
    const primaryKey = process.env.GEMINI_API_KEY_REVO_1_0_PRIMARY;
    
    if (primaryKey) {
        try {
            const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${primaryKey}`;
            const payload = {
                contents: [{
                    parts: [{
                        text: "Say hello in one word"
                    }]
                }]
            };
            
            const response = await fetch(genUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No text generated';
                console.log(`✅ Generation successful: "${text.trim()}"`);
            } else {
                const error = await response.text();
                console.log(`❌ Generation failed: ${response.status}`);
                console.log(`Error: ${error}`);
            }
        } catch (error) {
            console.log(`❌ Generation error: ${error.message}`);
        }
    }
}

testGoogleAPIKeys();
