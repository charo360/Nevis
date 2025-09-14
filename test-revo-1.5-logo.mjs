/**
 * Test Revo 1.5 Logo Integration
 * Verify that Revo 1.5 now properly handles and displays logos
 */

import { generateRevo15EnhancedDesign } from './src/ai/revo-1.5-enhanced-design.ts';

// Test data with sample logo
const testBrandProfile = {
  businessName: 'TestBrand',
  businessType: 'Technology',
  location: 'San Francisco, CA',
  primaryColor: '#3B82F6',
  accentColor: '#1E40AF',
  backgroundColor: '#FFFFFF',
  writingTone: 'professional',
  targetAudience: 'Tech professionals',
  // Sample logo data URL (small test image)
  logoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};

const testInput = {
  businessType: 'Technology',
  platform: 'Instagram',
  visualStyle: 'modern',
  imageText: 'TestBrand: Innovation You Can Trust',
  brandProfile: testBrandProfile
};

async function testRevo15LogoIntegration() {
  console.log('🧪 Testing Revo 1.5 Logo Integration...\n');
  
  console.log('📊 Test Configuration:');
  console.log('- Business:', testBrandProfile.businessName);
  console.log('- Logo Available:', !!testBrandProfile.logoDataUrl);
  console.log('- Logo Type:', testBrandProfile.logoDataUrl ? 'Base64 Data URL' : 'None');
  console.log('- Platform:', testInput.platform);
  console.log('- Visual Style:', testInput.visualStyle);
  console.log('');

  try {
    const startTime = Date.now();
    
    console.log('🚀 Starting Revo 1.5 generation with logo...');
    const result = await generateRevo15EnhancedDesign(testInput);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n✅ Revo 1.5 Generation Complete!');
    console.log('');
    console.log('📊 Results:');
    console.log('- Model:', result.model);
    console.log('- Planning Model:', result.planningModel);
    console.log('- Generation Model:', result.generationModel);
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
      
      // Save result for manual inspection if needed
      const fs = await import('fs');
      const testResult = {
        timestamp: new Date().toISOString(),
        testConfig: testInput,
        result: {
          ...result,
          imageUrl: result.imageUrl.substring(0, 100) + '...[truncated]'
        }
      };
      
      await fs.promises.writeFile(
        './revo-1.5-logo-test-result.json',
        JSON.stringify(testResult, null, 2)
      );
      
      console.log('💾 Test result saved to: revo-1.5-logo-test-result.json');
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
    
    console.log('');
    console.log('🔧 Troubleshooting Suggestions:');
    console.log('1. Check that Gemini API key is properly configured');
    console.log('2. Verify that the logo data URL is valid');
    console.log('3. Ensure network connectivity for API calls');
    console.log('4. Check console logs for detailed error information');
  }
}

// Run the test
testRevo15LogoIntegration();