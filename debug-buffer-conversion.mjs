import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugBufferConversion() {
    console.log('🔍 Debugging Buffer Conversion...\n');

    const proxyUrl = process.env.AI_PROXY_URL || 'http://localhost:8000';
    const testUserId = 'debug-buffer-test';

    try {
        // Test direct proxy image generation
        console.log('1. 🖼️ Testing direct proxy image generation...');
        const imageRequest = {
            prompt: 'Create a simple red circle',
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
            console.log('✅ Proxy response received');
            console.log('📊 Full response structure:');
            console.log(JSON.stringify(result, null, 2));
            console.log(`📊 Image data type: ${typeof result.data}`);
            if (typeof result.data === 'string') {
                console.log(`📊 Image data length: ${result.data.length} characters`);
            } else {
                console.log('📊 Image data is not a string, investigating structure...');
            }

            // Test data URL creation like genkit.ts does
            const dataUrl = `data:image/png;base64,${result.data}`;
            console.log(`📊 Data URL length: ${dataUrl.length} characters`);
            console.log(`📊 Data URL starts with: ${dataUrl.substring(0, 50)}...`);

            // Test buffer creation like actions.ts does
            const base64Data = dataUrl.split(',')[1];
            console.log(`📊 Extracted base64 length: ${base64Data.length} characters`);
            console.log(`📊 Base64 matches original: ${base64Data === result.data}`);

            const imageBuffer = Buffer.from(base64Data, 'base64');
            console.log(`📊 Buffer size: ${imageBuffer.length} bytes`);

            // Save buffer to file to test if it's valid
            const testFilename = `test-image-${Date.now()}.png`;
            fs.writeFileSync(testFilename, imageBuffer);
            console.log(`💾 Saved test image to: ${testFilename}`);

            // Check file size
            const stats = fs.statSync(testFilename);
            console.log(`📊 File size on disk: ${stats.size} bytes`);

            if (stats.size > 100) {
                console.log('✅ Buffer conversion appears to be working correctly');
            } else {
                console.log('❌ Buffer conversion may have issues - file too small');
            }

            // Clean up
            fs.unlinkSync(testFilename);
            console.log('🧹 Cleaned up test file');

        } else {
            const error = await imageResponse.text();
            console.log(`❌ Proxy request failed: ${imageResponse.status}`);
            console.log(`Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugBufferConversion();
