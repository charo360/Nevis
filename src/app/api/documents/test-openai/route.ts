import { NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * GET /api/documents/test-openai
 * Test OpenAI connection and file upload capability
 */
export async function GET() {
  try {
    console.log('🧪 Testing OpenAI connection...');

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured in .env.local',
      }, { status: 500 });
    }

    console.log('✅ API key found');

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('✅ OpenAI client initialized');

    // Test 1: List models (simple API call)
    console.log('🧪 Test 1: Listing models...');
    try {
      const models = await openai.models.list();
      const modelCount = models.data.length;
      console.log(`✅ Successfully connected to OpenAI (${modelCount} models available)`);
    } catch (error: any) {
      console.error('❌ Failed to list models:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to OpenAI API',
        details: error?.message || error?.toString(),
        hint: 'Check if your API key is valid',
      }, { status: 500 });
    }

    // Test 2: Create a small test file
    console.log('🧪 Test 2: Creating test file...');
    try {
      const testContent = 'This is a test document for OpenAI file upload verification.';
      const testFile = new File([testContent], 'test-document.txt', { type: 'text/plain' });

      const uploadedFile = await openai.files.create({
        file: testFile,
        purpose: 'assistants',
      });

      console.log(`✅ Test file uploaded: ${uploadedFile.id}`);

      // Clean up - delete the test file
      try {
        await openai.files.del(uploadedFile.id);
        console.log('✅ Test file deleted');
      } catch (deleteError) {
        console.warn('⚠️ Could not delete test file (this is OK)');
      }

      return NextResponse.json({
        success: true,
        message: 'OpenAI connection and file upload working correctly',
        tests: {
          apiConnection: '✅ Success',
          fileUpload: '✅ Success',
          testFileId: uploadedFile.id,
        },
      });

    } catch (error: any) {
      console.error('❌ Failed to upload test file:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file to OpenAI',
        details: error?.message || error?.toString(),
        hint: 'Check if your API key has file upload permissions',
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'OpenAI test failed',
      details: error?.message || error?.toString(),
    }, { status: 500 });
  }
}

