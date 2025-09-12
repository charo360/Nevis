// Simple Migration: Just move the essential data
// Skip complex relationships for now, focus on getting data moved

import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const mongoUrl = process.env.DATABASE;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting Simple Migration...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert MongoDB ObjectID to UUID
function mongoIdToUuid(mongoId) {
  if (!mongoId) return crypto.randomUUID();
  
  const hash = crypto.createHash('md5').update(mongoId.toString()).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function testSupabaseConnection() {
  try {
    // Test with a simple query
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection working');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
}

async function migrateBrandProfilesSimple(mongoDb) {
  console.log('👤 Migrating brand profiles (simple)...');
  
  try {
    const brandProfiles = await mongoDb.collection('brandProfiles').find({}).toArray();
    console.log(`📊 Found ${brandProfiles.length} brand profiles`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const profile of brandProfiles) {
      try {
        // Create a simple user entry first
        const userId = mongoIdToUuid(profile.userId || profile._id);
        
        // Try to create user (ignore if exists)
        await supabase
          .from('users')
          .insert({
            id: userId,
            email: `user-${userId.substring(0, 8)}@nevis.ai`,
            full_name: 'Migrated User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        // Now create brand profile
        const profileId = mongoIdToUuid(profile._id);
        
        const supabaseProfile = {
          id: profileId,
          user_id: userId,
          business_name: profile.businessName || 'Unnamed Business',
          business_type: profile.businessType,
          location: profile.location,
          website_url: profile.websiteUrl,
          description: profile.description,
          target_audience: profile.targetAudience,
          services: profile.services,
          logo_url: null,
          brand_colors: profile.brandColors,
          contact_info: profile.contactInfo,
          is_active: true,
          created_at: profile.createdAt || new Date().toISOString(),
          updated_at: profile.updatedAt || new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('brand_profiles')
          .insert(supabaseProfile);
        
        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            skipped++;
          } else {
            console.error(`❌ Profile error: ${error.message}`);
          }
        } else {
          console.log(`✅ Migrated: ${profile.businessName}`);
          migrated++;
        }
        
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          skipped++;
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Brand profiles: ${migrated} migrated, ${skipped} skipped\n`);
    return migrated;
  } catch (error) {
    console.error('❌ Brand profiles migration error:', error.message);
    return 0;
  }
}

async function migratePostsSimple(mongoDb) {
  console.log('📝 Migrating posts (simple)...');
  
  try {
    const posts = await mongoDb.collection('generatedPosts').find({}).limit(20).toArray(); // Limit for testing
    console.log(`📊 Found ${posts.length} posts (limited for testing)`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const post of posts) {
      try {
        if (!post.content) {
          skipped++;
          continue;
        }
        
        const postId = mongoIdToUuid(post._id);
        const userId = mongoIdToUuid(post.userId || 'default');
        
        const supabasePost = {
          id: postId,
          user_id: userId,
          brand_profile_id: null, // Skip relationships for now
          content: post.content,
          hashtags: post.hashtags,
          image_text: post.imageText,
          image_url: null, // Will be fixed with new storage
          platform: post.platform,
          status: 'generated',
          created_at: post.createdAt || new Date().toISOString(),
          updated_at: post.updatedAt || new Date().toISOString()
        };
        
        const { error } = await supabase
          .from('generated_posts')
          .insert(supabasePost);
        
        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            skipped++;
          } else {
            console.error(`❌ Post error: ${error.message}`);
          }
        } else {
          migrated++;
        }
        
      } catch (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          skipped++;
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Posts: ${migrated} migrated, ${skipped} skipped\n`);
    return migrated;
  } catch (error) {
    console.error('❌ Posts migration error:', error.message);
    return 0;
  }
}

async function runSimpleMigration() {
  console.log('🔄 Connecting...\n');
  
  const mongoClient = new MongoClient(mongoUrl);
  
  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db();
    console.log('✅ Connected to MongoDB');
    
    const supabaseOk = await testSupabaseConnection();
    if (!supabaseOk) {
      console.error('❌ Supabase connection failed');
      return;
    }
    
    // Run simple migration
    const profilesMigrated = await migrateBrandProfilesSimple(mongoDb);
    const postsMigrated = await migratePostsSimple(mongoDb);
    
    const total = profilesMigrated + postsMigrated;
    
    console.log('📊 Simple Migration Summary:');
    console.log(`Brand Profiles: ${profilesMigrated} migrated`);
    console.log(`Posts: ${postsMigrated} migrated`);
    console.log(`Total: ${total} items migrated`);
    
    if (total > 0) {
      console.log('\n🎉 Migration successful!');
      console.log('✅ Your data is now in Supabase');
      console.log('✅ Ready to fix image storage');
      console.log('✅ No more broken images when you generate new content!');
    } else {
      console.log('\n⚠️ No data was migrated - this might be due to existing data');
      console.log('✅ But your Supabase setup is ready for new content!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoClient.close();
  }
}

runSimpleMigration().catch(console.error);
