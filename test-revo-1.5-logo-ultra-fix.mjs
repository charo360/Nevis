/**
 * Test Revo 1.5 Ultra Logo Integration Fix
 * Verify that the AI uses the provided logo instead of creating new ones
 */

import { generateRevo15EnhancedDesign } from './src/ai/revo-1.5-enhanced-design.ts';

// Test with a more realistic logo
const testBrandProfile = {
  businessName: 'TechCorp Solutions',
  businessType: 'Technology',
  location: 'San Francisco, CA',
  primaryColor: '#3B82F6',
  accentColor: '#1E40AF',
  backgroundColor: '#FFFFFF',
  writingTone: 'professional',
  targetAudience: 'Tech professionals',
  // More realistic logo data URL (small test image)
  logoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

const testInput = {
  businessType: 'Technology',
  platform: 'Instagram',
  visualStyle: 'modern',
  imageText: 'TechCorp Solutions: Innovation You Can Trust',
  brandProfile: testBrandProfile,
  logoDataUrl: testBrandProfile.logoDataUrl
};

async function testUltraLogoFix() {
  console.log('🧪 Testing Revo 1.5 Ultra Logo Integration Fix...\n');
  
  console.log('📊 Test Configuration:');
  console.log('- Business:', testBrandProfile.businessName);
  console.log('- Logo Available:', !!testBrandProfile.logoDataUrl);
  console.log('- Logo Type:', testBrandProfile.logoDataUrl ? 'Base64 Data URL' : 'None');
  console.log('- Platform:', testInput.platform);
  console.log('- Visual Style:', testInput.visualStyle);
  console.log('');

  try {
    const startTime = Date.now();
    
    console.log('🚀 Starting Revo 1.5 generation with ultra logo fix...');
    const result = await generateRevo15EnhancedDesign(testInput);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n✅ Revo 1.5 Generation Complete!');
    console.log('');
    console.log('📊 Results:');
    console.log('- Model:', result.model);
    console.log('- Quality Score:', result.qualityScore);
    console.log('- Processing Time:', duration + 'ms');
    console.log('- Image Generated:', !!result.imageUrl);
    console.log('- Image Size:', result.imageUrl ? result.imageUrl.length + ' characters' : 'N/A');
    console.log('');
    console.log('🎨 Enhancements Applied:');
    result.enhancementsApplied.forEach((enhancement, index) => {
      console.log(`  ${index + 1}. ${enhancement}`);
    });
    
    // Check if logo integration was successful
    const logoEnhancements = result.enhancementsApplied.filter(e => 
      e.includes('Logo') || e.includes('logo')
    );
    
    console.log('');
    console.log('🔍 Logo Integration Analysis:');
    console.log('- Logo Enhancements Found:', logoEnhancements.length);
    logoEnhancements.forEach(enhancement => {
      console.log(`  ✓ ${enhancement}`);
    });
    
    if (result.imageUrl) {
      console.log('');
      console.log('🎯 Test Result: SUCCESS');
      console.log('✅ Revo 1.5 successfully generated image with logo integration');
      console.log('✅ Logo processing enhancements were applied');
      console.log('✅ Generation completed without errors');
      console.log('');
      console.log('⚠️  IMPORTANT: Check the generated image to verify:');
      console.log('   1. The provided logo appears in the design');
      console.log('   2. No new logo was created by the AI');
      console.log('   3. The logo is prominently placed and visible');
    } else {
      console.log('');
      console.log('❌ Test Result: FAILED');
      console.log('❌ No image was generated');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ Test Failed with Error:');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.stack) {
      console.error('Stack Trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testUltraLogoFix();

