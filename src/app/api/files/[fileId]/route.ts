// File serving API route for GridFS files
import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/mongodb/storage';

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

    // Download file from GridFS
    const { buffer, info } = await storageService.downloadFile(fileId);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', info.contentType || 'application/octet-stream');
    headers.set('Content-Length', buffer.length.toString());
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Set filename for download
    if (info.filename) {
      headers.set('Content-Disposition', `inline; filename="${info.filename}"`);
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('File serving error:', error);
    
    if (error instanceof Error && error.message === 'File not found') {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
