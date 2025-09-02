/**
 * API endpoint for serving individual artifact files
 * Handles file serving, thumbnails, and individual artifact operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { artifactsService } from '@/lib/services/artifacts-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'serve';

    switch (action) {
      case 'serve':
        // Serve the actual file
        const artifact = await artifactsService.getArtifact(id);
        if (!artifact) {
          return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
        }

        // For now, return artifact metadata since we're using in-memory storage
        // In production, this would serve the actual file from storage
        return NextResponse.json({
          success: true,
          artifact,
          message: 'File serving not implemented in demo mode'
        });

      case 'thumbnail':
        // Serve thumbnail
        const thumbnailArtifact = await artifactsService.getArtifact(id);
        if (!thumbnailArtifact) {
          return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
        }

        // Return thumbnail info
        return NextResponse.json({
          success: true,
          thumbnailPath: thumbnailArtifact.thumbnailPath,
          message: 'Thumbnail serving not implemented in demo mode'
        });

      case 'metadata':
        // Get artifact metadata
        const metadataArtifact = await artifactsService.getArtifact(id);
        if (!metadataArtifact) {
          return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          metadata: metadataArtifact.metadata,
          artifact: {
            id: metadataArtifact.id,
            name: metadataArtifact.name,
            type: metadataArtifact.type,
            category: metadataArtifact.category,
            tags: metadataArtifact.tags,
            timestamps: metadataArtifact.timestamps
          }
        });

      case 'usage':
        // Get usage statistics
        const usageArtifact = await artifactsService.getArtifact(id);
        if (!usageArtifact) {
          return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          usage: usageArtifact.usage
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action. Supported: serve, thumbnail, metadata, usage' 
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { updates } = body;

    const updatedArtifact = await artifactsService.updateArtifact(id, updates);
    if (!updatedArtifact) {
      return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, artifact: updatedArtifact });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await artifactsService.deleteArtifact(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
