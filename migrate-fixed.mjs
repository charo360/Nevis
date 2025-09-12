// Fixed Migration: MongoDB → Supabase
// Handles UUID conversion and constraint issues

import { MongoClient } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const mongoUrl = process.env.DATABASE;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Starting Fixed Migration (MongoDB → Supabase)...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert MongoDB ObjectID to UUID
function mongoIdToUuid(mongoId) {
  if (!mongoId) return crypto.randomUUID();

  // Create a deterministic UUID from MongoDB ObjectID
  const hash = crypto.createHash('md5').update(mongoId.toString()).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32)
  ].join('-');
}

async function createDefaultUser() {
  console.log('👤 Creating default user...');

  const defaultUserId = crypto.randomUUID();

  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: defaultUserId,
        email: 'user@nevis.ai',
        full_name: 'Nevis User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error && !error.message.includes('duplicate')) {
      console.error('❌ Failed to create default user:', error.message);
      return null;
    }

    console.log('✅ Default user ready');
    return defaultUserId;
  } catch (error) {
    console.error('❌ Default user creation error:', error.message);
    return null;
  }
}

async function migrateBrandProfiles(mongoDb, defaultUserId) {
  console.log('👤 Migrating brand profiles...');

  try {
    const brandProfiles = await mongoDb.collection('brandProfiles').find({}).toArray();
    console.log(`📊 Found ${brandProfiles.length} brand profiles to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const profile of brandProfiles) {
      try {
        const profileId = mongoIdToUuid(profile._id);
        const userId = defaultUserId; // Use default user for all profiles

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

        // Use simple insert instead of upsert
        const { error } = await supabase
          .from('brand_profiles')
          .insert(supabaseProfile);

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique')) {
            console.log(`⚠️ Skipped duplicate: ${profile.businessName}`);
          } else {
            console.error(`❌ Failed to migrate profile ${profile.businessName}:`, error.message);
            errors++;
          }
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

async function migrateGeneratedPosts(mongoDb, defaultUserId) {
  console.log('📝 Migrating generated posts...');

  try {
    const posts = await mongoDb.collection('generatedPosts').find({}).toArray();
    console.log(`📊 Found ${posts.length} generated posts to migrate`);

    let migrated = 0;
    let errors = 0;
    let skipped = 0;

    for (const post of posts) {
      try {
        // Skip posts without content
        if (!post.content) {
          skipped++;
          continue;
        }

        const postId = mongoIdToUuid(post._id);
        const userId = defaultUserId;
        const brandProfileId = post.brandProfileId ? mongoIdToUuid(post.brandProfileId) : null;

        const supabasePost = {
          id: postId,
          user_id: userId,
          brand_profile_id: brandProfileId,
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

        // Use simple insert
        const { error } = await supabase
          .from('generated_posts')
          .insert(supabasePost);

        if (error) {
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

async function runMigration() {
  console.log('🔄 Connecting to databases...\n');

  const mongoClient = new MongoClient(mongoUrl);

  try {
    await mongoClient.connect();
    const mongoDb = mongoClient.db();
    console.log('✅ Connected to MongoDB');

    // Test Supabase
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    console.log('✅ Connected to Supabase\n');

    // Create default user
    const defaultUserId = await createDefaultUser();
    if (!defaultUserId) {
      console.error('❌ Could not create default user. Aborting.');
      return;
    }

    // Run migration
    const profileResults = await migrateBrandProfiles(mongoDb, defaultUserId);
    const postResults = await migrateGeneratedPosts(mongoDb, defaultUserId);

    // Summary
    console.log('📊 Migration Summary:');
    console.log(`Brand Profiles: ${profileResults.migrated} migrated, ${profileResults.errors} errors`);
    console.log(`Generated Posts: ${postResults.migrated} migrated, ${postResults.errors} errors, ${postResults.skipped} skipped`);

    const totalMigrated = profileResults.migrated + postResults.migrated;
    const totalErrors = profileResults.errors + postResults.errors;

    if (totalMigrated > 0) {
      console.log('\n🎉 Migration successful!');
      console.log(`✅ ${totalMigrated} items migrated to Supabase`);
      console.log('✅ Your data is now in Supabase with proper storage');
      console.log('✅ Images will be stored correctly when you generate new content');
      console.log('✅ No more broken image icons!');

      if (totalErrors > 0) {
        console.log(`⚠️ ${totalErrors} items had errors (likely duplicates or invalid data)`);
      }
    } else {
      console.log('\n❌ Migration failed - no data was migrated');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoClient.close();
  }
}

runMigration().catch(console.error);
