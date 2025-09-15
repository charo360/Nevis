#!/usr/bin/env node

// Simple account creation using the working anon client method
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EMAIL = 'sarcharo@gmail.com';
const PASSWORD = 'nevisai2024!';
const DISPLAY_NAME = 'Sarcharo';

console.log('🎯 Creating account using anon client (same method as frontend)...\n');

async function createAccountSimple() {
  try {
    console.log('📝 Signing up with email:', EMAIL);
    
    const { data, error } = await supabase.auth.signUp({
      email: EMAIL,
      password: PASSWORD,
      options: {
        data: {
          display_name: DISPLAY_NAME,
          full_name: DISPLAY_NAME
        }
      }
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      
      // Check if it's because user already exists
      if (error.message.includes('already registered')) {
        console.log('\n💡 Account already exists! Trying to sign in instead...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: EMAIL,
          password: PASSWORD
        });
        
        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
          if (signInError.message.includes('Invalid login credentials')) {
            console.log('\n🔧 The account exists but with a different password.');
            console.log('Try using the Supabase dashboard to reset the password.');
            console.log('Or use a different email address.');
          }
        } else {
          console.log('✅ Successfully signed in with existing account!');
          console.log('🆔 User ID:', signInData.user.id);
          console.log('📧 Email:', signInData.user.email);
          console.log('\n🎉 You can now use these credentials in the app!');
          
          // Sign out to clean up
          await supabase.auth.signOut();
        }
      }
      return;
    }
    
    if (data.user) {
      console.log('✅ Account created successfully!');
      console.log('🆔 User ID:', data.user.id);
      console.log('📧 Email:', data.user.email);
      console.log('✉️ Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      
      if (!data.user.email_confirmed_at) {
        console.log('\n📧 Email confirmation may be required.');
        console.log('Check your inbox for a confirmation email.');
      }
      
      console.log('\n🎉 Account creation completed!');
      console.log('🔐 You can now log in with:');
      console.log('   Email:', EMAIL);
      console.log('   Password:', PASSWORD);
      console.log('   URL: http://localhost:3001/auth');
      
      // Sign out to clean up
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  try {
    await createAccountSimple();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);