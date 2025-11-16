/**
 * Test Vertex AI Secondary Fallback Configuration
 * This script verifies that the secondary Vertex AI credentials are properly configured
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing Vertex AI Secondary Fallback Configuration\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('Primary Vertex AI:');
console.log('  VERTEX_AI_ENABLED:', process.env.VERTEX_AI_ENABLED || '❌ NOT SET');
console.log('  VERTEX_AI_PROJECT_ID:', process.env.VERTEX_AI_PROJECT_ID || '❌ NOT SET');
console.log('  VERTEX_AI_LOCATION:', process.env.VERTEX_AI_LOCATION || '❌ NOT SET');
console.log('  VERTEX_AI_KEY_FILE:', process.env.VERTEX_AI_KEY_FILE || '❌ NOT SET');

console.log('\nSecondary Vertex AI:');
console.log('  VERTEX_AI_SECONDARY_ENABLED:', process.env.VERTEX_AI_SECONDARY_ENABLED || '❌ NOT SET');
console.log('  VERTEX_AI_SECONDARY_PROJECT_ID:', process.env.VERTEX_AI_SECONDARY_PROJECT_ID || '❌ NOT SET');
console.log('  VERTEX_AI_SECONDARY_LOCATION:', process.env.VERTEX_AI_SECONDARY_LOCATION || '❌ NOT SET');
console.log('  VERTEX_AI_SECONDARY_KEY_FILE:', process.env.VERTEX_AI_SECONDARY_KEY_FILE || '❌ NOT SET');

console.log('\nFallback Configuration:');
console.log('  VERTEX_FALLBACK_ENABLED:', process.env.VERTEX_FALLBACK_ENABLED || '❌ NOT SET');
console.log('  VERTEX_RETRY_ATTEMPTS:', process.env.VERTEX_RETRY_ATTEMPTS || 'default');
console.log('  VERTEX_RETRY_DELAY_MS:', process.env.VERTEX_RETRY_DELAY_MS || 'default');

// Check credential files
console.log('\n📁 Credential Files:');

if (process.env.VERTEX_AI_KEY_FILE) {
  const primaryPath = path.join(__dirname, process.env.VERTEX_AI_KEY_FILE);
  const primaryExists = fs.existsSync(primaryPath);
  console.log(`  Primary: ${process.env.VERTEX_AI_KEY_FILE}`);
  console.log(`    Status: ${primaryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (primaryExists) {
    try {
      const primaryCreds = JSON.parse(fs.readFileSync(primaryPath, 'utf8'));
      console.log(`    Project: ${primaryCreds.project_id}`);
      console.log(`    Email: ${primaryCreds.client_email}`);
    } catch (error) {
      console.log(`    ❌ Error reading file: ${error.message}`);
    }
  }
}

if (process.env.VERTEX_AI_SECONDARY_KEY_FILE) {
  const secondaryPath = path.join(__dirname, process.env.VERTEX_AI_SECONDARY_KEY_FILE);
  const secondaryExists = fs.existsSync(secondaryPath);
  console.log(`\n  Secondary: ${process.env.VERTEX_AI_SECONDARY_KEY_FILE}`);
  console.log(`    Status: ${secondaryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
  
  if (secondaryExists) {
    try {
      const secondaryCreds = JSON.parse(fs.readFileSync(secondaryPath, 'utf8'));
      console.log(`    Project: ${secondaryCreds.project_id}`);
      console.log(`    Email: ${secondaryCreds.client_email}`);
      console.log(`    ✅ Valid JSON format`);
    } catch (error) {
      console.log(`    ❌ Error reading file: ${error.message}`);
    }
  }
}

// Validation summary
console.log('\n' + '='.repeat(60));
console.log('📊 Configuration Summary:\n');

const checks = {
  'Secondary enabled': process.env.VERTEX_AI_SECONDARY_ENABLED === 'true',
  'Secondary project ID set': !!process.env.VERTEX_AI_SECONDARY_PROJECT_ID,
  'Secondary location set': !!process.env.VERTEX_AI_SECONDARY_LOCATION,
  'Secondary key file set': !!process.env.VERTEX_AI_SECONDARY_KEY_FILE,
  'Fallback enabled': process.env.VERTEX_FALLBACK_ENABLED === 'true',
};

if (process.env.VERTEX_AI_SECONDARY_KEY_FILE) {
  const secondaryPath = path.join(__dirname, process.env.VERTEX_AI_SECONDARY_KEY_FILE);
  checks['Secondary credentials file exists'] = fs.existsSync(secondaryPath);
  
  if (fs.existsSync(secondaryPath)) {
    try {
      const creds = JSON.parse(fs.readFileSync(secondaryPath, 'utf8'));
      checks['Credentials file is valid JSON'] = true;
      checks['Project ID matches'] = creds.project_id === process.env.VERTEX_AI_SECONDARY_PROJECT_ID;
    } catch {
      checks['Credentials file is valid JSON'] = false;
    }
  }
}

let allPassed = true;
for (const [check, passed] of Object.entries(checks)) {
  console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  if (!passed) allPassed = false;
}

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('🎉 SUCCESS! Secondary Vertex AI is properly configured!');
  console.log('\n📝 Next steps:');
  console.log('  1. Generate content in your app');
  console.log('  2. Watch for secondary fallback logs in the console');
  console.log('  3. When primary hits 429, secondary will activate automatically');
} else {
  console.log('⚠️  ISSUES FOUND! Please review the configuration above.');
  console.log('\n📝 To fix:');
  console.log('  1. Make sure all environment variables are set in .env.local');
  console.log('  2. Verify vertex-ai-secondary-credentials.json exists');
  console.log('  3. Check that project IDs match');
}

console.log('\n');
