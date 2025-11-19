/**
 * Test BOTH Vertex AI Accounts Separately
 * Verifies that both primary and secondary accounts work and are from different Google accounts
 */

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  success: boolean;
  error: string | null;
  response?: any;
}

interface AccountResults {
  credentialsLoaded: boolean;
  serviceAccount: string | null;
  projectId: string | null;
  location: string | null;
  authentication: TestResult;
  textGeneration: TestResult;
  imageGeneration: TestResult;
}

async function getAccessToken(credentials: any): Promise<string> {
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
    const errorText = await response.text();
    throw new Error(`Token request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

async function testTextGeneration(projectId: string, location: string, accessToken: string, accountName: string): Promise<TestResult> {
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
          parts: [{ text: `Say "Hello from ${accountName} Vertex AI" in exactly 5 words.` }]
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
    
    return { success: true, error: null, response: text };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function testImageGeneration(projectId: string, location: string, accessToken: string, accountName: string): Promise<TestResult> {
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
          parts: [{ text: `Create a simple test image with the text "${accountName} Test" on a gradient background` }]
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

    return { 
      success: true, 
      error: null, 
      response: {
        imageDataLength: imageData.length,
        mimeType: mimeType
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 TESTING BOTH VERTEX AI ACCOUNTS (PRIMARY & SECONDARY)');
  console.log('='.repeat(100) + '\n');

  const primaryResults: AccountResults = {
    credentialsLoaded: false,
    serviceAccount: null,
    projectId: null,
    location: null,
    authentication: { success: false, error: null },
    textGeneration: { success: false, error: null },
    imageGeneration: { success: false, error: null }
  };

  const secondaryResults: AccountResults = {
    credentialsLoaded: false,
    serviceAccount: null,
    projectId: null,
    location: null,
    authentication: { success: false, error: null },
    textGeneration: { success: false, error: null },
    imageGeneration: { success: false, error: null }
  };

  // ========== TEST PRIMARY ACCOUNT ==========
  console.log('🔵 PRIMARY ACCOUNT TEST');
  console.log('='.repeat(100));

  try {
    // Load primary credentials from environment variable
    const envCreds = process.env.VERTEX_AI_CREDENTIALS;
    if (!envCreds) {
      throw new Error('VERTEX_AI_CREDENTIALS not found in environment');
    }

    const credentials = JSON.parse(envCreds);
    const projectId = process.env.VERTEX_AI_PROJECT_ID || credentials.project_id;
    const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

    primaryResults.credentialsLoaded = true;
    primaryResults.serviceAccount = credentials.client_email;
    primaryResults.projectId = projectId;
    primaryResults.location = location;

    console.log('✅ Primary credentials loaded');
    console.log(`   Service Account: ${credentials.client_email}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Location: ${location}\n`);

    // Test authentication
    console.log('🔐 Testing authentication...');
    try {
      const accessToken = await getAccessToken(credentials);
      primaryResults.authentication.success = true;
      console.log('✅ Authentication successful\n');

      // Test text generation
      console.log('📝 Testing text generation...');
      primaryResults.textGeneration = await testTextGeneration(projectId, location, accessToken, 'Primary');
      if (primaryResults.textGeneration.success) {
        console.log('✅ Text generation successful');
        console.log(`   Response: ${primaryResults.textGeneration.response}\n`);
      } else {
        console.log('❌ Text generation failed');
        console.log(`   Error: ${primaryResults.textGeneration.error}\n`);
      }

      // Test image generation
      console.log('🖼️  Testing image generation...');
      primaryResults.imageGeneration = await testImageGeneration(projectId, location, accessToken, 'Primary');
      if (primaryResults.imageGeneration.success) {
        console.log('✅ Image generation successful');
        console.log(`   Image data length: ${primaryResults.imageGeneration.response?.imageDataLength} characters`);
        console.log(`   MIME type: ${primaryResults.imageGeneration.response?.mimeType}\n`);
      } else {
        console.log('❌ Image generation failed');
        console.log(`   Error: ${primaryResults.imageGeneration.error}\n`);
      }
    } catch (error: any) {
      primaryResults.authentication.error = error.message;
      console.log('❌ Authentication failed');
      console.log(`   Error: ${error.message}\n`);
    }
  } catch (error: any) {
    console.log('❌ Failed to load primary credentials');
    console.log(`   Error: ${error.message}\n`);
  }

  // ========== TEST SECONDARY ACCOUNT ==========
  console.log('🟢 SECONDARY ACCOUNT TEST');
  console.log('='.repeat(100));

  if (process.env.VERTEX_AI_SECONDARY_ENABLED !== 'true') {
    console.log('⚠️  Secondary account is disabled (VERTEX_AI_SECONDARY_ENABLED != true)\n');
  } else {
    try {
      const keyFile = process.env.VERTEX_AI_SECONDARY_KEY_FILE || 'vertex-ai-secondary-credentials.json';
      const credentialsPath = join(process.cwd(), keyFile);
      const credentialsData = readFileSync(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsData);
      const projectId = process.env.VERTEX_AI_SECONDARY_PROJECT_ID || credentials.project_id;
      const location = process.env.VERTEX_AI_SECONDARY_LOCATION || 'us-central1';

      secondaryResults.credentialsLoaded = true;
      secondaryResults.serviceAccount = credentials.client_email;
      secondaryResults.projectId = projectId;
      secondaryResults.location = location;

      console.log('✅ Secondary credentials loaded');
      console.log(`   Service Account: ${credentials.client_email}`);
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Location: ${location}\n`);

      // Test authentication
      console.log('🔐 Testing authentication...');
      try {
        const accessToken = await getAccessToken(credentials);
        secondaryResults.authentication.success = true;
        console.log('✅ Authentication successful\n');

        // Test text generation
        console.log('📝 Testing text generation...');
        secondaryResults.textGeneration = await testTextGeneration(projectId, location, accessToken, 'Secondary');
        if (secondaryResults.textGeneration.success) {
          console.log('✅ Text generation successful');
          console.log(`   Response: ${secondaryResults.textGeneration.response}\n`);
        } else {
          console.log('❌ Text generation failed');
          console.log(`   Error: ${secondaryResults.textGeneration.error}\n`);
        }

        // Test image generation
        console.log('🖼️  Testing image generation...');
        secondaryResults.imageGeneration = await testImageGeneration(projectId, location, accessToken, 'Secondary');
        if (secondaryResults.imageGeneration.success) {
          console.log('✅ Image generation successful');
          console.log(`   Image data length: ${secondaryResults.imageGeneration.response?.imageDataLength} characters`);
          console.log(`   MIME type: ${secondaryResults.imageGeneration.response?.mimeType}\n`);
        } else {
          console.log('❌ Image generation failed');
          console.log(`   Error: ${secondaryResults.imageGeneration.error}\n`);
        }
      } catch (error: any) {
        secondaryResults.authentication.error = error.message;
        console.log('❌ Authentication failed');
        console.log(`   Error: ${error.message}\n`);
      }
    } catch (error: any) {
      console.log('❌ Failed to load secondary credentials');
      console.log(`   Error: ${error.message}\n`);
    }
  }

  // ========== COMPARISON & SUMMARY ==========
  console.log('='.repeat(100));
  console.log('📊 COMPARISON & SUMMARY');
  console.log('='.repeat(100));

  // Check if accounts are different
  const accountsAreDifferent = primaryResults.serviceAccount !== secondaryResults.serviceAccount;
  const projectsAreDifferent = primaryResults.projectId !== secondaryResults.projectId;

  console.log('\n🔍 Account Verification:');
  console.log(`   Different Service Accounts: ${accountsAreDifferent ? '✅ YES' : '❌ NO (SAME ACCOUNT!)'}`);
  console.log(`   Different Projects:         ${projectsAreDifferent ? '✅ YES' : '❌ NO (SAME PROJECT!)'}`);
  
  if (primaryResults.serviceAccount && secondaryResults.serviceAccount) {
    console.log(`\n   Primary:   ${primaryResults.serviceAccount} (${primaryResults.projectId})`);
    console.log(`   Secondary: ${secondaryResults.serviceAccount} (${secondaryResults.projectId})`);
  }

  console.log('\n📋 Primary Account Status:');
  console.log(`   Credentials:      ${primaryResults.credentialsLoaded ? '✅' : '❌'}`);
  console.log(`   Authentication:   ${primaryResults.authentication.success ? '✅' : '❌'}`);
  console.log(`   Text Generation:  ${primaryResults.textGeneration.success ? '✅' : '❌'}`);
  console.log(`   Image Generation: ${primaryResults.imageGeneration.success ? '✅' : '❌'}`);

  console.log('\n📋 Secondary Account Status:');
  console.log(`   Credentials:      ${secondaryResults.credentialsLoaded ? '✅' : '❌'}`);
  console.log(`   Authentication:   ${secondaryResults.authentication.success ? '✅' : '❌'}`);
  console.log(`   Text Generation:  ${secondaryResults.textGeneration.success ? '✅' : '❌'}`);
  console.log(`   Image Generation: ${secondaryResults.imageGeneration.success ? '✅' : '❌'}`);

  console.log('\n' + '='.repeat(100));

  // Determine overall status
  let status = 'FAILED';
  let emoji = '❌';
  let message = '';

  const primaryWorking = primaryResults.authentication.success && primaryResults.textGeneration.success;
  const secondaryWorking = secondaryResults.authentication.success && secondaryResults.textGeneration.success;

  if (primaryWorking && secondaryWorking && accountsAreDifferent) {
    status = 'BOTH_WORKING';
    emoji = '🎉';
    message = 'Both accounts are working and are from different Google accounts!';
    console.log(`🎉 ${message}\n`);
  } else if (primaryWorking && !secondaryResults.credentialsLoaded) {
    status = 'PRIMARY_ONLY';
    emoji = '⚠️';
    message = 'Primary account works, secondary not configured';
    console.log(`⚠️  ${message}\n`);
  } else if (primaryWorking && secondaryWorking && !accountsAreDifferent) {
    status = 'SAME_ACCOUNT_WARNING';
    emoji = '⚠️';
    message = 'Both accounts work but they appear to be the SAME account!';
    console.log(`⚠️  ${message}\n`);
  } else if (primaryWorking) {
    status = 'PRIMARY_ONLY';
    emoji = '⚠️';
    message = 'Only primary account is working';
    console.log(`⚠️  ${message}\n`);
  } else if (secondaryWorking) {
    status = 'SECONDARY_ONLY';
    emoji = '⚠️';
    message = 'Only secondary account is working';
    console.log(`⚠️  ${message}\n`);
  } else {
    message = 'Neither account is working properly';
    console.log(`❌ ${message}\n`);
  }

  return NextResponse.json({
    status,
    emoji,
    message,
    timestamp: new Date().toISOString(),
    accountsAreDifferent,
    projectsAreDifferent,
    primary: primaryResults,
    secondary: secondaryResults
  });
}

