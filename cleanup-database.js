#!/usr/bin/env node

/**
 * Database cleanup script to free up MongoDB storage space
 * This script will help you manage your database storage by removing old posts
 */

const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.DATABASE || 'mongodb://localhost:27017/nevis';

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    console.log('🔗 Connection URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

    const db = client.db();
    console.log('📂 Database name:', db.databaseName);

    // List all collections first
    const collections = await db.listCollections().toArray();
    console.log('📋 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Get database stats
    const stats = await db.stats();
    console.log('\n📊 Database Stats:');
    console.log(`   Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);

    // Check multiple possible collection names
    const possibleCollections = ['generated_posts', 'generatedposts', 'posts', 'generatedPosts'];
    let postsCollection = null;
    let totalPosts = 0;

    for (const collectionName of possibleCollections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(`\n📝 Found ${count} posts in collection: ${collectionName}`);
          postsCollection = collection;
          totalPosts = count;
          break;
        }
      } catch (error) {
        // Collection doesn't exist, continue
      }
    }

    if (!postsCollection) {
      console.log('\n⚠️ No posts collection found with data');

      // Check all collections for any data
      console.log('\n🔍 Checking all collections for data...');
      for (const collection of collections) {
        try {
          const coll = db.collection(collection.name);
          const count = await coll.countDocuments();
          const sampleDoc = await coll.findOne();
          console.log(`   ${collection.name}: ${count} documents`);
          if (sampleDoc && count > 0) {
            const docSize = JSON.stringify(sampleDoc).length;
            console.log(`     Sample doc size: ${(docSize / 1024).toFixed(2)} KB`);
            if (docSize > 10000) { // If larger than 10KB
              console.log(`     ⚠️ Large document detected in ${collection.name}`);
            }
          }
        } catch (error) {
          console.log(`   ${collection.name}: Error checking - ${error.message}`);
        }
      }
      return;
    }

    console.log(`📝 Total Posts: ${totalPosts}`);

    if (totalPosts === 0) {
      console.log('✅ No posts to clean up');
      return;
    }

    // Find posts older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldPosts = await postsCollection.countDocuments({
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(`🗓️  Posts older than 30 days: ${oldPosts}`);

    if (oldPosts > 0) {
      console.log('🗑️  Removing old posts...');
      const deleteResult = await postsCollection.deleteMany({
        createdAt: { $lt: thirtyDaysAgo }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} old posts`);
    }

    // If still need more space, remove posts older than 7 days
    const remainingPosts = await postsCollection.countDocuments();
    if (remainingPosts > 1000) { // If still too many posts
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentOldPosts = await postsCollection.countDocuments({
        createdAt: { $lt: sevenDaysAgo }
      });

      if (recentOldPosts > 0) {
        console.log('🗑️  Removing posts older than 7 days...');
        const deleteResult2 = await postsCollection.deleteMany({
          createdAt: { $lt: sevenDaysAgo }
        });
        console.log(`✅ Deleted ${deleteResult2.deletedCount} more posts`);
      }
    }

    // Final stats
    const finalPosts = await postsCollection.countDocuments();
    console.log(`📝 Remaining Posts: ${finalPosts}`);

    // Get updated database stats
    const finalStats = await db.stats();
    console.log('📊 Final Database Stats:');
    console.log(`   Storage Size: ${(finalStats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Data Size: ${(finalStats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    // Clean up large base64 data URLs that are causing storage issues
    console.log('\n🧹 Cleaning up large base64 image data...');

    const postsWithLargeImages = await postsCollection.find({
      $or: [
        { 'imageUrl': { $regex: '^data:image' } },
        { 'content.imageUrl': { $regex: '^data:image' } },
        { 'variants.imageUrl': { $regex: '^data:image' } }
      ]
    }).toArray();

    console.log(`📊 Found ${postsWithLargeImages.length} posts with base64 image data`);

    if (postsWithLargeImages.length > 0) {
      let totalSizeBefore = 0;
      let totalSizeAfter = 0;

      for (const post of postsWithLargeImages) {
        const sizeBefore = JSON.stringify(post).length;
        totalSizeBefore += sizeBefore;

        // Replace large base64 data URLs with placeholder
        const updates = {};

        if (post.imageUrl && post.imageUrl.startsWith('data:image')) {
          updates.imageUrl = '[Image removed to save storage space]';
        }

        if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:image')) {
          updates['content.imageUrl'] = '[Image removed to save storage space]';
        }

        if (post.variants && post.variants.length > 0) {
          const cleanedVariants = post.variants.map(variant => ({
            ...variant,
            imageUrl: variant.imageUrl && variant.imageUrl.startsWith('data:image')
              ? '[Image removed to save storage space]'
              : variant.imageUrl
          }));
          updates.variants = cleanedVariants;
        }

        if (Object.keys(updates).length > 0) {
          await postsCollection.updateOne(
            { _id: post._id },
            { $set: updates }
          );

          const sizeAfter = JSON.stringify({ ...post, ...updates }).length;
          totalSizeAfter += sizeAfter;
        }
      }

      const spaceSaved = totalSizeBefore - totalSizeAfter;
      console.log(`💾 Space saved: ${(spaceSaved / 1024 / 1024).toFixed(2)} MB`);
      console.log(`✅ Cleaned up ${postsWithLargeImages.length} posts with large image data`);
    }

    console.log('\n✅ Database cleanup completed!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

// Run the cleanup
cleanupDatabase().catch(console.error);
