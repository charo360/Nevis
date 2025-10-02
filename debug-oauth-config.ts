// Quick diagnostic to check current Supabase auth configuration
import { supabase } from '@/lib/supabase';

export async function checkSupabaseAuthConfig() {
  console.log('🔍 DIAGNOSING SUPABASE AUTH CONFIGURATION...\n');
  
  // Check current environment
  const environment = process.env.NODE_ENV;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  console.log('📊 Environment Variables:');
  console.log(`NODE_ENV: ${environment}`);
  console.log(`NEXT_PUBLIC_APP_URL: ${appUrl}`);
  console.log(`SUPABASE_URL: ${supabaseUrl}\n`);
  
  // Check current window location (client-side)
  if (typeof window !== 'undefined') {
    console.log('🌐 Current Page URL:', window.location.href);
    console.log('🌐 Current Origin:', window.location.origin);
  }
  
  // Test Google OAuth URL generation
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl || window?.location?.origin || 'https://crevo.app'}/auth/callback`,
      }
    });
    
    if (error) {
      console.error('❌ OAuth URL Generation Error:', error);
    } else {
      console.log('✅ OAuth URL generation successful');
      console.log('🔗 Expected redirect URL:', `${appUrl || window?.location?.origin || 'https://crevo.app'}/auth/callback`);
    }
  } catch (err) {
    console.error('❌ OAuth test failed:', err);
  }
  
  console.log('\n🚨 CRITICAL CHECKS:');
  console.log('1. Is NEXT_PUBLIC_APP_URL set to https://crevo.app?', appUrl === 'https://crevo.app' ? '✅' : '❌');
  console.log('2. Is Supabase URL correct?', supabaseUrl?.includes('nrfceylvtiwpqsoxurrv') ? '✅' : '❌');
  
  if (appUrl !== 'https://crevo.app') {
    console.log('\n🔧 REQUIRED FIX: Update .env.production:');
    console.log('NEXT_PUBLIC_APP_URL=https://crevo.app');
  }
}

// Run this in browser console or component
if (typeof window !== 'undefined') {
  (window as any).checkSupabaseAuth = checkSupabaseAuthConfig;
  console.log('🔧 Run checkSupabaseAuth() in console to diagnose OAuth config');
}