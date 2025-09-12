// API routes for generated posts management
import { NextRequest, NextResponse } from 'next/server';
import { generatedPostService } from '@/lib/mongodb/database';
import type { GeneratedPost } from '@/lib/mongodb/services/generated-post-service';
import { uploadDataUrlAsImage } from '@/lib/mongodb/storage';

// Helper function to upload data URL to MongoDB GridFS
async function uploadDataUrlToMongoDB(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('📤 Uploading image to MongoDB GridFS:', fileName);

    // Upload to MongoDB GridFS using the storage service
    const result = await uploadDataUrlAsImage(dataUrl, fileName, userId, undefined, {
      category: 'generated-content'
    });

    console.log('✅ Image uploaded to MongoDB GridFS:', result.url);
    return { success: true, url: result.url };
  } catch (error) {
    console.error('❌ MongoDB GridFS upload error:', error);
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

    // Process images with MongoDB GridFS if they exist
    let processedPost = { ...post };
    if (post.imageUrl && post.imageUrl.startsWith('data:')) {
      console.log('📤 Uploading main image to MongoDB GridFS');
      const imageResult = await uploadDataUrlToMongoDB(
        post.imageUrl,
        userId,
        `post-${post.id || Date.now()}-main.png`
      );

      if (imageResult.success && imageResult.url) {
        processedPost.imageUrl = imageResult.url;
        console.log('✅ Main image uploaded to MongoDB GridFS');
      } else {
        console.error('❌ Failed to upload main image:', imageResult.error);
      }
    }

    // Process content image if it exists
    if (post.content?.imageUrl && post.content.imageUrl.startsWith('data:')) {
      console.log('📤 Uploading content image to MongoDB GridFS');
      const contentImageResult = await uploadDataUrlToMongoDB(
        post.content.imageUrl,
        userId,
        `post-${post.id || Date.now()}-content.png`
      );

      if (contentImageResult.success && contentImageResult.url) {
        processedPost.content = {
          ...processedPost.content,
          imageUrl: contentImageResult.url
        };
        console.log('✅ Content image uploaded to MongoDB GridFS');
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
          const variantResult = await uploadDataUrlToMongoDB(
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


    console.log('💾 API: saving post to MongoDB');

    // Convert to MongoDB format
    const mongoPost: Partial<GeneratedPost> = {
      userId,
      brandProfileId,
      platform: processedPost.platform || 'instagram',
      postType: processedPost.postType || 'post',
      content: {
        text: processedPost.content?.text || processedPost.content || '',
        hashtags: processedPost.hashtags || processedPost.content?.hashtags || [],
        mentions: processedPost.content?.mentions || [],
        imageUrl: processedPost.content?.imageUrl || processedPost.imageUrl
      },
      imageUrl: processedPost.imageUrl,
      variants: processedPost.variants || [],
      catchyWords: processedPost.catchyWords,
      subheadline: processedPost.subheadline,
      callToAction: processedPost.callToAction,
      metadata: {
        businessType: processedPost.metadata?.businessType,
        visualStyle: processedPost.metadata?.visualStyle,
        targetAudience: processedPost.metadata?.targetAudience,
        generationPrompt: processedPost.metadata?.generationPrompt,
        aiModel: processedPost.metadata?.aiModel || 'unknown'
      },
      analytics: processedPost.analytics,
      status: processedPost.status || 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to MongoDB
    try {
      const savedPost = await generatedPostService.create(mongoPost);
      console.log('✅ API: post saved to MongoDB:', savedPost.id);

      return NextResponse.json({
        success: true,
        id: savedPost.id,
        post: {
          ...processedPost,
          id: savedPost.id
        }
      });
    } catch (mongoError) {
      console.error('❌ API: Error saving to MongoDB:', mongoError);
      return NextResponse.json(
        { error: `Failed to save post: ${mongoError.message}` },
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
