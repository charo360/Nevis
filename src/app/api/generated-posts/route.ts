// API routes for generated posts management
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to upload data URL to Supabase Storage
async function uploadDataUrlToSupabase(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const bucket = 'images';
  const filePath = `generated-content/${userId}/${fileName}`;
  try {
    // Convert data URL to buffer
    const base64Data = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Try upload to Supabase Storage
    let { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    // If bucket missing, try to create it (requires service role key)
    if (error && (error.message?.toLowerCase().includes('bucket not found') || (error as any).statusCode === '404')) {
      console.warn('⚠️ Supabase Storage bucket missing. Attempting to create bucket:', bucket);
      const { error: createErr } = await supabase.storage.createBucket(bucket, { public: true });
      if (createErr) {
        console.error('❌ Failed to create bucket:', createErr);
        return { success: false, error: createErr.message };
      }
      // Retry upload once after creating the bucket
      ({ error } = await supabase.storage
        .from(bucket)
        .upload(filePath, buffer, { contentType: 'image/png', upsert: true }));
    }

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = publicData?.publicUrl;
    // console.debug('Image uploaded to storage:', publicUrl);
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Upload error:', error);
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
    // console.debug('API: received POST to save generated post');

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
      // console.debug('Uploading main image to storage');
      const imageResult = await uploadDataUrlToSupabase(
        post.imageUrl,
        userId,
        `post-${post.id || Date.now()}-main.png`
      );

      if (imageResult.success && imageResult.url) {
        processedPost.imageUrl = imageResult.url;
        // console.debug('Main image uploaded to storage');
      } else {
        console.error('❌ Failed to upload main image:', imageResult.error);
      }
    }

    // Process content image if it exists
    if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:')) {
      // console.debug('Uploading content image to storage');
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
        // console.debug('Content image uploaded to storage');
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


    // console.debug('API: saving post');

    // Save to Supabase
    const { data: insertedData, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        brand_id: brandProfileId,
        platform: processedPost.platform || 'instagram', // Default platform
        content: {
          text: processedPost.content?.text || '',
          hashtags: processedPost.content?.hashtags || [],
          mentions: processedPost.content?.mentions || [],
          imageUrl: processedPost.content?.imageUrl
        },
        image_urls: [
          ...(processedPost.imageUrl ? [processedPost.imageUrl] : []),
          ...(Array.isArray(processedPost.variants)
            ? processedPost.variants
              .map((v: any) => v?.imageUrl)
              .filter((u: any) => typeof u === 'string' && u.length > 0)
            : [])
        ],
        metadata: {
          postType: processedPost.postType || 'post',
          status: processedPost.status || 'generated',
          aiModel: processedPost.metadata?.aiModel || 'unknown',
          businessType: processedPost.metadata?.businessType,
          variants: processedPost.variants || []
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ API: Error saving to Supabase:', error);
      return NextResponse.json(
        { error: `Failed to save post: ${error.message}` },
        { status: 500 }
      );
    }

    // console.debug('API: post saved', insertedData.id);

    // Best-effort: record uploaded image URLs in a lightweight images table for persistence/debugging
    try {
      const urls: string[] = [];
      if (processedPost.imageUrl) urls.push(processedPost.imageUrl);
      if (processedPost.content?.imageUrl) urls.push(processedPost.content.imageUrl);
      if (urls.length) {
        await supabase.from('images').insert(urls.map((url) => ({ user_id: userId, url })));
      }
    } catch (e) {
      console.warn('⚠️ API: Failed to insert into images table (optional):', e);
    }

    return NextResponse.json({
      success: true,
      id: insertedData.id,
      post: processedPost // Return the processed post with updated image URLs
    });
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
