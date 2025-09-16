import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // This endpoint is disabled - using Supabase storage instead
    return NextResponse.json(
      { error: 'This endpoint is disabled - using Supabase storage instead of GridFS' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled - using Supabase storage' },
      { status: 503 }
    );
  }
}
