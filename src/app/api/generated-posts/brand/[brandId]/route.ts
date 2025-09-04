// API routes for brand-specific generated posts
import { NextRequest, NextResponse } from 'next/server';
import { generatedPostMongoService } from '@/lib/mongodb/services/generated-post-service';

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

    const posts = await generatedPostMongoService.loadGeneratedPostsByBrand(brandId, limit);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error loading brand posts:', error);
    return NextResponse.json(
      { error: 'Failed to load brand posts' },
      { status: 500 }
    );
  }
}
