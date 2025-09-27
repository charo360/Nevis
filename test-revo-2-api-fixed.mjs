#!/usr/bin/env node

// Test the fixed Revo 2.0 API endpoint
import fetch from 'node-fetch';

const testBrandProfile = {
  businessName: 'Test Restaurant',
  businessType: 'Restaurant',
  location: 'New York, NY',
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4'
  },
  visualStyle: 'modern'
};

async function testRevo2API() {
  console.log('🧪 Testing Fixed Revo 2.0 API...\n');

  try {
    console.log('📡 Making API request to http://localhost:3001/api/generate-revo-2.0');
    
    const response = await fetch('http://localhost:3001/api/generate-revo-2.0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessType: testBrandProfile.businessType,
        platform: 'Instagram',
        brandProfile: testBrandProfile,
        visualStyle: 'modern',
        imageText: 'Test Generation',
        aspectRatio: '1:1',
        includePeopleInDesigns: false,
        useLocalLanguage: false,
        includeContacts: false
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ API Response received successfully!');
    console.log('\n=== RESULT SUMMARY ===');
    console.log('Success:', result.success);
    console.log('Model:', result.model);
    console.log('Quality Score:', result.qualityScore);
    console.log('Processing Time:', result.processingTime + 'ms');
    console.log('Has Image:', !!result.imageUrl);
    console.log('Has Caption:', !!result.caption);
    console.log('Hashtags Count:', result.hashtags?.length || 0);
    console.log('Enhancements Applied:', result.enhancementsApplied?.length || 0);
    
    if (result.caption) {
      console.log('\n=== GENERATED CAPTION ===');
      console.log(result.caption);
    }
    
    if (result.hashtags && result.hashtags.length > 0) {
      console.log('\n=== GENERATED HASHTAGS ===');
      console.log(result.hashtags.join(' '));
    }
    
    console.log('\n🎉 Revo 2.0 API test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the development server is running on port 3001');
      console.error('   Run: npm run dev');
    }
  }
}

testRevo2API();
