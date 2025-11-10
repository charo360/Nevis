/**
 * Test script to verify dynamic contact information usage
 * Tests that the system uses actual brand profile contact info instead of hardcoded values
 */

import { BusinessProfileManager } from '../src/ai/intelligence/business-profile-manager';

async function testDynamicContactInfo() {
  console.log('🧪 Testing Dynamic Contact Information Usage\n');

  const profileManager = new BusinessProfileManager();

  // Test 1: Brand profile with custom contact info
  console.log('📋 Test 1: Custom Contact Information');
  const customBrandProfile = {
    id: 'test-samaki-cookies',
    businessName: 'Samaki Cookies',
    businessType: 'food',
    description: 'Fish-based cookies for nutrition',
    
    // Custom contact information that should be used
    contactInfo: {
      phone: '+254 700 123 456',  // Different from hardcoded
      email: 'orders@customsamaki.com',  // Different from hardcoded
      website: 'www.customsamaki.com',  // Different from hardcoded
      address: 'Mombasa County, Kenya'  // Different from hardcoded
    },
    
    // Custom brand colors that should be used
    primaryColor: '#FF5722',  // Different from hardcoded
    accentColor: '#4CAF50',   // Different from hardcoded
    backgroundColor: '#FAFAFA'  // Different from hardcoded
  };

  const customProfile = await profileManager.getBusinessProfile(customBrandProfile);
  
  console.log('📞 Contact Info Results:');
  console.log('  Phone:', customProfile.contactInfo?.phone);
  console.log('  Email:', customProfile.contactInfo?.email);
  console.log('  Website:', customProfile.contactInfo?.website);
  console.log('  Address:', customProfile.contactInfo?.address);
  
  console.log('\n🎨 Brand Colors Results:');
  console.log('  Primary:', customProfile.primaryColor);
  console.log('  Accent:', customProfile.accentColor);
  console.log('  Background:', customProfile.backgroundColor);

  // Verify custom values are used
  const contactMatches = 
    customProfile.contactInfo?.phone === '+254 700 123 456' &&
    customProfile.contactInfo?.email === 'orders@customsamaki.com' &&
    customProfile.contactInfo?.website === 'www.customsamaki.com' &&
    customProfile.contactInfo?.address === 'Mombasa County, Kenya';

  const colorsMatch = 
    customProfile.primaryColor === '#FF5722' &&
    customProfile.accentColor === '#4CAF50' &&
    customProfile.backgroundColor === '#FAFAFA';

  console.log('\n✅ Test 1 Results:');
  console.log('  Contact Info Uses Custom Values:', contactMatches ? '✅ PASS' : '❌ FAIL');
  console.log('  Brand Colors Use Custom Values:', colorsMatch ? '✅ PASS' : '❌ FAIL');

  // Test 2: Brand profile with partial contact info (should use fallbacks)
  console.log('\n📋 Test 2: Partial Contact Information (Fallback Test)');
  const partialBrandProfile = {
    id: 'test-samaki-partial',
    businessName: 'Samaki Cookies',
    businessType: 'food',
    description: 'Fish-based cookies for nutrition',
    
    // Only partial contact information
    contactInfo: {
      phone: '+254 800 999 888',  // Only phone provided
      // email, website, address should fallback to predefined values
    },
    
    // Only partial brand colors
    primaryColor: '#9C27B0'  // Only primary color provided
    // accentColor and backgroundColor should fallback to predefined values
  };

  const partialProfile = await profileManager.getBusinessProfile(partialBrandProfile);
  
  console.log('📞 Partial Contact Info Results:');
  console.log('  Phone (custom):', partialProfile.contactInfo?.phone);
  console.log('  Email (fallback):', partialProfile.contactInfo?.email);
  console.log('  Website (fallback):', partialProfile.contactInfo?.website);
  console.log('  Address (fallback):', partialProfile.contactInfo?.address);
  
  console.log('\n🎨 Partial Brand Colors Results:');
  console.log('  Primary (custom):', partialProfile.primaryColor);
  console.log('  Accent (fallback):', partialProfile.accentColor);
  console.log('  Background (fallback):', partialProfile.backgroundColor);

  // Verify partial values work correctly
  const partialContactCorrect = 
    partialProfile.contactInfo?.phone === '+254 800 999 888' &&  // Custom
    partialProfile.contactInfo?.email === 'info@samakicookies.co.ke' &&  // Fallback
    partialProfile.contactInfo?.website === 'www.samakicookies.co.ke' &&  // Fallback
    partialProfile.contactInfo?.address === 'Kilifi County, Kenya';  // Fallback

  const partialColorsCorrect = 
    partialProfile.primaryColor === '#9C27B0' &&  // Custom
    partialProfile.accentColor === '#F59E0B' &&  // Fallback
    partialProfile.backgroundColor === '#F8FAFC';  // Fallback

  console.log('\n✅ Test 2 Results:');
  console.log('  Partial Contact Info Correct:', partialContactCorrect ? '✅ PASS' : '❌ FAIL');
  console.log('  Partial Brand Colors Correct:', partialColorsCorrect ? '✅ PASS' : '❌ FAIL');

  // Test 3: Brand profile with no contact info (should use all fallbacks)
  console.log('\n📋 Test 3: No Contact Information (Full Fallback Test)');
  const noBrandProfile = {
    id: 'test-samaki-none',
    businessName: 'Samaki Cookies',
    businessType: 'food',
    description: 'Fish-based cookies for nutrition'
    // No contact info or colors provided
  };

  const noContactProfile = await profileManager.getBusinessProfile(noBrandProfile);
  
  console.log('📞 No Contact Info Results (All Fallbacks):');
  console.log('  Phone:', noContactProfile.contactInfo?.phone);
  console.log('  Email:', noContactProfile.contactInfo?.email);
  console.log('  Website:', noContactProfile.contactInfo?.website);
  console.log('  Address:', noContactProfile.contactInfo?.address);
  
  console.log('\n🎨 No Brand Colors Results (All Fallbacks):');
  console.log('  Primary:', noContactProfile.primaryColor);
  console.log('  Accent:', noContactProfile.accentColor);
  console.log('  Background:', noContactProfile.backgroundColor);

  // Verify fallback values are used
  const fallbackContactCorrect = 
    noContactProfile.contactInfo?.phone === '+254 712 345 678' &&
    noContactProfile.contactInfo?.email === 'info@samakicookies.co.ke' &&
    noContactProfile.contactInfo?.website === 'www.samakicookies.co.ke' &&
    noContactProfile.contactInfo?.address === 'Kilifi County, Kenya';

  const fallbackColorsCorrect = 
    noContactProfile.primaryColor === '#1E40AF' &&
    noContactProfile.accentColor === '#F59E0B' &&
    noContactProfile.backgroundColor === '#F8FAFC';

  console.log('\n✅ Test 3 Results:');
  console.log('  Fallback Contact Info Correct:', fallbackContactCorrect ? '✅ PASS' : '❌ FAIL');
  console.log('  Fallback Brand Colors Correct:', fallbackColorsCorrect ? '✅ PASS' : '❌ FAIL');

  // Final Summary
  console.log('\n🎯 FINAL SUMMARY:');
  const allTestsPass = contactMatches && colorsMatch && partialContactCorrect && partialColorsCorrect && fallbackContactCorrect && fallbackColorsCorrect;
  console.log('  Overall Result:', allTestsPass ? '🎉 ALL TESTS PASS' : '❌ SOME TESTS FAILED');
  
  if (allTestsPass) {
    console.log('✅ SUCCESS: System correctly uses dynamic contact info and brand colors!');
    console.log('✅ Custom values take priority, fallbacks work when needed');
  } else {
    console.log('❌ FAILURE: System still using hardcoded values instead of dynamic data');
  }
}

// Run the test
testDynamicContactInfo().catch(console.error);
