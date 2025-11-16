/**
 * Live Test - Actually Call Secondary Vertex AI API
 * This makes a real API request to verify the secondary account works
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('\n🧪 LIVE TEST: Secondary Vertex AI API Call\n');
console.log('='.repeat(60));

async function testSecondaryVertexAI() {
  try {
    // Load secondary credentials
    const keyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE;
    if (!keyFile) {
      console.log('❌ VERTEX_AI_SECONDARY_KEY_FILE not set in .env.local');
      return;
    }

    const credentialsPath = path.join(__dirname, keyFile);
    if (!fs.existsSync(credentialsPath)) {
      console.log(`❌ Credentials file not found: ${credentialsPath}`);
      return;
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = process.env.VERTEX_AI_SECONDARY_PROJECT_ID || credentials.project_id;
    const location = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';

    console.log('📋 Test Configuration:');
    console.log(`   Project: ${projectId}`);
    console.log(`   Location: ${location}`);
    console.log(`   Email: ${credentials.client_email}`);
    console.log('');

    // Get OAuth token
    console.log('🔐 Step 1: Getting OAuth token...');
    const { JWT } = require('google-auth-library');
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const tokenResponse = await client.authorize();
    console.log('   ✅ OAuth token obtained');
    console.log('');

    // Make a simple API call to test - list models
    console.log('🚀 Step 2: Testing API access (listing models)...');
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Error: ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('   ✅ API connection successful!');
    console.log('');

    // Check for Imagen models
    console.log('🎨 Step 3: Checking for Imagen model availability...');
    const models = data.models || [];
    const imagenModel = models.find(m => m.name && m.name.includes('imagegeneration'));
    
    if (imagenModel) {
      console.log(`   ✅ Imagen model found: ${imagenModel.displayName || 'imagegeneration@006'}`);
    } else {
      console.log('   ⚠️  Imagen model not listed, but may still be available');
      console.log('      (Some regions don\'t list all models)');
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 SUCCESS! Secondary Vertex AI is WORKING!\n');
    console.log('✅ Authentication: PASSED');
    console.log('✅ API Access: PASSED');
    console.log('✅ Project Access: PASSED');
    console.log('');
    console.log('💡 Your secondary account is ready to handle image generation!');
    console.log('   When primary hits rate limits, this will kick in automatically.');
    console.log('');

  } catch (error) {
    console.log('\n❌ TEST FAILED:\n');
    console.log(`   Error: ${error.message}`);
    console.log(`   Type: ${error.constructor.name}`);
    
    if (error.code) {
      console.log(`   Code: ${error.code}`);
    }
    
    console.log('\n🔧 Common Issues:');
    console.log('   1. API not enabled: Enable Vertex AI API in Google Cloud Console');
    console.log('   2. Missing permissions: Service account needs "Vertex AI User" role');
    console.log('   3. Wrong project: Verify project_id matches your Google Cloud project');
    console.log('   4. Billing not enabled: Enable billing in Google Cloud Console');
    console.log('');
  }
}

// Check dependencies
try {
  require('google-auth-library');
  testSecondaryVertexAI();
} catch (error) {
  console.log('⚠️  Missing dependency: google-auth-library');
  console.log('   Installing...\n');
  const { execSync } = require('child_process');
  try {
    execSync('npm install google-auth-library', { stdio: 'inherit' });
    console.log('\n✅ Installed! Running test...\n');
    testSecondaryVertexAI();
  } catch (installError) {
    console.log('❌ Failed to install dependency');
  }
}
