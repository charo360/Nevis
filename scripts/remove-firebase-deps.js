#!/usr/bin/env node

/**
 * Script to remove Firebase dependencies and clean up Firebase-related files
 * Run this after completing the MongoDB migration
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Firebase cleanup...');

// Firebase packages to remove
const firebasePackages = [
  'firebase',
  'firebase-admin',
  '@firebase/storage',
  'react-firebase-hooks'
];

// Firebase-related files and directories to remove
const firebaseFiles = [
  'firebase.json',
  '.firebaserc',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
  'src/lib/firebase',
  'src/hooks/use-firebase-auth.ts',
  'src/components/auth/auth-wrapper.tsx',
  'src/contexts/brand-context-firebase-first.tsx',
  'src/hooks/use-brand-profiles-firebase-first.ts',
  'src/components/cbrand/cbrand-wizard-firebase-first.tsx',
  'src/components/cbrand/steps/logo-upload-step-firebase-first.tsx',
  'src/components/cbrand/firebase-brand-profile-storage.tsx',
  'src/app/brand-profile-firebase-first',
  'localbuzz-mpkuv-firebase-adminsdk-fbsvc-a5586e4113.json'
];

// Environment variables to remove from .env.local
const firebaseEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'GOOGLE_CLOUD_PROJECT_ID'
];

function removeFirebasePackages() {
  console.log('📦 Removing Firebase packages from package.json...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let removed = false;

  firebasePackages.forEach(pkg => {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      delete packageJson.dependencies[pkg];
      console.log(`  ✅ Removed ${pkg} from dependencies`);
      removed = true;
    }
    if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
      delete packageJson.devDependencies[pkg];
      console.log(`  ✅ Removed ${pkg} from devDependencies`);
      removed = true;
    }
  });

  if (removed) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');
  } else {
    console.log('ℹ️  No Firebase packages found in package.json');
  }
}

function removeFirebaseFiles() {
  console.log('🗂️  Removing Firebase files and directories...');
  
  firebaseFiles.forEach(filePath => {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`  ✅ Removed directory: ${filePath}`);
      } else {
        fs.unlinkSync(fullPath);
        console.log(`  ✅ Removed file: ${filePath}`);
      }
    } else {
      console.log(`  ℹ️  File not found: ${filePath}`);
    }
  });
}

function cleanupEnvFile() {
  console.log('🔧 Cleaning up environment variables...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found');
    return;
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  let modified = false;

  firebaseEnvVars.forEach(envVar => {
    const regex = new RegExp(`^${envVar}=.*$`, 'gm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, '');
      console.log(`  ✅ Removed ${envVar}`);
      modified = true;
    }
  });

  // Remove Firebase-related comments
  const firebaseComments = [
    '# Firebase Configuration',
    '# Get these values from your Firebase project settings',
    '# Firebase Admin SDK (for server-side operations)',
    '# This should be the entire service account key JSON as a string',
    '# Google Cloud Configuration for Imagen 4',
    '# Project ID for Google Cloud Vertex AI'
  ];

  firebaseComments.forEach(comment => {
    if (envContent.includes(comment)) {
      envContent = envContent.replace(comment + '\n', '');
      modified = true;
    }
  });

  // Clean up extra newlines
  envContent = envContent.replace(/\n\n\n+/g, '\n\n');

  if (modified) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env.local');
  } else {
    console.log('ℹ️  No Firebase environment variables found');
  }
}

function updateImports() {
  console.log('🔄 Note: You may need to manually update imports in remaining files');
  console.log('   Replace Firebase imports with MongoDB equivalents:');
  console.log('   - useFirebaseAuth → useAuth');
  console.log('   - Firebase services → MongoDB services');
  console.log('   - Firebase storage → GridFS storage');
}

function main() {
  try {
    removeFirebasePackages();
    removeFirebaseFiles();
    cleanupEnvFile();
    updateImports();
    
    console.log('\n🎉 Firebase cleanup completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm install (to update package-lock.json)');
    console.log('2. Update any remaining Firebase imports in your code');
    console.log('3. Test your application with MongoDB');
    console.log('4. Update your main layout.tsx to use layout-mongo.tsx');
    console.log('5. Update component imports to use MongoDB versions');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  removeFirebasePackages,
  removeFirebaseFiles,
  cleanupEnvFile
};
