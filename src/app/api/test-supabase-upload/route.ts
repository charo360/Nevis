import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test] Testing Supabase upload...');
    
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('🧪 [Test] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });
    
    // Create a simple test image (1x1 red pixel)
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const testDataUrl = `data:image/png;base64,${testImageData}`;
    
    console.log('🧪 [Test] Test data URL created, length:', testDataUrl.length);
    
    const { SupabasePostStorageService } = await import('@/lib/services/supabase-post-storage');
    const storageService = new SupabasePostStorageService();
    
    const uploadResult = await storageService.uploadImageFromDataUrl(
      testDataUrl,
      'test-user-id',
      'test-brand-id',
      `test-${Date.now()}.png`
    );
    
    console.log('🧪 [Test] Upload result:', uploadResult);
    
    return NextResponse.json({
      success: uploadResult.success,
      url: uploadResult.url,
      error: uploadResult.error,
      message: uploadResult.success ? 'Supabase upload working!' : 'Supabase upload failed',
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0
      }
    });
    
  } catch (error) {
    console.error('🧪 [Test] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to test Supabase upload' });
}
