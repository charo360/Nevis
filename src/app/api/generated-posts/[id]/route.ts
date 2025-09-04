// API routes for individual generated post management
import { NextRequest, NextResponse } from 'next/server';
import { generatedPostMongoService } from '@/lib/mongodb/services/generated-post-service';

// PUT /api/generated-posts/[id] - Update generated post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const data = await request.json();
    const { type, ...updates } = data;

    if (type === 'analytics') {
      await generatedPostMongoService.updatePostAnalytics(postId, updates);
    } else if (type === 'status') {
      const { status, publishedAt } = updates;
      await generatedPostMongoService.updatePostStatus(postId, status, undefined, publishedAt);
    } else {
      // General update
      await generatedPostMongoService.updateGeneratedPost(postId, updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating generated post:', error);
    return NextResponse.json(
      { error: 'Failed to update generated post' },
      { status: 500 }
    );
  }
}

// DELETE /api/generated-posts/[id] - Delete generated post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    await generatedPostMongoService.deleteGeneratedPost(postId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting generated post:', error);
    return NextResponse.json(
      { error: 'Failed to delete generated post' },
      { status: 500 }
    );
  }
}
