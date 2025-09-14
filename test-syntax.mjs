#!/usr/bin/env node

/**
 * Simple syntax test for the fixed hook
 */

import { readFileSync } from 'fs';

console.log('🔍 Testing hook syntax...');

try {
  const hookContent = readFileSync('src/hooks/use-generated-posts.ts', 'utf8');
  
  // Check for common syntax issues
  const issues = [];
  
  // Check for duplicate function names
  const getAuthHeadersMatches = hookContent.match(/const getAuthHeaders/g);
  if (getAuthHeadersMatches && getAuthHeadersMatches.length > 1) {
    issues.push(`Found ${getAuthHeadersMatches.length} definitions of getAuthHeaders`);
  }
  
  // Check for missing references
  if (hookContent.includes('getAuthToken(') && !hookContent.includes('const getAuthToken')) {
    issues.push('Reference to getAuthToken() but no definition found');
  }
  
  // Check for proper imports
  if (!hookContent.includes("import { useAuth } from './use-auth-supabase';")) {
    issues.push('Missing Supabase auth import');
  }
  
  // Check for proper async/await usage with getAuthHeaders
  const asyncHeaderCalls = hookContent.match(/const headers = await getAuthHeaders\(\);/g);
  if (!asyncHeaderCalls || asyncHeaderCalls.length === 0) {
    issues.push('getAuthHeaders calls are not using async/await properly');
  }
  
  if (issues.length === 0) {
    console.log('✅ Hook syntax looks good!');
    console.log('\n📋 Found:');
    console.log(`   - ${getAuthHeadersMatches?.length || 0} getAuthHeaders definition(s)`);
    console.log(`   - ${asyncHeaderCalls?.length || 0} async getAuthHeaders call(s)`);
    console.log('   - Supabase auth import: ✅');
  } else {
    console.log('❌ Issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
} catch (error) {
  console.error('❌ Error reading hook file:', error.message);
}

console.log('\n🚀 Try restarting your dev server now!');