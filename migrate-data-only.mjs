// Simple Data Migration: MongoDB → Supabase
// Since database schema already exists, just migrate the data

import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const mongoUrl = process.env.DATABASE;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting Data Migration (MongoDB → Supabase)...\n');

if (!mongoUrl || !supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateBrandProfiles(mongoDb) {
  console.log('👤 Migrating brand profiles...');
  
  try {
    const brandProfiles = await mongoDb.collection('brandProfiles').find({}).toArray();
    console.log(`📊 Found ${brandProfiles.length} brand profiles to migrate`);
    
    let migrated = 0;
    let errors = 0;
    
    for (const profile of brandProfiles) {
      try {
        // Create a user first if it doesn't exist
        const userId = profile.userId || 'default-user';
        
        // Try to insert user (ignore if exists)
        await supabase
          .from('users')
          .upsert({
            id: userId,
            email: `user-${userId}@example.com`,
            full_name: 'Migrated User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        // Convert MongoDB format to Supabase format
        const supabaseProfile = {
          user_id: userId,
          business_name: profile.businessName || 'Unnamed Business',
          business_type: profile.businessType,
          location: profile.location,
          website_url: profile.websiteUrl,
          description: profile.description,
          target_audience: profile.targetAudience,
          services: profile.services,
          logo_url: null, // Will be fixed by proper image storage
          logo_data: profile.logoData ? { legacy_data: profile.logoData } : null,
          brand_colors: profile.brandColors,
          contact_info: profile.contactInfo,
          social_handles: profile.socialHandles,
          website_analysis: profile.websiteAnalysis,
          brand_voice: profile.brandVoice,
          is_active: true,
          created_at: profile.createdAt || new Date().toISOString(),
          updated_at: profile.updatedAt || new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('brand_profiles')
          .upsert(supabaseProfile, { onConflict: 'user_id,business_name' });
        
        if (error) {
          console.error(`❌ Failed to migrate profile ${profile.businessName}:`, error.message);
          errors++;
        } else {
          console.log(`✅ Migrated: ${profile.businessName}`);
          migrated++;
        }
      } catch (error) {
        console.error(`❌ Error processing profile ${profile.businessName}:`, error.message);
        errors++;
      }
    }
    
    console.log(`✅ Brand profiles migration complete: ${migrated} migrated, ${errors} errors\n`);
    return { migrated, errors };
  } catch (error) {
    console.error('❌ Brand profiles migration error:', error.message);
    return { migrated: 0, errors: 1 };
  }
}

async function migrateGeneratedPosts(mongoDb) {
  console.log('📝 Migrating generated posts...');
  
  try {
    const posts = await mongoDb.collection('generatedPosts').find({}).toArray();
    console.log(`📊 Found ${posts.length} generated posts to migrate`);
    
    let migrated = 0;
    let errors = 0;
    let skipped = 0;
    
    for (const post of posts) {
      try {
        const userId = post.userId || 'default-user';
        
        // Skip posts without content
        if (!post.content) {
          skipped++;
          continue;
        }
        
        const supabasePost = {
          user_id: userId,
          brand_profile_id: post.brandProfileId || null,
          content: post.content,
          hashtags: post.hashtags,
          image_text: post.imageText,
          image_url: null, // Images will be re-uploaded properly
          image_path: null,
          image_metadata: post.imageData ? { legacy_data: post.imageData } : null,
          platform: post.platform,
          aspect_ratio: post.aspectRatio,
          generation_model: post.generationModel,
          generation_prompt: post.generationPrompt,
          generation_settings: post.generationSettings,
          status: 'generated',
          engagement_metrics: post.engagementMetrics,
          created_at: post.createdAt || new Date().toISOString(),
          updated_at: post.updatedAt || new Date().toISOString(),
          published_at: post.publishedAt
        };
        
        const { error } = await supabase
          .from('generated_posts')
          .insert(supabasePost);
        
        if (error) {
          // If it's a duplicate, skip it
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            skipped++;
          } else {
            console.error(`❌ Failed to migrate post ${post._id}:`, error.message);
            errors++;
          }
        } else {
          migrated++;
          if (migrated % 10 === 0) {
            console.log(`📈 Progress: ${migrated} posts migrated...`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing post ${post._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`✅ Generated posts migration complete: ${migrated} migrated, ${errors} errors, ${skipped} skipped\n`);
    return { migrated, errors, skipped };
  } catch (error) {
    console.error('❌ Generated posts migration error:', error.message);
    return { migrated: 0, errors: 1, skipped: 0 };
  }
}

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    // Test storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage connection failed:', storageError.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log(`📊 Storage buckets available: ${buckets?.length || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function runMigration() {
  console.log('🔄 Connecting to databases...\n');
  
  const mongoClient = new MongoClient(mongoUrl);
  
  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db();
    console.log('✅ Connected to MongoDB');
    
    const supabaseOk = await testSupabaseConnection();
    if (!supabaseOk) {
      console.error('❌ Supabase connection failed. Aborting migration.');
      return;
    }
    
    console.log('✅ Connected to Supabase\n');
    
    // Run migration
    const profileResults = await migrateBrandProfiles(mongoDb);
    const postResults = await migrateGeneratedPosts(mongoDb);
    
    // Summary
    console.log('📊 Migration Summary:');
    console.log(`Brand Profiles: ${profileResults.migrated} migrated, ${profileResults.errors} errors`);
    console.log(`Generated Posts: ${postResults.migrated} migrated, ${postResults.errors} errors, ${postResults.skipped} skipped`);
    
    const totalMigrated = profileResults.migrated + postResults.migrated;
    const totalErrors = profileResults.errors + postResults.errors;
    
    if (totalErrors === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('✅ Your data is now in Supabase');
      console.log('✅ Images will be properly stored when you generate new content');
      console.log('✅ No more broken image icons!');
    } else if (totalMigrated > 0) {
      console.log('\n⚠️ Migration completed with some errors');
      console.log(`✅ ${totalMigrated} items migrated successfully`);
      console.log(`❌ ${totalErrors} items failed`);
    } else {
      console.log('\n❌ Migration failed - no data was migrated');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoClient.close();
  }
}

// Run the migration
runMigration().catch(console.error);
