/**
 * Test API endpoint for the analyzeBrandAction server action
 * This tests the actual function that the UI calls
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeBrandAction } from '@/app/actions';

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, designImageUris = [] } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: 'Website URL is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Testing analyzeBrandAction server action...');
    console.log(`📡 Website URL: ${websiteUrl}`);
    console.log(`🖼️ Design Images: ${designImageUris.length}`);

    // Call the actual server action that the UI uses
    const result = await analyzeBrandAction(websiteUrl, designImageUris);

    console.log('✅ analyzeBrandAction completed');
    console.log(`📊 Success: ${result.success}`);

    if (result.success) {
      console.log(`   Business Name: ${result.data.businessName}`);
      console.log(`   Business Type: ${result.data.businessType}`);
    } else {
      console.log(`   Error: ${result.error}`);
      console.log(`   Error Type: ${result.errorType}`);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test analyzeBrandAction Server Action',
    description: 'POST to this endpoint to test the server action that the UI uses',
    usage: {
      method: 'POST',
      body: {
        websiteUrl: 'https://example.com',
        designImageUris: ['optional array of image URLs']
      }
    },
    status: 'ready'
  });
}
