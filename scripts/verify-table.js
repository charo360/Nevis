/**
 * Verify Creative Assets Table
 * Checks if the creative_assets table actually exists and can be queried
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log('🔍 Verifying creative_assets table...');
  
  const { data, error } = await supabase
    .from('creative_assets')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying creative_assets table:');
    console.error(JSON.stringify(error, null, 2));
    
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('\n🚨 THE TABLE DOES NOT EXIST!');
    }
  } else {
    console.log('✅ Table exists and is accessible!');
    console.log('Data:', data);
  }
}

verify();
