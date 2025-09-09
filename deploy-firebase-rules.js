/**
 * Firebase Storage Rules Deployment Script
 * Automatically deploys the correct Firebase Storage rules for public image access
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Firebase Storage Rules with public read access for generated content
const STORAGE_RULES = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Generated content - PUBLIC READ, authenticated write
    // This allows images to be displayed after generation without auth issues
    match /generated-content/{userId}/{allPaths=**} {
      allow read: if true; // Public read access for generated images
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can upload and manage their own artifacts
    match /artifacts/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Brand assets - PUBLIC READ for logos, authenticated write
    match /brand-assets/{userId}/{allPaths=**} {
      allow read: if true; // Public read access for brand logos
      allow write, delete: if request.auth != null && request.auth.uid == userId;
    }
    
    // Temporary uploads (for processing)
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

async function deployFirebaseRules() {
  try {
    console.log('🔥 Starting Firebase Storage Rules Deployment...');
    
    // Check if Firebase CLI is installed
    try {
      execSync('firebase --version', { stdio: 'pipe' });
      console.log('✅ Firebase CLI is installed');
    } catch (error) {
      console.error('❌ Firebase CLI not found. Please install it:');
      console.error('npm install -g firebase-tools');
      process.exit(1);
    }
    
    // Create storage.rules file
    const rulesPath = path.join(process.cwd(), 'storage.rules');
    fs.writeFileSync(rulesPath, STORAGE_RULES);
    console.log('✅ Created storage.rules file');
    
    // Check if firebase.json exists
    const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
    let firebaseConfig = {};
    
    if (fs.existsSync(firebaseJsonPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
      console.log('✅ Found existing firebase.json');
    } else {
      console.log('📝 Creating firebase.json...');
    }
    
    // Update firebase.json with storage rules
    firebaseConfig.storage = {
      rules: 'storage.rules'
    };
    
    fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
    console.log('✅ Updated firebase.json with storage rules');
    
    // Login check
    try {
      execSync('firebase projects:list', { stdio: 'pipe' });
      console.log('✅ Firebase authentication verified');
    } catch (error) {
      console.log('🔐 Please login to Firebase...');
      execSync('firebase login', { stdio: 'inherit' });
    }
    
    // Deploy storage rules
    console.log('🚀 Deploying Firebase Storage rules...');
    execSync('firebase deploy --only storage', { stdio: 'inherit' });
    
    console.log('\n🎉 Firebase Storage Rules Deployed Successfully!');
    console.log('\n📋 What was deployed:');
    console.log('✅ Public read access for generated-content/{userId}/**');
    console.log('✅ Public read access for brand-assets/{userId}/**');
    console.log('✅ Authenticated write access for all user content');
    console.log('✅ Private access for artifacts and temp files');
    
    console.log('\n🧪 Next Steps:');
    console.log('1. Wait 2-3 minutes for rules to propagate');
    console.log('2. Test image generation in your app');
    console.log('3. Verify images display correctly after generation');
    console.log('4. Check browser console for any Firebase errors');
    
    // Cleanup
    if (fs.existsSync(rulesPath)) {
      fs.unlinkSync(rulesPath);
      console.log('🧹 Cleaned up temporary storage.rules file');
    }
    
  } catch (error) {
    console.error('❌ Error deploying Firebase rules:', error.message);
    
    if (error.message.includes('Permission denied')) {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Make sure you have Firebase project access');
      console.error('2. Run: firebase login');
      console.error('3. Run: firebase use --add');
      console.error('4. Select your project: localbuzz-mpkuv');
    }
    
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  deployFirebaseRules();
}

module.exports = { deployFirebaseRules };
