/**
 * Direct Test of Revo 1.0 Service with Gemini 2.5 Flash Image Preview
 */

console.log('🧪 Direct Testing of Revo 1.0 Service...\n');

// Test 1: Check if the service file exists and has correct content
console.log('📋 Test 1: Service File Verification');
try {
  const fs = require('fs');
  const servicePath = 'Nevis/src/ai/revo-1.0-service.ts';
  
  if (fs.existsSync(servicePath)) {
    console.log('✅ Revo 1.0 Service: File exists');
    
    const serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check for Gemini 2.5 Flash Image Preview
    if (serviceContent.includes('gemini-2.5-flash-image-preview')) {
      console.log('✅ AI Model: Uses Gemini 2.5 Flash Image Preview');
    } else {
      console.log('❌ AI Model: Missing Gemini 2.5 Flash Image Preview');
    }
    
    // Check for the correct functions
    if (serviceContent.includes('generateRevo10Content')) {
      console.log('✅ Function: generateRevo10Content available');
    } else {
      console.log('❌ Function: generateRevo10Content missing');
    }
    
    if (serviceContent.includes('generateRevo10Design')) {
      console.log('✅ Function: generateRevo10Design available');
    } else {
      console.log('❌ Function: generateRevo10Design missing');
    }
    
  } else {
    console.log('❌ Revo 1.0 Service: File not found');
  }
} catch (error) {
  console.log('❌ Service verification failed:', error.message);
}

console.log('');

// Test 2: Check if actions.ts has been updated
console.log('🔧 Test 2: Actions File Update');
try {
  const fs = require('fs');
  const actionsPath = 'Nevis/src/app/actions.ts';
  
  if (fs.existsSync(actionsPath)) {
    const actionsContent = fs.readFileSync(actionsPath, 'utf8');
    
    // Check if it imports modelRegistry instead of generatePostFromProfileFlow
    if (actionsContent.includes('import { modelRegistry }')) {
      console.log('✅ Import: Successfully imports modelRegistry');
    } else {
      console.log('❌ Import: Still imports generatePostFromProfileFlow');
    }
    
    // Check if it uses the model registry
    if (actionsContent.includes('modelRegistry.getModel(\'revo-1.0\')')) {
      console.log('✅ Usage: Successfully uses modelRegistry.getModel');
    } else {
      console.log('❌ Usage: Still uses generatePostFromProfileFlow');
    }
    
    // Check if it calls the content generator
    if (actionsContent.includes('revo10Model.contentGenerator.generateContent')) {
      console.log('✅ Call: Successfully calls content generator');
    } else {
      console.log('❌ Call: Missing content generator call');
    }
    
  } else {
    console.log('❌ Actions file not found');
  }
} catch (error) {
  console.log('❌ Actions verification failed:', error.message);
}

console.log('');

// Test 3: Check if generators are properly updated
console.log('⚙️ Test 3: Generator Updates');
try {
  const fs = require('fs');
  
  // Check content generator
  const contentPath = 'Nevis/src/ai/models/versions/revo-1.0/content-generator.ts';
  const contentContent = fs.readFileSync(contentPath, 'utf8');
  
  if (contentContent.includes('generateRevo10Content')) {
    console.log('✅ Content Generator: Uses new service');
  } else {
    console.log('❌ Content Generator: Still uses old flow');
  }
  
  // Check design generator
  const designPath = 'Nevis/src/ai/models/versions/revo-1.0/design-generator.ts';
  const designContent = fs.readFileSync(designPath, 'utf8');
  
  if (designContent.includes('generateRevo10Design')) {
    console.log('✅ Design Generator: Uses new service');
  } else {
    console.log('❌ Design Generator: Still uses old flow');
  }
  
} catch (error) {
  console.log('❌ Generator verification failed:', error.message);
}

console.log('');

// Test 4: Check configuration
console.log('🔧 Test 4: Configuration Verification');
try {
  const fs = require('fs');
  const configPath = 'Nevis/src/ai/models/config/model-configs.ts';
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check if Revo 1.0 uses the correct base config
  if (configContent.includes("config: baseConfigs['gemini-2.5-flash-image']")) {
    console.log('✅ Config: Revo 1.0 uses correct base config');
  } else {
    console.log('❌ Config: Revo 1.0 uses wrong base config');
  }
  
  // Check for duplicate entries
  const revo20Count = (configContent.match(/revo-2\.0.*{/g) || []).length;
  if (revo20Count === 1) {
    console.log('✅ Config: No duplicate Revo 2.0 entries');
  } else {
    console.log(`❌ Config: Found ${revo20Count} Revo 2.0 entries (should be 1)`);
  }
  
} catch (error) {
  console.log('❌ Configuration verification failed:', error.message);
}

console.log('\n🎯 Direct Test Summary');
console.log('========================');
console.log('All tests completed. Check the results above.');
console.log('\nKey Points:');
console.log('1. ✅ Revo 1.0 service should use Gemini 2.5 Flash Image Preview');
console.log('2. ✅ Actions should use modelRegistry instead of direct flow');
console.log('3. ✅ Generators should call new service functions');
console.log('4. ✅ Configuration should point to correct base config');
console.log('\nNext Steps:');
console.log('1. Restart the development server');
console.log('2. Test content generation in the app');
console.log('3. Check console for "Gemini 2.5 Flash Image Preview" messages');
console.log('\n🚀 Direct testing complete!');

