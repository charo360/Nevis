#!/usr/bin/env node

// Test script to verify Revo 2.0 generation functionality
require('dotenv').config({ path: '.env.local' });

async function testRevo2Generation() {
  console.log('🧪 Testing Revo 2.0 Generation Functionality...\n');

  try {
    // Import the Revo 2.0 service
    const { testRevo20Availability } = require('./src/ai/revo-2.0-service');
    
    console.log('📦 Revo 2.0 service imported successfully');
    
    // Test availability
    console.log('\n🔍 Testing Revo 2.0 availability...');
    const isAvailable = await testRevo20Availability();
    
    if (isAvailable) {
      console.log('✅ Revo 2.0 is available and working!');
    } else {
      console.log('❌ Revo 2.0 availability test failed');
      return;
    }
    
    // Test basic generation
    console.log('\n🎨 Testing basic generation...');
    const { generateWithRevo20 } = require('./src/ai/revo-2.0-service');
    
    const testOptions = {
      businessType: 'Restaurant',
      platform: 'Instagram',
      visualStyle: 'modern',
      imageText: 'Test Generation',
      brandProfile: {
        businessName: 'Test Restaurant',
        businessType: 'Restaurant',
        location: 'New York',
        colors: { primary: '#FF6B6B', secondary: '#4ECDC4' }
      },
      aspectRatio: '1:1',
      includePeopleInDesigns: false,
      useLocalLanguage: false
    };
    
    console.log('Generating with test options...');
    const result = await generateWithRevo20(testOptions);
    
    console.log('✅ Generation completed successfully!');
    console.log('Result summary:');
    console.log('- Model:', result.model);
    console.log('- Quality Score:', result.qualityScore);
    console.log('- Processing Time:', result.processingTime + 'ms');
    console.log('- Has Image:', !!result.imageUrl);
    console.log('- Has Caption:', !!result.caption);
    console.log('- Hashtags Count:', result.hashtags?.length || 0);
    
    console.log('\n🎉 All Revo 2.0 tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Error during Revo 2.0 testing:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testRevo2Generation();
