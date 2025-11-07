import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

/**
 * GET /api/documents/test-storage
 * Test Supabase storage configuration and bucket access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    console.log('🔍 Testing Supabase storage...');
    
    // Test 1: Check if client is initialized
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not initialized',
        tests: {
          clientInitialized: false
        }
      });
    }
    
    console.log('✅ Supabase client initialized');
    
    // Test 2: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${bucketsError.message}`,
        tests: {
          clientInitialized: true,
          bucketsAccessible: false,
          errorDetails: bucketsError
        }
      });
    }
    
    console.log('✅ Buckets accessible:', buckets);
    
    // Test 3: Check if nevis-storage bucket exists
    const nevisStorageBucket = buckets?.find(b => b.name === 'nevis-storage');
    
    if (!nevisStorageBucket) {
      console.warn('⚠️  nevis-storage bucket not found');
      return NextResponse.json({
        success: false,
        error: 'nevis-storage bucket does not exist',
        tests: {
          clientInitialized: true,
          bucketsAccessible: true,
          nevisStorageBucketExists: false,
          availableBuckets: buckets?.map(b => b.name) || []
        },
        instructions: 'Please create a bucket named "nevis-storage" in your Supabase dashboard'
      });
    }
    
    console.log('✅ nevis-storage bucket exists');
    
    // Test 4: Try to list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('nevis-storage')
      .list('', { limit: 1 });
    
    if (filesError) {
      console.error('❌ Failed to list files:', filesError);
      return NextResponse.json({
        success: false,
        error: `Failed to list files: ${filesError.message}`,
        tests: {
          clientInitialized: true,
          bucketsAccessible: true,
          nevisStorageBucketExists: true,
          canListFiles: false,
          errorDetails: filesError
        }
      });
    }
    
    console.log('✅ Can list files in bucket');
    
    // All tests passed
    return NextResponse.json({
      success: true,
      message: 'Supabase storage is properly configured',
      tests: {
        clientInitialized: true,
        bucketsAccessible: true,
        nevisStorageBucketExists: true,
        canListFiles: true
      },
      bucketInfo: nevisStorageBucket,
      fileCount: files?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Storage test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during storage test',
        tests: {
          clientInitialized: false
        }
      },
      { status: 500 }
    );
  }
}

