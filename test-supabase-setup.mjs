// Test Supabase setup after creating tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testing Supabase setup...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const tables = ['users', 'brand_profiles', 'generated_posts', 'social_connections', 'artifacts'];
  let allGood = true;
  
  console.log('📊 Testing database tables...');
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${table}: Ready`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
      allGood = false;
    }
  }
  
  return allGood;
}

async function testStorage() {
  console.log('\n🗂️ Testing storage...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Storage error:', error.message);
      return false;
    }
    
    const nevisBucket = buckets?.find(b => b.name === 'nevis-storage');
    
    if (nevisBucket) {
      console.log('✅ Storage bucket: Ready');
      console.log(`📊 Bucket details: ${nevisBucket.name} (${nevisBucket.public ? 'public' : 'private'})`);
      return true;
    } else {
      console.log('❌ Storage bucket: Missing nevis-storage bucket');
      return false;
    }
  } catch (e) {
    console.log('❌ Storage test failed:', e.message);
    return false;
  }
}

async function main() {
  const tablesOk = await testTables();
  const storageOk = await testStorage();
  
  console.log('\n📊 Setup Status:');
  console.log(`Database Tables: ${tablesOk ? '✅ Ready' : '❌ Issues found'}`);
  console.log(`Storage Bucket: ${storageOk ? '✅ Ready' : '❌ Issues found'}`);
  
  if (tablesOk && storageOk) {
    console.log('\n🎉 Supabase setup is complete!');
    console.log('✅ All tables created successfully');
    console.log('✅ Storage bucket ready for images');
    console.log('✅ Ready to migrate your data and fix broken images');
    
    console.log('\n🔄 Next step: Run data migration');
    console.log('Command: node migrate-data-only.mjs');
  } else {
    console.log('\n⚠️ Setup incomplete:');
    if (!tablesOk) {
      console.log('- Please run the SQL from create-missing-tables.sql in Supabase dashboard');
    }
    if (!storageOk) {
      console.log('- Please check storage bucket configuration');
    }
  }
}

main().catch(console.error);
