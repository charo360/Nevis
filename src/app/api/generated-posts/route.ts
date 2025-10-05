// API routes for generated posts management
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Server-side Supabase client for reading posts
const supabaseRead = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server-side Supabase client (for image storage only) - using service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// MongoDB-based storage with Supabase for images only

// Helper function to convert MongoDB user ID to Supabase UUID
function convertMongoIdToUuid(mongoUserId: string): string {
  // Map known MongoDB user IDs to their Supabase UUIDs
  const userIdMap: { [key: string]: string } = {
    'user_1756919792493_bvxvnk1hs': '58b4d78d-cb90-49ef-9524-7238aea00168', // Your actual user
    'user_1757090229862_jgzj8xof1': '58b4d78d-cb90-49ef-9524-7238aea00168', // Test user (same UUID)
  };

  return userIdMap[mongoUserId] || '58b4d78d-cb90-49ef-9524-7238aea00168'; // Default to your UUID
}

// Helper function to upload data URL to Supabase Storage
async function uploadDataUrlToSupabase(dataUrl: string, userId: string, fileName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('📤 Uploading image to Supabase Storage:', fileName);
    console.log('🔧 Using service role client for storage upload');

    // Convert data URL to buffer
    const base64Data = dataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid data URL format' };
    }

    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📦 Buffer size: ${buffer.length} bytes`);

    // Upload to Supabase Storage using service role (bypasses RLS)
    // Using public folder to match existing storage policies
    const uploadPath = `public/${fileName}`;
    console.log(`🎯 Upload path: ${uploadPath}`);

    const { data, error } = await supabase.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true,
        // Explicitly bypass RLS with service role
        duplex: 'half'
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      });

      // Provide more specific error information
      if (error.message?.includes('row-level security policy')) {
        return {
          success: false,
          error: 'Storage permission error - RLS policy blocking upload. Please check Supabase storage policies or disable RLS for development.'
        };
      }

      return { success: false, error: error.message };
    }

    console.log('✅ Upload successful:', data);

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
    console.log('🔄 API: received GET request to load generated posts');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('⚠️  API: No auth header found, checking URL parameters...');
      const urlUserId = searchParams.get('userId');
      if (urlUserId) {
        console.log('🔄 API: Using URL userId for development:', urlUserId);
        userId = urlUserId;
      } else {
        return NextResponse.json(
          { error: 'Authorization token or userId parameter required' },
          { status: 401 }
        );
      }
    } else {
      const token = authHeader.substring(7);

      try {
        // Try Supabase authentication first
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

        if (error || !user) {
          // Fallback to MongoDB JWT authentication
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            userId = decoded.userId;
            console.log('✅ API: MongoDB JWT authentication successful for user:', userId);
          } catch (jwtError) {
            console.log('❌ API: Both Supabase and JWT verification failed');
            const urlUserId = searchParams.get('userId');
            if (urlUserId) {
              console.log('🔄 API: Using URL userId as fallback:', urlUserId);
              userId = urlUserId;
            } else {
              return NextResponse.json(
                { error: 'Invalid token and no userId parameter' },
                { status: 401 }
              );
            }
          }
        } else {
          userId = user.id;
          console.log('✅ API: Supabase authentication successful for user:', user.id);
        }
      } catch (authError) {
        console.log('⚠️  API: Authentication error, using URL fallback...', authError);
        const urlUserId = searchParams.get('userId');
        if (urlUserId) {
          console.log('🔄 API: Using URL userId as fallback:', urlUserId);
          userId = urlUserId;
        } else {
          return NextResponse.json(
            { error: 'Authentication failed and no userId parameter' },
            { status: 401 }
          );
        }
      }
    }

    console.log('🔍 API: Loading posts for user:', userId);

    // Load posts from Supabase database
    try {
      console.log('🔄 Loading posts from Supabase database...');

      let query = supabaseRead
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
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: posts, error } = await query;

      if (error) {
        console.error('❌ Supabase query error:', error);
        // Return empty array for any query errors (table might not exist yet)
        console.log('⚠️ Database query failed, returning empty array - tables may need to be created');
        const posts: any[] = [];
      } else {
        console.log('✅ Loaded', posts?.length || 0, 'posts from Supabase database');
      }

      const allPosts = posts || [];
      console.log('✅ API: Returning', allPosts.length, 'posts from Supabase');

      // Transform posts to match expected format
      const transformedPosts = allPosts.map((post: any) => ({
        id: post.id,
        userId: post.user_id,
        brandProfileId: post.brand_profile_id,
        content: typeof post.content === 'string' ? post.content : (post.content?.text || ''),
        hashtags: post.hashtags,
        imageUrl: post.image_url,
        platform: post.platform || 'instagram',
        variants: post.variants,
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

      // Filter by platform if specified
      let filteredPosts = transformedPosts;
      if (platform) {
        filteredPosts = transformedPosts.filter(post => post.platform === platform);
        console.log('🔍 API: Filtered to', filteredPosts.length, 'posts for platform:', platform);
      }

      // Filter by status if specified
      if (status) {
        filteredPosts = filteredPosts.filter(post => post.status === status);
        console.log('🔍 API: Filtered to', filteredPosts.length, 'posts with status:', status);
      }

      return NextResponse.json(filteredPosts);
    } catch (dbError) {
      console.error('❌ Database error loading posts:', dbError);
      // Return empty array as fallback
      const posts: any[] = [];
      console.log('⚠️ API: Returning empty array due to database error');
    }

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

    // Get request data first to access potential userId parameter
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

    // Extract user ID with fallback support
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('⚠️  API: No auth header found for POST request');
      // For POST, we can try to get userId from request body
      if (requestData.userId) {
        console.log('🔄 API: Using userId from request body for development:', requestData.userId);
        userId = requestData.userId;
      } else {
        return NextResponse.json(
          { error: 'Authorization token or userId in request body required' },
          { status: 401 }
        );
      }
    } else {
      const token = authHeader.substring(7);

      try {
        // Try Supabase authentication first
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

        if (error || !user) {
          // Fallback to MongoDB JWT authentication
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
            userId = decoded.userId;
            console.log('✅ API: MongoDB JWT authentication successful for user:', userId);
          } catch (jwtError) {
            console.log('❌ API: Both Supabase and JWT verification failed for POST');
            if (requestData.userId) {
              console.log('🔄 API: Using userId from request body as fallback:', requestData.userId);
              userId = requestData.userId;
            } else {
              return NextResponse.json(
                { error: 'Invalid token and no userId in request body' },
                { status: 401 }
              );
            }
          }
        } else {
          userId = user.id;
          console.log('✅ API: Supabase authentication successful for user:', user.id);
        }
      } catch (authError) {
        console.log('⚠️  API: Authentication error for POST, using request body fallback...', authError);
        if (requestData.userId) {
          console.log('🔄 API: Using userId from request body as fallback:', requestData.userId);
          userId = requestData.userId;
        } else {
          return NextResponse.json(
            { error: 'Authentication failed and no userId in request body' },
            { status: 401 }
          );
        }
      }
    }

    const { post, brandProfileId } = requestData;
    console.log('📝 API: Request data received:', {
      hasPost: !!post,
      userId: userId,
      brandProfileId: brandProfileId,
      postId: post?.id,
      platform: post?.platform
    });

    if (!brandProfileId) {
      console.error('❌ API: Missing required fields:', { userId: !!userId, brandProfileId: !!brandProfileId });
      return NextResponse.json(
        { error: 'Brand profile ID is required' },
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
    if (post.imageUrl && typeof post.imageUrl === 'string' && post.imageUrl.startsWith('data:')) {
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
    if (post.content?.imageUrl && typeof post.content.imageUrl === 'string' && post.content.imageUrl.startsWith('data:')) {
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


    console.log('💾 API: Saving post to Supabase database...');

    const platform = processedPost.platform || 'instagram';
    const contentText = typeof processedPost.content === 'string' ? processedPost.content : (processedPost.content?.text || '');

    // Check for existing post with same content
    console.log('🔍 Checking for duplicate posts...');
    const { data: existingPosts, error: checkError } = await supabase
      .from('generated_posts')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('content', contentText)
      .eq('platform', platform)
      .limit(1);

    if (checkError) {
      console.warn('⚠️ Could not check for duplicates:', checkError);
    } else if (existingPosts && existingPosts.length > 0) {
      const existingPost = existingPosts[0];
      console.log('⚠️ Duplicate post detected, returning existing post:', existingPost.id);

      return NextResponse.json({
        success: true,
        id: existingPost.id,
        duplicate: true,
        message: 'Post already exists',
        post: {
          ...processedPost,
          id: existingPost.id,
          createdAt: existingPost.created_at
        }
      });
    }

    // Save post to Supabase database
    try {
      // Infer generation model dynamically from incoming post
      const generationModel = (() => {
        try {
          const metaModel = (processedPost as any)?.metadata?.model;
          if (typeof metaModel === 'string' && metaModel.trim()) return metaModel.trim();
          const directModel = (processedPost as any)?.model;
          if (typeof directModel === 'string' && directModel.trim()) return directModel.trim();
          const id: string = (processedPost as any)?.id || '';
          if (/^revo-?1\.5/i.test(id)) return 'revo-1.5';
          if (/^revo-?2/i.test(id)) return 'revo-2.0';
        } catch { }
        return 'revo-2.0';
      })();

      const postData = {
        user_id: userId,
        brand_profile_id: brandProfileId,
        content: contentText,
        hashtags: Array.isArray(processedPost.hashtags) ? processedPost.hashtags.join(' ') : processedPost.hashtags || '',
        image_text: processedPost.imageText || processedPost.subheadline || '',
        image_url: processedPost.imageUrl,
        platform: platform,
        variants: processedPost.variants ? JSON.stringify(processedPost.variants) : null,
        catchy_words: processedPost.catchyWords,
        subheadline: processedPost.subheadline,
        call_to_action: processedPost.callToAction,
        video_url: processedPost.videoUrl,
        generation_model: generationModel,
        generation_prompt: `Generated for brand ${brandProfileId}`,
        generation_settings: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          format: (processedPost as any).format || undefined
        },
        status: processedPost.status || 'generated'
      };

      console.log('📝 Inserting post data:', {
        userId: postData.user_id,
        brandProfileId: postData.brand_profile_id,
        platform: postData.platform,
        hasContent: !!postData.content,
        hasImageUrl: !!postData.image_url,
        hasVariants: !!postData.variants
      });

      const { data: savedPost, error: saveError } = await supabase
        .from('generated_posts')
        .insert(postData)
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving post to Supabase:', saveError);
        throw new Error(`Database save failed: ${saveError.message}`);
      }

      if (!savedPost) {
        throw new Error('No post data returned from database');
      }

      console.log('✅ API: Post saved successfully to Supabase:', savedPost.id);

      return NextResponse.json({
        success: true,
        id: savedPost.id,
        post: {
          ...processedPost,
          id: savedPost.id,
          createdAt: savedPost.created_at,
          updatedAt: savedPost.updated_at
        }
      });
    } catch (saveError) {
      console.error('❌ Failed to save post to database:', saveError);

      // Fallback: return success with temporary ID (images are still uploaded)
      const fallbackId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('⚠️ API: Using fallback ID due to database error:', fallbackId);

      return NextResponse.json({
        success: true,
        id: fallbackId,
        warning: 'Post images uploaded but database save failed - post may not persist',
        post: {
          ...processedPost,
          id: fallbackId
        }
      });
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
