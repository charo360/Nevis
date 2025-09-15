/**
 * Test Revo 1.5 Logo Processing Logic
 * Verify that logo processing works correctly before full generation
 */

// Test the logo processing logic
function testLogoProcessing() {
  console.log('🧪 Testing Revo 1.5 Logo Processing Logic...\n');
  
  // Test case 1: Logo at input level
  const testInput1 = {
    logoDataUrl: 'data:image/png;base64,test123',
    logoUrl: undefined,
    brandProfile: {
      logoDataUrl: undefined,
      logoUrl: undefined
    }
  };
  
  const logoDataUrl1 = testInput1.logoDataUrl || testInput1.brandProfile.logoDataUrl;
  const logoStorageUrl1 = testInput1.logoUrl || testInput1.brandProfile.logoUrl;
  const logoUrl1 = logoDataUrl1 || logoStorageUrl1;
  
  console.log('Test 1 - Logo at input level:');
  console.log('- Input logoDataUrl:', !!testInput1.logoDataUrl);
  console.log('- BrandProfile logoDataUrl:', !!testInput1.brandProfile.logoDataUrl);
  console.log('- Final logoDataUrl:', !!logoDataUrl1);
  console.log('- Final logoUrl:', !!logoUrl1);
  console.log('- Result:', logoUrl1 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  // Test case 2: Logo at brandProfile level
  const testInput2 = {
    logoDataUrl: undefined,
    logoUrl: undefined,
    brandProfile: {
      logoDataUrl: 'data:image/png;base64,test456',
      logoUrl: undefined
    }
  };
  
  const logoDataUrl2 = testInput2.logoDataUrl || testInput2.brandProfile.logoDataUrl;
  const logoStorageUrl2 = testInput2.logoUrl || testInput2.brandProfile.logoUrl;
  const logoUrl2 = logoDataUrl2 || logoStorageUrl2;
  
  console.log('Test 2 - Logo at brandProfile level:');
  console.log('- Input logoDataUrl:', !!testInput2.logoDataUrl);
  console.log('- BrandProfile logoDataUrl:', !!testInput2.brandProfile.logoDataUrl);
  console.log('- Final logoDataUrl:', !!logoDataUrl2);
  console.log('- Final logoUrl:', !!logoUrl2);
  console.log('- Result:', logoUrl2 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  // Test case 3: Logo at both levels (input should take priority)
  const testInput3 = {
    logoDataUrl: 'data:image/png;base64,input123',
    logoUrl: undefined,
    brandProfile: {
      logoDataUrl: 'data:image/png;base64,brand123',
      logoUrl: undefined
    }
  };
  
  const logoDataUrl3 = testInput3.logoDataUrl || testInput3.brandProfile.logoDataUrl;
  const logoStorageUrl3 = testInput3.logoUrl || testInput3.brandProfile.logoUrl;
  const logoUrl3 = logoDataUrl3 || logoStorageUrl3;
  
  console.log('Test 3 - Logo at both levels (input priority):');
  console.log('- Input logoDataUrl:', !!testInput3.logoDataUrl);
  console.log('- BrandProfile logoDataUrl:', !!testInput3.brandProfile.logoDataUrl);
  console.log('- Final logoDataUrl:', !!logoDataUrl3);
  console.log('- Final logoUrl:', !!logoUrl3);
  console.log('- Uses input logo:', logoDataUrl3 === testInput3.logoDataUrl ? '✅ YES' : '❌ NO');
  console.log('- Result:', logoUrl3 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  // Test case 4: Storage URL
  const testInput4 = {
    logoDataUrl: undefined,
    logoUrl: 'https://storage.example.com/logo.png',
    brandProfile: {
      logoDataUrl: undefined,
      logoUrl: undefined
    }
  };
  
  const logoDataUrl4 = testInput4.logoDataUrl || testInput4.brandProfile.logoDataUrl;
  const logoStorageUrl4 = testInput4.logoUrl || testInput4.brandProfile.logoUrl;
  const logoUrl4 = logoDataUrl4 || logoStorageUrl4;
  
  console.log('Test 4 - Storage URL:');
  console.log('- Input logoUrl:', !!testInput4.logoUrl);
  console.log('- BrandProfile logoUrl:', !!testInput4.brandProfile.logoUrl);
  console.log('- Final logoUrl:', !!logoUrl4);
  console.log('- Is storage URL:', logoUrl4?.startsWith('http') ? '✅ YES' : '❌ NO');
  console.log('- Result:', logoUrl4 ? '✅ SUCCESS' : '❌ FAILED');
  console.log('');
  
  // Test case 5: No logo
  const testInput5 = {
    logoDataUrl: undefined,
    logoUrl: undefined,
    brandProfile: {
      logoDataUrl: undefined,
      logoUrl: undefined
    }
  };
  
  const logoDataUrl5 = testInput5.logoDataUrl || testInput5.brandProfile.logoDataUrl;
  const logoStorageUrl5 = testInput5.logoUrl || testInput5.brandProfile.logoUrl;
  const logoUrl5 = logoDataUrl5 || logoStorageUrl5;
  
  console.log('Test 5 - No logo:');
  console.log('- Input logoDataUrl:', !!testInput5.logoDataUrl);
  console.log('- BrandProfile logoDataUrl:', !!testInput5.brandProfile.logoDataUrl);
  console.log('- Final logoUrl:', !!logoUrl5);
  console.log('- Result:', !logoUrl5 ? '✅ SUCCESS (No logo expected)' : '❌ FAILED');
  console.log('');
  
  console.log('🎯 Logo Processing Logic Test Complete!');
  console.log('All tests should show ✅ SUCCESS for the logic to work correctly.');
}

// Run the test
testLogoProcessing();

