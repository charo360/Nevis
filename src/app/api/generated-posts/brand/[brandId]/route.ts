// API route for brand-specific generated posts (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Server-side Supabase client for reading posts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/generated-posts/brand/[brandId] - Get posts for specific brand
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    // Extract user ID from Supabase access token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      // Verify the Supabase access token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('❌ Supabase token verification failed:', error);
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    } catch (authError) {
      console.error('❌ Token verification error:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const { brandId } = await params;

    // Query posts from Supabase database for specific brand
    const { data: posts, error } = await supabase
      .from('generated_posts')
      .select(`
        id,
        user_id,
        brand_profile_id,
        content,
        hashtags,
        image_text,
        image_url,
        image_path,
        image_metadata,
        platform,
        aspect_ratio,
        generation_model,
        generation_prompt,
        generation_settings,
        variants,
        catchy_words,
        subheadline,
        call_to_action,
        video_url,
        status,
        engagement_metrics,
        created_at,
        updated_at,
        published_at
      `)
      .eq('user_id', userId)
      .eq('brand_profile_id', brandId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to load brand posts' },
        { status: 500 }
      );
    }

    // Transform posts to match expected client format
    const transformedPosts = (posts || []).map((post: any) => ({
      id: post.id,
      userId: post.user_id,
      brandProfileId: post.brand_profile_id,
      content: typeof post.content === 'string' ? post.content : (post.content?.text || ''),
      hashtags: post.hashtags,
      imageUrl: post.image_url,
      platform: post.platform || 'instagram',
      variants: typeof post.variants === 'string' ? JSON.parse(post.variants) : post.variants,
      catchyWords: post.catchy_words,
      subheadline: post.subheadline,
      callToAction: post.call_to_action,
      videoUrl: post.video_url,
      status: post.status || 'generated',
      date: post.created_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      publishedAt: post.published_at,
      qualityScore: post.engagement_metrics?.quality_score,
      engagementPrediction: post.engagement_metrics?.engagement_prediction,
      metadata: {
        generationModel: post.generation_model,
        generationPrompt: post.generation_prompt,
        generationSettings: post.generation_settings
      }
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error loading brand posts:', error);
    return NextResponse.json(
      { error: 'Failed to load brand posts' },
      { status: 500 }
    );
  }
}
