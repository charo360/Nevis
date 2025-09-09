// API routes for brand-specific generated posts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET /api/generated-posts/brand/[brandId] - Get posts for specific brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const { brandId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Load posts from Supabase for specific brand
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading brand posts from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to load brand posts' },
        { status: 500 }
      );
    }

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Error loading brand posts:', error);
    return NextResponse.json(
      { error: 'Failed to load brand posts' },
      { status: 500 }
    );
  }
}
