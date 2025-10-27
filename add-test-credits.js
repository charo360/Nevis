// Add credits to test user for development
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestCredits() {
  const testUserId = 'test-user-id';
  const creditsToAdd = 100; // Add 100 credits for testing
  
  try {
    console.log(`🔄 Adding ${creditsToAdd} credits to test user: ${testUserId}`);
    
    // First, check if user exists in user_credits table
    const { data: existingUser, error: checkError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking user:', checkError);
      return;
    }
    
    if (existingUser) {
      // User exists, update credits
      console.log(`📊 Current credits: ${existingUser.remaining_credits}`);
      
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          total_credits: existingUser.total_credits + creditsToAdd,
          remaining_credits: existingUser.remaining_credits + creditsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId)
        .select();
      
      if (error) {
        console.error('❌ Error updating credits:', error);
        return;
      }
      
      console.log('✅ Credits updated successfully!');
      console.log(`📊 New balance: ${data[0].remaining_credits} credits`);
    } else {
      // User doesn't exist, create new record
      console.log('👤 Creating new user credit record...');
      
      const { data, error } = await supabase
        .from('user_credits')
        .insert({
          user_id: testUserId,
          total_credits: creditsToAdd,
          remaining_credits: creditsToAdd,
          used_credits: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('❌ Error creating user credits:', error);
        return;
      }
      
      console.log('✅ User credit record created successfully!');
      console.log(`📊 Initial balance: ${data[0].remaining_credits} credits`);
    }
    
    // Verify the update
    const { data: finalCheck } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUserId)
      .single();
    
    console.log('\n🎯 Final verification:');
    console.log(`   User ID: ${finalCheck.user_id}`);
    console.log(`   Total Credits: ${finalCheck.total_credits}`);
    console.log(`   Remaining Credits: ${finalCheck.remaining_credits}`);
    console.log(`   Used Credits: ${finalCheck.used_credits}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTestCredits();
