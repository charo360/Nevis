/**
 * Simple Import Test for Revo 1.0
 */

console.log('🧪 Testing Revo 1.0 Import...\n');

// Test 1: Check if files exist
console.log('📋 Test 1: File Existence');
try {
  const fs = require('fs');
  
  const files = [
    'Nevis/src/ai/revo-1.0-service.ts',
    'Nevis/src/ai/models/versions/revo-1.0/index.ts',
    'Nevis/src/ai/models/versions/revo-1.0/content-generator.ts',
    'Nevis/src/ai/models/versions/revo-1.0/design-generator.ts',
    'Nevis/src/ai/models/config/model-configs.ts'
  ];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  });
  
} catch (error) {
  console.log('❌ File check failed:', error.message);
}

console.log('');

// Test 2: Check for syntax errors in key files
console.log('🔧 Test 2: Syntax Check');
try {
  const fs = require('fs');
  
  // Check Revo 1.0 service
  const servicePath = 'Nevis/src/ai/revo-1.0-service.ts';
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for basic syntax patterns
    if (content.includes('export async function generateRevo10Content')) {
      console.log('✅ Revo 1.0 service: Basic syntax looks good');
    } else {
      console.log('❌ Revo 1.0 service: Missing expected function');
    }
    
    if (content.includes('gemini-2.5-flash-image-preview')) {
      console.log('✅ Revo 1.0 service: Uses correct AI model');
    } else {
      console.log('❌ Revo 1.0 service: Wrong AI model');
    }
  }
  
  // Check content generator
  const contentPath = 'Nevis/src/ai/models/versions/revo-1.0/content-generator.ts';
  if (fs.existsSync(contentPath)) {
    const content = fs.readFileSync(contentPath, 'utf8');
    
    if (content.includes('import { generateRevo10Content }')) {
      console.log('✅ Content generator: Imports service correctly');
    } else {
      console.log('❌ Content generator: Import issue');
    }
  }
  
} catch (error) {
  console.log('❌ Syntax check failed:', error.message);
}

console.log('');

// Test 3: Check configuration
console.log('⚙️ Test 3: Configuration Check');
try {
  const fs = require('fs');
  const configPath = 'Nevis/src/ai/models/config/model-configs.ts';
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Check if Revo 1.0 config exists
    if (content.includes("'revo-1.0': {")) {
      console.log('✅ Config: Revo 1.0 configuration exists');
    } else {
      console.log('❌ Config: Revo 1.0 configuration missing');
    }
    
    // Check if it uses the correct base config
    if (content.includes("config: baseConfigs['gemini-2.5-flash-image']")) {
      console.log('✅ Config: Uses correct base config');
    } else {
      console.log('❌ Config: Wrong base config');
    }
    
    // Check for base configs
    if (content.includes("'gemini-2.5-flash-image': {")) {
      console.log('✅ Config: Base config exists');
    } else {
      console.log('❌ Config: Base config missing');
    }
  }
  
} catch (error) {
  console.log('❌ Configuration check failed:', error.message);
}

console.log('\n🎯 Import Test Summary');
console.log('========================');
console.log('All tests completed. Check the results above.');
console.log('\nIf all tests pass, the issue might be:');
console.log('1. Runtime import errors');
console.log('2. Missing dependencies');
console.log('3. Environment variable issues');
console.log('4. TypeScript compilation errors');
console.log('\n🚀 Import testing complete!');

