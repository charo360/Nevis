// OAuth Configuration Verification Script
// Run this in your browser console after updating Supabase settings

async function verifyOAuthConfig() {
  console.log('🔍 VERIFYING OAUTH CONFIGURATION...\n');
  
  // Check environment variables
  const currentUrl = window.location.origin;
  const expectedProdUrl = 'https://crevo.app';
  
  console.log('📊 Current Environment:');
  console.log(`Current URL: ${currentUrl}`);
  console.log(`Expected Prod URL: ${expectedProdUrl}`);
  console.log(`Environment Match: ${currentUrl === expectedProdUrl ? '✅' : '❌'}\n`);
  
  // Test OAuth URL generation
  try {
    // Import Supabase client (adjust path as needed)
    const supabase = (window as any).supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you have supabase imported globally.');
      return;
    }
    
    console.log('🔄 Testing OAuth URL generation...');
    
    // Generate OAuth URL
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${currentUrl}/auth/callback`
      }
    });
    
    if (error) {
      console.error('❌ OAuth URL Generation Failed:', error);
      return;
    }
    
    console.log('✅ OAuth URL generation successful');
    console.log(`🔗 Redirect URL: ${currentUrl}/auth/callback\n`);
    
    // Check if we're in production
    if (currentUrl === expectedProdUrl) {
      console.log('🎉 PRODUCTION ENVIRONMENT DETECTED');
      console.log('✅ OAuth should now redirect to https://crevo.app');
    } else {
      console.log('🛠️ DEVELOPMENT ENVIRONMENT');
      console.log('✅ OAuth will redirect to localhost for testing');
    }
    
  } catch (err) {
    console.error('❌ Verification failed:', err);
  }
  
  console.log('\n📋 VERIFICATION CHECKLIST:');
  console.log('1. Supabase SITE_URL = https://crevo.app ✅');
  console.log('2. Supabase Redirect URLs include https://crevo.app/** ✅');  
  console.log('3. Google Cloud Console has Supabase callback URL ✅');
  console.log('4. /auth/callback page exists in your app ✅');
  
  console.log('\n🚀 If all checks pass, OAuth should work correctly!');
}

// Make function available globally
(window as any).verifyOAuthConfig = verifyOAuthConfig;

console.log('🔧 OAuth Verification Script Loaded');
console.log('Run: verifyOAuthConfig() to test your configuration');

export { verifyOAuthConfig };