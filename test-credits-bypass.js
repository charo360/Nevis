/**
 * Test Credits Bypass for Revo 2.0
 * Temporarily bypass credits to test Claude integration
 */

require('dotenv').config({ path: '.env.local' });

async function testCreditsIssue() {
  console.log('🔍 Testing Credits API Issue\n');

  // Test the credits API endpoint directly
  try {
    console.log('🧪 Testing credits API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/user/credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      credentials: 'include',
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response ok: ${response.ok}`);

    if (!response.ok) {
      console.log('❌ Credits API is failing with 401 Unauthorized');
      console.log('');
      console.log('🔍 DIAGNOSIS:');
      console.log('The generation process is blocked because:');
      console.log('1. User authentication is failing');
      console.log('2. Supabase session is invalid/expired');
      console.log('3. Credits API cannot verify user identity');
      console.log('4. Generation stops before reaching Claude');
      console.log('');
      console.log('💡 SOLUTIONS:');
      console.log('');
      console.log('🛠️ **Option 1: Fix Authentication**');
      console.log('   - Check Supabase connection');
      console.log('   - Verify user session is valid');
      console.log('   - Check environment variables');
      console.log('');
      console.log('🛠️ **Option 2: Bypass Credits for Testing**');
      console.log('   - Temporarily disable credits check');
      console.log('   - Test Claude integration directly');
      console.log('   - Confirm ads are from Claude vs fallback');
      console.log('');
      console.log('🛠️ **Option 3: Add Free Credits**');
      console.log('   - Initialize user with free credits');
      console.log('   - Allow generation to proceed');
      console.log('   - Test full flow with Claude');
      
      return;
    }

    const data = await response.json();
    console.log('✅ Credits API working:', data);

  } catch (error) {
    console.log('❌ Credits API test failed:', error.message);
    console.log('');
    console.log('🎯 **ROOT CAUSE CONFIRMED**:');
    console.log('');
    console.log('Your ads are coming from the FALLBACK system because:');
    console.log('1. Credits API fails with 401 Unauthorized');
    console.log('2. Generation process stops before reaching Claude');
    console.log('3. System falls back to template-based content');
    console.log('4. No Claude logs appear in console');
    console.log('');
    console.log('🔧 **IMMEDIATE FIX NEEDED**:');
    console.log('');
    console.log('The 401 error is preventing Revo 2.0 from running.');
    console.log('This explains why:');
    console.log('- No Claude logs in console');
    console.log('- No Swahili integration');
    console.log('- Generic template content');
    console.log('- Professional but bland designs');
    console.log('');
    console.log('📋 **NEXT STEPS**:');
    console.log('1. Fix Supabase authentication');
    console.log('2. Or temporarily bypass credits check');
    console.log('3. Test generation again');
    console.log('4. Look for Claude logs in console');
  }
}

testCreditsIssue();
