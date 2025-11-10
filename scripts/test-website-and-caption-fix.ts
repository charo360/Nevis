/**
 * Test script to verify website URL and caption fixes
 * Tests that the system uses correct website URL and doesn't put caption text on image
 */

import { generateWithRevo20 } from '../src/ai/revo-2.0-service';

async function testWebsiteAndCaptionFix() {
  console.log('🧪 Testing Website URL and Caption Display Fixes\n');

  // Test with a brand profile that has a specific website URL
  const testBrandProfile = {
    id: 'test-website-fix',
    businessName: 'Samaki Cookies',
    businessType: 'food',
    description: 'Fish-based cookies for nutrition in Kenya',
    
    // Specific website URL that should be used
    websiteUrl: 'https://realsamakicookies.co.ke',
    
    // Contact information
    contactInfo: {
      phone: '+254 701 234 567',
      email: 'hello@realsamakicookies.co.ke',
      address: 'Kilifi County, Kenya'
    },
    
    // Brand colors
    primaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    backgroundColor: '#F8FAFC'
  };

  console.log('📋 Test Brand Profile:');
  console.log('  Business:', testBrandProfile.businessName);
  console.log('  Website URL:', testBrandProfile.websiteUrl);
  console.log('  Phone:', testBrandProfile.contactInfo.phone);
  console.log('  Email:', testBrandProfile.contactInfo.email);

  console.log('\n🚀 Generating content with Revo 2.0...');

  try {
    const result = await generateWithRevo20({
      brandProfile: testBrandProfile,
      platform: 'instagram',
      aspectRatio: '1:1',
      includeContacts: true,
      useLocalLanguage: false
    });

    console.log('\n✅ Generation completed successfully!');
    console.log('\n📝 Generated Content:');
    console.log('  Headline:', result.headline);
    console.log('  Subheadline:', result.subheadline);
    console.log('  Caption:', result.caption);
    console.log('  CTA:', result.cta);
    console.log('  Hashtags:', result.hashtags);

    console.log('\n🖼️ Image Generated:', result.imageUrl ? '✅ Yes' : '❌ No');
    console.log('  Processing Time:', result.processingTime + 'ms');
    console.log('  Model:', result.model);

    // Check if the generated content looks correct
    const hasBusinessSpecificContent = 
      result.headline.toLowerCase().includes('samaki') ||
      result.headline.toLowerCase().includes('fish') ||
      result.headline.toLowerCase().includes('cookies') ||
      result.caption.toLowerCase().includes('samaki') ||
      result.caption.toLowerCase().includes('fish') ||
      result.caption.toLowerCase().includes('nutrition');

    const hasNoGenericLanguage = 
      !result.headline.toLowerCase().includes('fuel your') &&
      !result.caption.toLowerCase().includes('fuel your') &&
      !result.headline.toLowerCase().includes('boost your') &&
      !result.caption.toLowerCase().includes('boost your');

    console.log('\n🎯 Content Quality Check:');
    console.log('  Business-Specific Content:', hasBusinessSpecificContent ? '✅ PASS' : '❌ FAIL');
    console.log('  No Generic Language:', hasNoGenericLanguage ? '✅ PASS' : '❌ FAIL');

    console.log('\n📞 Expected Contact Information in Footer:');
    console.log('  Phone: 📞 +254 701 234 567');
    console.log('  Email: 📧 hello@realsamakicookies.co.ke');
    console.log('  Website: 🌐 www.realsamakicookies.co.ke');

    console.log('\n🎨 Expected Image Content:');
    console.log('  ✅ Should include: Headline, Subheadline, CTA');
    console.log('  ❌ Should NOT include: Caption text on the image');
    console.log('  📞 Should include: Contact footer with correct website');

    console.log('\n🔍 What to Check in Generated Image:');
    console.log('  1. Footer shows "www.realsamakicookies.co.ke" (NOT www.samakicookies.com)');
    console.log('  2. No caption text visible on the image itself');
    console.log('  3. Only headline, subheadline, and CTA are displayed as text');
    console.log('  4. Contact footer uses the correct phone and email');

    if (result.imageUrl) {
      console.log('\n🖼️ Generated Image URL:');
      console.log('  ', result.imageUrl);
      console.log('\n👀 Please check the image to verify:');
      console.log('  - Website URL is correct in footer');
      console.log('  - Caption text is NOT displayed on image');
      console.log('  - Only headline, subheadline, CTA are shown');
    }

    // Summary
    const overallSuccess = hasBusinessSpecificContent && hasNoGenericLanguage;
    console.log('\n🎯 OVERALL RESULT:');
    console.log('  Content Generation:', overallSuccess ? '🎉 SUCCESS' : '❌ FAILED');
    console.log('  Next Step: Check generated image for website URL and caption display');

  } catch (error) {
    console.error('❌ Generation failed:', error);
    console.log('\n🔧 Error Details:');
    console.log('  ', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the test
testWebsiteAndCaptionFix().catch(console.error);
