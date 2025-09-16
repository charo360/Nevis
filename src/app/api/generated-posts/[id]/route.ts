// API routes for individual generated post management - using Supabase
import { NextRequest, NextResponse } from 'next/server';

// PUT /api/generated-posts/[id] - Update generated post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint is disabled - using Supabase instead
    return NextResponse.json(
      { error: 'This endpoint is disabled - using Supabase storage instead' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error updating generated post:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled - using Supabase storage' },
      { status: 503 }
    );
  }
}

// DELETE /api/generated-posts/[id] - Delete generated post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // This endpoint is disabled - using Supabase instead
    return NextResponse.json(
      { error: 'This endpoint is disabled - using Supabase storage instead' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error deleting generated post:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled - using Supabase storage' },
      { status: 503 }
    );
  }
}
