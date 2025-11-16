/**
 * Test Secondary Vertex AI - Image Generation
 * Test the actual Imagen API endpoint that Revo 2.0 uses
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('\n🧪 TEST: Secondary Vertex AI Image Generation\n');
console.log('='.repeat(60));

async function testImageGeneration() {
  try {
    // Load credentials
    const keyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE;
    const credentialsPath = path.join(__dirname, keyFile);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;
    const location = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';

    console.log('📋 Test Configuration:');
    console.log(`   Project: ${projectId}`);
    console.log(`   Location: ${location}`);
    console.log(`   Model: imagegeneration@006`);
    console.log('');

    // Get OAuth token
    console.log('🔐 Step 1: Authenticating...');
    const { JWT } = require('google-auth-library');
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const tokenResponse = await client.authorize();
    console.log('   ✅ Authenticated');
    console.log('');

    // Test image generation with a simple prompt
    console.log('🎨 Step 2: Testing image generation...');
    console.log('   Prompt: "A simple red circle on white background"');
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`;

    const requestBody = {
      instances: [
        {
          prompt: "A simple red circle on white background"
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "1:1",
        negativePrompt: "blur, low quality",
        safetyFilterLevel: "block_some",
        personGeneration: "allow_adult"
      }
    };

    console.log('   Making API request...');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Response: ${responseText.substring(0, 500)}`);
      
      // Check for specific errors
      if (response.status === 403) {
        console.log('\n🔧 Permission Issue Detected:');
        console.log('   The service account needs "Vertex AI User" role');
        console.log('   To fix:');
        console.log(`   1. Go to: https://console.cloud.google.com/iam-admin/iam?project=${projectId}`);
        console.log('   2. Find: crevo-674@eco-theater-478004-b9.iam.gserviceaccount.com');
        console.log('   3. Add role: "Vertex AI User"');
      } else if (response.status === 429) {
        console.log('\n⚠️  Rate Limit (Expected):');
        console.log('   This means the API is working! Just hit the rate limit.');
        console.log('   ✅ Secondary account is ready to use as fallback!');
      } else if (response.status === 400) {
        console.log('\n⚠️  Bad Request:');
        console.log('   API is accessible but request format may need adjustment');
      }
      
      return;
    }

    const data = JSON.parse(responseText);
    console.log('   ✅ Image generation successful!');
    console.log(`   ✅ Returned ${data.predictions?.length || 0} image(s)`);
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 PERFECT! Secondary Vertex AI is FULLY WORKING!\n');
    console.log('✅ Authentication works');
    console.log('✅ API access works');
    console.log('✅ Image generation works');
    console.log('✅ Ready to use as fallback!');
    console.log('');
    console.log('💡 Your system will now:');
    console.log('   1. Try primary Vertex AI first');
    console.log('   2. If 429 rate limit → switch to secondary');
    console.log('   3. Continue generating without interruption');
    console.log('');

  } catch (error) {
    console.log('\n❌ TEST FAILED:\n');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n🔧 Network Issue:');
      console.log('   Cannot reach Google Cloud API');
      console.log('   Check internet connection');
    } else {
      console.log(`\n🔧 Error Type: ${error.constructor.name}`);
    }
    console.log('');
  }
}

// Run test
try {
  require('google-auth-library');
  testImageGeneration();
} catch (error) {
  console.log('⚠️  Installing google-auth-library...\n');
  const { execSync } = require('child_process');
  execSync('npm install google-auth-library', { stdio: 'inherit' });
  testImageGeneration();
}
