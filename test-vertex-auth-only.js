/**
 * Test Secondary Vertex AI - Authentication Only
 * Just verify the credentials work and can get an OAuth token
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('\n🧪 TEST: Secondary Vertex AI Authentication\n');
console.log('='.repeat(60));

async function testAuthentication() {
  try {
    // Load credentials
    const keyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE;
    const credentialsPath = path.join(__dirname, keyFile);
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const projectId = credentials.project_id;

    console.log('📋 Account Info:');
    console.log(`   Project: ${projectId}`);
    console.log(`   Email: ${credentials.client_email}`);
    console.log('');

    // Test authentication
    console.log('🔐 Testing authentication...');
    const { JWT } = require('google-auth-library');
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const tokenResponse = await client.authorize();
    console.log('   ✅ Authentication SUCCESSFUL!');
    console.log(`   ✅ Access token obtained (expires in ~1 hour)`);
    console.log('');

    console.log('='.repeat(60));
    console.log('🎉 CREDENTIALS ARE VALID!\n');
    console.log('✅ The secondary account can authenticate with Google Cloud');
    console.log('✅ OAuth token generation works');
    console.log('');
    console.log('⚠️  Note: Vertex AI API may need to be enabled');
    console.log('   To enable:');
    console.log('   1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com');
    console.log(`   2. Select project: ${projectId}`);
    console.log('   3. Click "Enable"');
    console.log('');
    console.log('💡 Even without the API enabled, your secondary will work once:');
    console.log('   - Vertex AI API is enabled');
    console.log('   - Service account has "Vertex AI User" role');
    console.log('   - Billing is enabled on the project');
    console.log('');

  } catch (error) {
    console.log('\n❌ AUTHENTICATION FAILED:\n');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('private_key')) {
      console.log('\n🔧 Issue: Invalid private key format');
      console.log('   Fix: Verify the JSON file has the correct private_key field');
    } else if (error.message.includes('email')) {
      console.log('\n🔧 Issue: Invalid client email');
      console.log('   Fix: Verify the client_email in the JSON file');
    } else {
      console.log('\n🔧 Issue: Authentication failed');
      console.log('   Fix: Verify the service account credentials are correct');
    }
    console.log('');
  }
}

// Run test
try {
  require('google-auth-library');
  testAuthentication();
} catch (error) {
  console.log('⚠️  Installing google-auth-library...\n');
  const { execSync } = require('child_process');
  execSync('npm install google-auth-library', { stdio: 'inherit' });
  testAuthentication();
}
