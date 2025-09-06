/**
 * Test Revo 1.0 Service with Gemini 2.5 Flash Image Preview
 */

console.log('🧪 Testing Revo 1.0 Service Upgrade...\n');

// Test 1: Check if the new service file exists
console.log('📋 Test 1: Service File Creation');
try {
  const fs = require('fs');
  const servicePath = 'Nevis/src/ai/revo-1.0-service.ts';
  
  if (fs.existsSync(servicePath)) {
    console.log('✅ Revo 1.0 Service: Successfully created');
    
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check if it uses the correct model
    if (serviceContent.includes('gemini-2.5-flash-image-preview')) {
      console.log('✅ AI Model: Successfully uses Gemini 2.5 Flash Image Preview');
    } else {
      console.log('❌ AI Model: Still using old model');
    }
    
    // Check if it has the correct functions
    if (serviceContent.includes('generateRevo10Content')) {
      console.log('✅ Content Generation: Function available');
    } else {
      console.log('❌ Content Generation: Function missing');
    }
    
    if (serviceContent.includes('generateRevo10Design')) {
      console.log('✅ Design Generation: Function available');
    } else {
      console.log('❌ Design Generation: Function missing');
    }
    
    if (serviceContent.includes('generateRevo10Image')) {
      console.log('✅ Image Generation: Function available');
    } else {
      console.log('❌ Image Generation: Function missing');
    }
    
  } else {
    console.log('❌ Revo 1.0 Service: File not found');
  }
} catch (error) {
  console.log('❌ Service file test failed:', error.message);
}

console.log('');

// Test 2: Check if generators are updated
console.log('🔧 Test 2: Generator Updates');
try {
  const fs = require('fs');
  
  // Check content generator
  const contentPath = 'Nevis/src/ai/models/versions/revo-1.0/content-generator.ts';
  const contentContent = fs.readFileSync(contentPath, 'utf8');
  
  if (contentContent.includes('generateRevo10Content')) {
    console.log('✅ Content Generator: Successfully updated to use new service');
  } else {
    console.log('❌ Content Generator: Still using old flow');
  }
  
  // Check design generator
  const designPath = 'Nevis/src/ai/models/versions/revo-1.0/design-generator.ts';
  const designContent = fs.readFileSync(designPath, 'utf8');
  
  if (designContent.includes('generateRevo10Design')) {
    console.log('✅ Design Generator: Successfully updated to use new service');
  } else {
    console.log('❌ Design Generator: Still using old flow');
  }
  
} catch (error) {
  console.log('❌ Generator update test failed:', error.message);
}

console.log('');

// Test 3: Check configuration fixes
console.log('⚙️ Test 3: Configuration Fixes');
try {
  const fs = require('fs');
  const configPath = 'Nevis/src/ai/models/config/model-configs.ts';
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check for duplicate entries
  const revo20Count = (configContent.match(/revo-2\.0.*{/g) || []).length;
  if (revo20Count === 1) {
    console.log('✅ Revo 2.0: Duplicate entries removed');
  } else {
    console.log(`❌ Revo 2.0: Found ${revo20Count} entries (should be 1)`);
  }
  
  // Check base configs
  const geminiFlashCount = (configContent.match(/gemini-2\.5-flash-image.*{/g) || []).length;
  if (geminiFlashCount === 1) {
    console.log('✅ Base Configs: Duplicate entries removed');
  } else {
    console.log(`❌ Base Configs: Found ${geminiFlashCount} entries (should be 1)`);
  }
  
} catch (error) {
  console.log('❌ Configuration test failed:', error.message);
}

console.log('\n🎯 Service Test Summary');
console.log('========================');
console.log('All tests completed. Check the results above to verify the service upgrade.');
console.log('\nNext steps:');
console.log('1. Restart the development server');
console.log('2. Test Revo 1.0 generation in the application');
console.log('3. Check console logs for "Gemini 2.5 Flash Image Preview" messages');
console.log('4. Verify enhanced quality and 2048x2048 resolution support');
console.log('\n🚀 Revo 1.0 Service upgrade testing complete!');

