import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';

/**
 * POST /api/documents/init-storage
 * Initialize Supabase storage bucket if it doesn't exist
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    console.log('🔧 Initializing Supabase storage...');

    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase client not initialized'
      }, { status: 500 });
    }

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return NextResponse.json({
        success: false,
        error: `Failed to list buckets: ${listError.message}`
      }, { status: 500 });
    }

    const bucketExists = buckets?.some(b => b.name === 'nevis-storage');

    if (bucketExists) {
      console.log('✅ nevis-storage bucket already exists');
      return NextResponse.json({
        success: true,
        message: 'Storage bucket already exists',
        bucketName: 'nevis-storage'
      });
    }

    // Create the bucket
    console.log('📦 Creating nevis-storage bucket...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('nevis-storage', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'image/*',
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
    });

    if (createError) {
      console.error('❌ Failed to create bucket:', createError);
      return NextResponse.json({
        success: false,
        error: `Failed to create bucket: ${createError.message}`,
        details: createError
      }, { status: 500 });
    }

    console.log('✅ Successfully created nevis-storage bucket');

    return NextResponse.json({
      success: true,
      message: 'Storage bucket created successfully',
      bucketName: 'nevis-storage',
      bucket: newBucket
    });

  } catch (error) {
    console.error('❌ Storage initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during storage initialization'
      },
      { status: 500 }
    );
  }
}

