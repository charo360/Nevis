// API routes for generated posts management
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/services/supabase-service';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to upload data URL to Supabase Storage
async function uploadDataUrlToSupabase(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('📤 Uploading image to Supabase Storage:', fileName);

    // Convert data URL to buffer
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload to Supabase Storage
    const uploadPath = `generated-content/${userId}/${fileName}`;
    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    console.log('✅ Image uploaded to Supabase Storage:', publicUrl);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Supabase Storage upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// GET /api/generated-posts - Load user's generated posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100'); // Increased from 10 to 100
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Load posts from Supabase
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error loading posts from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to load posts' },
        { status: 500 }
      );
    }

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Error loading generated posts:', error);
    return NextResponse.json(
      { error: 'Failed to load generated posts' },
      { status: 500 }
    );
  }
}

// POST /api/generated-posts - Create new generated post
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: received POST to save generated post');

    let requestData;
    try {
      requestData = await request.json();
    } catch (jsonError) {
      console.error('❌ API: Failed to parse JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    // console.debug('API: request data suppressed');
    // console.debug('API: request summary suppressed');

    const { post, userId, brandProfileId } = requestData;
    console.log('📝 API: Request data received:', {
      hasPost: !!post,
      userId: userId,
      brandProfileId: brandProfileId,
      postId: post?.id,
      platform: post?.platform
    });

    if (!userId || !brandProfileId) {
      console.error('❌ API: Missing required fields:', { userId: !!userId, brandProfileId: !!brandProfileId });
      return NextResponse.json(
        { error: 'User ID and brand profile ID are required' },
        { status: 400 }
      );
    }

    if (!post) {
      console.error('❌ API: Missing post data');
      return NextResponse.json(
        { error: 'Post data is required' },
        { status: 400 }
      );
    }

    // console.debug('API: processing images');

    // Process images with Supabase Storage if they exist
    let processedPost = { ...post };
    if (post.imageUrl && post.imageUrl.startsWith('data:')) {
      console.log('📤 Uploading main image to Supabase Storage');
      const imageResult = await uploadDataUrlToSupabase(
        post.imageUrl,
        userId,
        `post-${post.id || Date.now()}-main.png`
      );

      if (imageResult.success && imageResult.url) {
        processedPost.imageUrl = imageResult.url;
        console.log('✅ Main image uploaded to Supabase Storage');
      } else {
        console.error('❌ Failed to upload main image:', imageResult.error);
      }
    }

    // Process content image if it exists
    if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:')) {
      console.log('📤 Uploading content image to Supabase Storage');
      const contentImageResult = await uploadDataUrlToSupabase(
        post.content.imageUrl,
        userId,
        `post-${post.id || Date.now()}-content.png`
      );

      if (contentImageResult.success && contentImageResult.url) {
        processedPost.content = {
          ...processedPost.content,
          imageUrl: contentImageResult.url
        };
        console.log('✅ Content image uploaded to Supabase Storage');
      } else {
        console.error('❌ Failed to upload content image:', contentImageResult.error);
      }
    }
    // Upload variant images (handles Revo 1.0 which sets images only in variants)
    if (Array.isArray(post.variants) && post.variants.length > 0) {
      const updatedVariants: any[] = [];
      for (let i = 0; i < post.variants.length; i++) {
        const v: any = post.variants[i] || {};
        if (v.imageUrl && typeof v.imageUrl === 'string' && v.imageUrl.startsWith('data:')) {
          const variantResult = await uploadDataUrlToSupabase(
            v.imageUrl,
            userId,
            `post-${post.id || Date.now()}-variant-${i}-${(v.platform || 'instagram').toLowerCase()}.png`
          );
          if (variantResult.success && variantResult.url) {
            updatedVariants.push({ ...v, imageUrl: variantResult.url });
            // If no main imageUrl set yet, use the first variant URL as primary
            if (!processedPost.imageUrl) processedPost.imageUrl = variantResult.url;
          } else {
            console.error('❌ Failed to upload variant image:', variantResult.error);
            updatedVariants.push(v);
          }
        } else {
          updatedVariants.push(v);
        }
      }
      processedPost.variants = updatedVariants;
    }


    console.log('💾 API: saving post to Supabase');

    // Convert to Supabase format
    const supabasePost = {
      user_id: userId,
      brand_id: brandProfileId,
      platform: processedPost.platform || 'instagram',
      content: {
        text: processedPost.content?.text || processedPost.content || '',
        hashtags: processedPost.hashtags || processedPost.content?.hashtags || [],
        mentions: processedPost.content?.mentions || [],
        imageUrl: processedPost.content?.imageUrl || processedPost.imageUrl,
        catchyWords: processedPost.catchyWords,
        subheadline: processedPost.subheadline,
        callToAction: processedPost.callToAction,
        variants: processedPost.variants || []
      },
      image_urls: processedPost.imageUrl ? [processedPost.imageUrl] : [],
      metadata: {
        businessType: processedPost.metadata?.businessType,
        visualStyle: processedPost.metadata?.visualStyle,
        targetAudience: processedPost.metadata?.targetAudience,
        generationPrompt: processedPost.metadata?.generationPrompt,
        aiModel: processedPost.metadata?.aiModel || 'unknown',
        postType: processedPost.postType || 'post',
        analytics: processedPost.analytics,
        status: processedPost.status || 'draft'
      }
    };

    // Save to Supabase
    try {
      const { data: savedPost, error } = await supabase
        .from('posts')
        .insert([supabasePost])
        .select()
        .single();

      if (error) {
        console.error('❌ API: Error saving to Supabase:', error);
        return NextResponse.json(
          { error: `Failed to save post: ${error.message}` },
          { status: 500 }
        );
      }

      console.log('✅ API: post saved to Supabase:', savedPost.id);

      return NextResponse.json({
        success: true,
        id: savedPost.id,
        post: {
          ...processedPost,
          id: savedPost.id
        }
      });
    } catch (supabaseError) {
      console.error('❌ API: Error saving to Supabase:', supabaseError);
      return NextResponse.json(
        { error: `Failed to save post: ${supabaseError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ API: Error saving generated post:', error);
    console.error('❌ API: Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: `Failed to save generated post: ${error.message}` },
      { status: 500 }
    );
  }
}
