/**
 * Test ONLY the Secondary Vertex AI Account
 * This bypasses the primary account to test secondary directly
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 TESTING SECONDARY VERTEX AI ACCOUNT ONLY');
  console.log('='.repeat(80) + '\n');

  const results = {
    credentialsLoaded: false,
    authentication: { success: false, error: null as string | null },
    textGeneration: { success: false, error: null as string | null, response: null as any },
    imageGeneration: { success: false, error: null as string | null, response: null as any }
  };

  // Check if secondary is enabled
  if (process.env.VERTEX_AI_SECONDARY_ENABLED !== 'true') {
    console.error('❌ Secondary Vertex AI is not enabled');
    return NextResponse.json({
      status: 'DISABLED',
      message: 'VERTEX_AI_SECONDARY_ENABLED is not set to true',
      results
    });
  }

  // Load secondary credentials
  let credentials: any;
  let projectId: string;
  let location: string;

  try {
    const keyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE || 'vertex-ai-secondary-credentials.json';
    const credentialsPath = join(process.cwd(), keyFile);
    const credentialsData = readFileSync(credentialsPath, 'utf8');
    credentials = JSON.parse(credentialsData);
    projectId = process.env.VERTEX_AI_SECONDARY_PROJECT_ID || credentials.project_id;
    location = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';
    
    console.log('✅ Secondary credentials loaded');
    console.log(`   Service Account: ${credentials.client_email}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Location: ${location}`);
    results.credentialsLoaded = true;
  } catch (error: any) {
    console.error('❌ Failed to load secondary credentials:', error.message);
    return NextResponse.json({
      status: 'FAILED',
      message: 'Could not load secondary credentials',
      error: error.message,
      results
    });
  }

  // Get access token
  let accessToken: string;
  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: credentials.token_uri,
      exp: now + 3600,
      iat: now
    };

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(`${header}.${payloadStr}`);
    const signature = sign.sign(credentials.private_key, 'base64url');

    const jwt = `${header}.${payloadStr}.${signature}`;

    const response = await fetch(credentials.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }

    const tokenData = await response.json();
    accessToken = tokenData.access_token;
    
    console.log('✅ Authentication successful - got access token');
    results.authentication.success = true;
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    results.authentication.error = error.message;
    return NextResponse.json({
      status: 'AUTH_FAILED',
      message: 'Authentication failed',
      results
    });
  }

  // Test 1: Text Generation
  console.log('\n📝 Test 1: Text Generation (gemini-2.5-flash)');
  console.log('-'.repeat(80));
  try {
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Say "Hello from Secondary Vertex AI" in exactly 5 words.' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text returned';
    
    console.log('✅ Text Generation: SUCCESS');
    console.log('   Response:', text);
    results.textGeneration.success = true;
    results.textGeneration.response = text;
  } catch (error: any) {
    console.error('❌ Text Generation: FAILED');
    console.error('   Error:', error.message);
    results.textGeneration.error = error.message;
  }

  // Test 2: Image Generation
  console.log('\n🖼️  Test 2: Image Generation (gemini-2.5-flash-image)');
  console.log('-'.repeat(80));
  try {
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: 'Create a simple test image with the text "Secondary Account Test" on a green gradient background' }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const imageData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
    
    if (!imageData) {
      throw new Error('No image data in response');
    }

    console.log('✅ Image Generation: SUCCESS');
    console.log('   Image data length:', imageData.length, 'characters');
    console.log('   MIME type:', mimeType);
    results.imageGeneration.success = true;
    results.imageGeneration.response = {
      imageDataLength: imageData.length,
      mimeType: mimeType
    };
  } catch (error: any) {
    console.error('❌ Image Generation: FAILED');
    console.error('   Error:', error.message);
    results.imageGeneration.error = error.message;
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SECONDARY ACCOUNT TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`   Credentials Loaded:     ${results.credentialsLoaded ? '✅' : '❌'}`);
  console.log(`   Authentication:         ${results.authentication.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`   Text Generation:        ${results.textGeneration.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`   Image Generation:       ${results.imageGeneration.success ? '✅ WORKING' : '❌ FAILED'}`);
  console.log('='.repeat(80) + '\n');

  let status = 'FAILED';
  let emoji = '❌';
  
  if (results.textGeneration.success && results.imageGeneration.success) {
    status = 'FULLY_WORKING';
    emoji = '🎉';
    console.log('🎉 SECONDARY ACCOUNT IS FULLY OPERATIONAL!\n');
  } else if (results.authentication.success) {
    status = 'PARTIAL';
    emoji = '⚠️';
    console.log('⚠️  Authentication works but some API calls failed\n');
  } else {
    console.log('❌ SECONDARY ACCOUNT HAS ISSUES\n');
  }

  return NextResponse.json({
    status,
    emoji,
    timestamp: new Date().toISOString(),
    serviceAccount: credentials.client_email,
    projectId,
    location,
    results
  });
}
