import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    console.log('Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    console.log('Connection test result:', { connectionTest, connectionError });

    // Test if we can create a simple record
    console.log('Testing insert capability...');
    const { data: insertTest, error: insertError } = await supabase
      .from('posts')
      .insert({
        user_id: 'test-user',
        brand_id: 'test-brand',
        platform: 'instagram',
        content: { text: 'test', hashtags: [], mentions: [] },
        image_urls: [],
        metadata: { postType: 'test' }
      })
      .select()
      .single();

    console.log('Insert test result:', { insertTest, insertError });

    // Test storage bucket
    console.log('Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      details: {
        connectionTest: !!connectionTest,
        connectionError: connectionError?.message || null,
        insertTest: !!insertTest,
        insertError: insertError?.message || null,
        buckets: buckets?.map(b => b.name) || [],
        bucketError: bucketError?.message || null
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: {
        message: error.message,
        name: error.name
      }
    }, { status: 500 });
  }
}
