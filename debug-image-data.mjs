import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugImageData() {
    console.log('🔍 Debugging Image Data Flow...\n');

    const proxyUrl = process.env.AI_PROXY_URL || 'http://localhost:8000';
    const testUserId = 'debug-image-test';

    try {
        // Test direct proxy image generation to see raw response
        console.log('1. 🖼️ Testing direct proxy image generation...');
        const imageRequest = {
            prompt: 'Create a simple blue circle',
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
            console.log(`🤖 Model used: ${result.model_used}`);
            console.log(`🔧 Provider: ${result.provider_used}`);
            console.log(`💳 Credits remaining: ${result.user_credits}`);

            // Check the actual response structure
            console.log('📊 Full response structure:');
            console.log(JSON.stringify(result, null, 2));

            // Check the actual image data
            if (result.data) {
                console.log(`📊 Image data type: ${typeof result.data}`);

                if (typeof result.data === 'string') {
                    console.log(`📊 Image data length: ${result.data.length} characters`);
                    console.log(`📊 First 50 chars: ${result.data.substring(0, 50)}...`);
                    console.log(`📊 Last 50 chars: ...${result.data.substring(result.data.length - 50)}`);

                    // Check if it's valid base64
                    try {
                        const buffer = Buffer.from(result.data, 'base64');
                        console.log(`✅ Valid base64 data, buffer size: ${buffer.length} bytes`);

                        // Create data URL like genkit.ts does
                        const dataUrl = `data:image/png;base64,${result.data}`;
                        console.log(`📊 Data URL length: ${dataUrl.length} characters`);
                        console.log(`📊 Data URL prefix: ${dataUrl.substring(0, 50)}...`);

                        // Test if we can extract base64 data back
                        const extractedBase64 = dataUrl.split(',')[1];
                        console.log(`📊 Extracted base64 matches original: ${extractedBase64 === result.data}`);

                        // Test buffer creation like actions.ts does
                        const testBuffer = Buffer.from(extractedBase64, 'base64');
                        console.log(`📊 Test buffer size: ${testBuffer.length} bytes`);

                    } catch (error) {
                        console.log(`❌ Invalid base64 data: ${error.message}`);
                    }
                } else if (typeof result.data === 'object') {
                    console.log('📊 Image data is an object:');
                    console.log(JSON.stringify(result.data, null, 2));
                }
            } else {
                console.log('❌ No image data in response');
            }
        } else {
            const error = await imageResponse.text();
            console.log(`❌ Proxy request failed: ${imageResponse.status}`);
            console.log(`Error: ${error}`);
        }

        console.log('\n2. 🧪 Testing Creative Studio action with debug...');

        // Test Creative Studio action to see what happens
        const creativePayload = {
            prompt: 'Create a simple red square',
            outputType: 'image',
            referenceAssetUrl: null,
            useBrandProfile: false,
            brandProfile: null,
            maskDataUrl: null,
            aspectRatio: null,
            preferredModel: 'gemini-2.5-flash-image-preview'
        };

        const creativeResponse = await fetch('http://localhost:3001/api/test-creative-studio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(creativePayload)
        });

        if (creativeResponse.ok) {
            const result = await creativeResponse.json();
            console.log('✅ Creative Studio action completed');
            console.log(`📊 Has image URL: ${!!result.result.imageUrl}`);

            if (result.result.imageUrl) {
                console.log(`🖼️ Image URL: ${result.result.imageUrl}`);

                // Test if the URL is accessible
                const urlTest = await fetch(result.result.imageUrl, { method: 'HEAD' });
                console.log(`📊 URL accessible: ${urlTest.ok}`);
                console.log(`📊 Content-Length: ${urlTest.headers.get('content-length')}`);
                console.log(`📊 Content-Type: ${urlTest.headers.get('content-type')}`);
            }
        } else {
            const error = await creativeResponse.text();
            console.log(`❌ Creative Studio action failed: ${creativeResponse.status}`);
            console.log(`Error: ${error}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugImageData();
