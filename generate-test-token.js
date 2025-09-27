#!/usr/bin/env node

/**
 * Generate Test JWT Token
 * Creates a test JWT token for API testing
 */

require('dotenv').config({ path: '.env.local' });

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Create test user payload
const testUser = {
  userId: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

// Generate token
const token = jwt.sign(testUser, JWT_SECRET);

console.log('🔑 Generated Test JWT Token');
console.log('==========================');
console.log('Token:', token);
console.log('');
console.log('User ID:', testUser.userId);
console.log('Email:', testUser.email);
console.log('Expires:', new Date(testUser.exp * 1000).toLocaleString());
console.log('');
console.log('💡 Add this to your .env.local:');
console.log(`TEST_JWT_TOKEN=${token}`);
console.log('');
console.log('🧪 Use this token for API testing');

// Verify the token works
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token verification successful');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}
