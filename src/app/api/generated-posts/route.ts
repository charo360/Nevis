// API routes for generated posts management
import { NextRequest, NextResponse } from 'next/server';
import { generatedPostMongoService } from '@/lib/mongodb/services/generated-post-service';

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

    let posts;
    if (platform) {
      posts = await generatedPostMongoService.loadGeneratedPostsByPlatform(userId, platform, limit);
    } else if (status) {
      posts = await generatedPostMongoService.loadGeneratedPostsByStatus(userId, status, limit);
    } else {
      posts = await generatedPostMongoService.loadGeneratedPosts(userId, limit);
    }

    return NextResponse.json(posts);
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
    console.log('📝 API: Received POST request to save generated post');
    const data = await request.json();
    console.log('📝 API: Request data:', {
      hasPost: !!data.post,
      userId: data.userId,
      brandProfileId: data.brandProfileId,
      postPlatform: data.post?.platform,
      postContentLength: data.post?.content?.text?.length || 0
    });

    const { post, userId, brandProfileId } = data;

    if (!userId || !brandProfileId) {
      console.error('❌ API: Missing required fields:', { userId: !!userId, brandProfileId: !!brandProfileId });
      return NextResponse.json(
        { error: 'User ID and brand profile ID are required' },
        { status: 400 }
      );
    }

    console.log('🔄 API: Calling MongoDB service to save post...');
    const postId = await generatedPostMongoService.saveGeneratedPost({ ...post, userId, brandProfileId });
    console.log('✅ API: Post saved successfully with ID:', postId);

    return NextResponse.json({ id: postId });
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
