/**
 * Test Server Action Analysis
 * Tests the analyzeBrandAction server action that the UI actually uses
 */

async function testServerAction() {
  console.log('🎯 Testing Server Action Analysis...');
  
  try {
    // Import the server action directly
    const { analyzeBrandAction } = await import('./src/app/actions.js');
    
    console.log('📡 Calling analyzeBrandAction...');
    
    const result = await analyzeBrandAction(
      'https://example.com',
      []
    );

    console.log('✅ Server Action Response received');
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n✅ Server Action Analysis: SUCCESS');
      console.log(`   Business Name: ${result.data.businessName}`);
      console.log(`   Business Type: ${result.data.businessType}`);
      console.log(`   Description: ${result.data.description?.substring(0, 100)}...`);
      console.log(`   Target Audience: ${result.data.targetAudience}`);
      console.log(`   Value Proposition: ${result.data.valueProposition}`);
      return true;
    } else {
      console.log('\n❌ Server Action Analysis: FAILED');
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Type: ${result.errorType}`);
      return false;
    }
  } catch (error) {
    console.log('\n❌ Server Action Analysis: ERROR');
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    
    // Check for specific error types
    if (error.message.includes('Cannot resolve module')) {
      console.log('\n🔧 Module Resolution Issue:');
      console.log('   - The server action import failed');
      console.log('   - This might be a TypeScript/ES module issue');
    }
    
    if (error.message.includes('analyzeBrand')) {
      console.log('\n🔧 analyzeBrand Function Issue:');
      console.log('   - The analyzeBrand function is not working');
      console.log('   - Check the OpenRouter integration');
    }
    
    return false;
  }
}

async function testDirectAnalyzeBrandImport() {
  console.log('\n🔍 Testing Direct analyzeBrand Import...');
  
  try {
    const { analyzeBrand } = await import('./src/ai/flows/analyze-brand.js');
    
    console.log('📡 Calling analyzeBrand directly...');
    
    const result = await analyzeBrand({
      websiteUrl: 'https://example.com',
      designImageUris: []
    });

    console.log('✅ Direct analyzeBrand Success');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    return true;
    
  } catch (error) {
    console.log('❌ Direct analyzeBrand Error:', error.message);
    console.log('Stack:', error.stack);
    return false;
  }
}

async function runServerActionTest() {
  console.log('🎯 TESTING SERVER ACTION ANALYSIS');
  console.log('=' .repeat(50));

  const results = {
    serverAction: await testServerAction(),
    directImport: await testDirectAnalyzeBrandImport()
  };

  console.log('\n📊 SERVER ACTION TEST RESULTS:');
  console.log('=' .repeat(50));
  console.log(`Server Action (UI Flow):  ${results.serverAction ? '✅ Working' : '❌ Broken'}`);
  console.log(`Direct Import:            ${results.directImport ? '✅ Working' : '❌ Broken'}`);

  if (results.serverAction) {
    console.log('\n🎉 SUCCESS: Server Action Analysis is working!');
    console.log('   - The UI analysis flow should work');
    console.log('   - Brand profile creation should work');
    console.log('   - Website analysis is functional');
  } else {
    console.log('\n🔧 DIAGNOSIS:');
    console.log('❌ The server action analysis is broken');
    console.log('   - This is what the UI actually calls');
    console.log('   - Need to fix the server action integration');
  }

  if (!results.directImport && !results.serverAction) {
    console.log('\n💡 SOLUTION:');
    console.log('   - Check TypeScript compilation');
    console.log('   - Check module imports and exports');
    console.log('   - Test with the Next.js dev server running');
  }
}

// Run server action test
runServerActionTest().catch(console.error);
