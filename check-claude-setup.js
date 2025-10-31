/**
 * Claude API Setup Checker
 * Helps verify and guide Claude API setup
 */

const fs = require('fs');
const path = require('path');

function checkClaudeSetup() {
  console.log('🔍 Checking Claude API Setup...\n');

  // Check 1: Environment variable
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey) {
    console.log('✅ ANTHROPIC_API_KEY found in environment');
    console.log(`🔑 Key preview: ${envKey.substring(0, 8)}...${envKey.substring(envKey.length - 4)}`);
    return true;
  }

  console.log('❌ ANTHROPIC_API_KEY not found in environment\n');

  // Check 2: .env.local file
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    console.log('📁 Found .env.local file');
    try {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      if (envContent.includes('ANTHROPIC_API_KEY')) {
        console.log('⚠️  ANTHROPIC_API_KEY found in .env.local but not loaded');
        console.log('💡 Solution: Restart your development server to load the new environment variable');
      } else {
        console.log('❌ ANTHROPIC_API_KEY not found in .env.local');
        console.log('\n📝 To add it, append this line to your .env.local file:');
        console.log('ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here');
      }
    } catch (error) {
      console.log('⚠️  Could not read .env.local file');
    }
  } else {
    console.log('❌ .env.local file not found');
    console.log('\n📝 Create .env.local file with:');
    console.log('ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here');
  }

  // Check 3: Anthropic SDK
  try {
    require('@anthropic-ai/sdk');
    console.log('\n✅ @anthropic-ai/sdk package is installed');
  } catch (error) {
    console.log('\n❌ @anthropic-ai/sdk package not found');
    console.log('💡 Install it with: npm install @anthropic-ai/sdk');
    return false;
  }

  console.log('\n🔧 Setup Instructions:');
  console.log('1. Get your API key from: https://console.anthropic.com/');
  console.log('2. Add ANTHROPIC_API_KEY=your-key to .env.local');
  console.log('3. Restart your development server');
  console.log('4. Run: node test-claude-simple.js');

  return false;
}

function showCurrentStatus() {
  console.log('📊 Current Environment Status:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   Working Directory: ${process.cwd()}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Check other API keys for context
  const otherKeys = [
    'GEMINI_API_KEY',
    'GEMINI_API_KEY_REVO_2_0',
    'OPENROUTER_API_KEY',
    'VERTEX_AI_ENABLED'
  ];

  console.log('\n🔑 Other API Keys Status:');
  otherKeys.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`   ✅ ${key}: ${value.substring(0, 8)}...${value.substring(value.length - 4)}`);
    } else {
      console.log(`   ❌ ${key}: Not set`);
    }
  });
}

// Run the check
console.log('🚀 Claude API Setup Checker\n');
showCurrentStatus();
console.log('\n' + '='.repeat(50) + '\n');

const isSetup = checkClaudeSetup();

if (isSetup) {
  console.log('\n🎉 Claude API is ready!');
  console.log('🧪 Run: node test-claude-simple.js');
} else {
  console.log('\n⚠️  Claude API setup incomplete');
  console.log('📖 See: setup-claude-api.md for detailed instructions');
}
