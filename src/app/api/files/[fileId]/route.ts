// File serving API route - using Supabase instead of GridFS
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // This endpoint is disabled - using Supabase storage instead
    return NextResponse.json(
      { error: 'This endpoint is disabled - using Supabase storage instead of GridFS' },
      { status: 503 }
    );
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Endpoint disabled - using Supabase storage' },
      { status: 503 }
    );
  }
}
