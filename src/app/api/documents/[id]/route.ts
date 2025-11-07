import { NextRequest, NextResponse } from 'next/server';
import { supabaseStorage } from '@/lib/services/supabase-storage';

/**
 * DELETE /api/documents/[id]
 * Delete a document from Supabase Storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get document path from database
    // For now, we'll need to pass the path in the request body or query params
    const { searchParams } = new URL(request.url);
    const documentPath = searchParams.get('path');

    if (!documentPath) {
      return NextResponse.json(
        { success: false, error: 'Document path is required' },
        { status: 400 }
      );
    }

    // Delete from Supabase Storage
    await supabaseStorage.deleteFile(documentPath);

    // TODO: Remove document metadata from brand profile in database

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/[id]
 * Get document metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    // TODO: Fetch document metadata from database
    // For now, return a placeholder response

    return NextResponse.json({
      success: true,
      message: 'Document retrieval not yet implemented',
    });

  } catch (error) {
    console.error('Document retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve document',
      },
      { status: 500 }
    );
  }
}

