// Check what tables exist in Supabase and create missing ones
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase database structure...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTables() {
  console.log('📊 Checking existing tables...');
  
  try {
    // Try to query some common system tables to see what's available
    const queries = [
      'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'',
      'SELECT schemaname, tablename FROM pg_tables WHERE schemaname = \'public\''
    ];
    
    for (const query of queries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        
        if (!error && data) {
          console.log('✅ Found tables:', data);
          return data;
        }
      } catch (e) {
        // Try next query
      }
    }
    
    // If direct SQL doesn't work, try checking specific tables
    const tablesToCheck = ['users', 'brand_profiles', 'generated_posts', 'social_connections'];
    const existingTables = [];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ Table exists: ${table}`);
        } else {
          console.log(`❌ Table missing: ${table} (${error.message})`);
        }
      } catch (e) {
        console.log(`❌ Table missing: ${table} (${e.message})`);
      }
    }
    
    return existingTables;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return [];
  }
}

async function createMissingTables() {
  console.log('\n🔧 Creating missing tables...');
  
  // Create tables one by one using simple SQL
  const tableCreationQueries = [
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'brand_profiles',
      sql: `
        CREATE TABLE IF NOT EXISTS brand_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          business_name VARCHAR(255) NOT NULL,
          business_type VARCHAR(255),
          location VARCHAR(255),
          website_url TEXT,
          description TEXT,
          target_audience TEXT,
          services TEXT,
          logo_url TEXT,
          logo_data JSONB,
          brand_colors JSONB,
          contact_info JSONB,
          social_handles JSONB,
          website_analysis JSONB,
          brand_voice JSONB,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    },
    {
      name: 'generated_posts',
      sql: `
        CREATE TABLE IF NOT EXISTS generated_posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          brand_profile_id UUID REFERENCES brand_profiles(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          hashtags TEXT,
          image_text TEXT,
          image_url TEXT,
          image_path TEXT,
          image_metadata JSONB,
          platform VARCHAR(50),
          aspect_ratio VARCHAR(20),
          generation_model VARCHAR(100),
          generation_prompt TEXT,
          generation_settings JSONB,
          status VARCHAR(50) DEFAULT 'generated',
          engagement_metrics JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          published_at TIMESTAMP WITH TIME ZONE
        );
      `
    }
  ];
  
  let created = 0;
  let errors = 0;
  
  for (const table of tableCreationQueries) {
    try {
      console.log(`🔧 Creating table: ${table.name}...`);
      
      // Try using RPC to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: table.sql });
      
      if (error) {
        console.error(`❌ Failed to create ${table.name}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Created table: ${table.name}`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error creating ${table.name}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n📊 Table creation summary: ${created} created, ${errors} errors`);
  return { created, errors };
}

async function setupStorage() {
  console.log('\n🗂️ Setting up storage...');
  
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'nevis-storage');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('nevis-storage', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('❌ Storage setup failed:', error.message);
        return false;
      }
      
      console.log('✅ Storage bucket created');
    } else {
      console.log('✅ Storage bucket already exists');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage setup error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Supabase database for image storage fix...\n');
  
  const existingTables = await checkExistingTables();
  
  if (existingTables.length === 0) {
    console.log('\n⚠️ No tables found. Creating database structure...');
    const { created, errors } = await createMissingTables();
    
    if (errors > 0) {
      console.log('\n❌ Some tables could not be created automatically.');
      console.log('📄 Please run the SQL from supabase-schema.sql manually in your Supabase dashboard.');
      console.log('🔗 Go to: https://supabase.com/dashboard → Your Project → SQL Editor');
    }
  } else {
    console.log(`\n✅ Found ${existingTables.length} existing tables`);
  }
  
  const storageOk = await setupStorage();
  
  if (storageOk) {
    console.log('\n🎉 Supabase setup complete!');
    console.log('✅ Database structure ready');
    console.log('✅ Storage bucket ready');
    console.log('✅ Ready to fix your broken image storage!');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Run: node migrate-data-only.mjs (to move your data)');
    console.log('2. Update your app to use Supabase storage');
    console.log('3. Generate new content to test image storage');
  } else {
    console.log('\n⚠️ Setup incomplete - check errors above');
  }
}

main().catch(console.error);
