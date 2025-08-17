/**
 * API endpoint for artifacts management
 * Handles file uploads, retrieval, and metadata operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { artifactsService } from '@/lib/services/artifacts-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const category = searchParams.get('category');

    switch (action) {
      case 'list':
        let artifacts = artifactsService.getAllArtifacts();

        // Apply filters
        if (category) {
          artifacts = artifacts.filter(a => a.category === category);
        }
        if (searchParams.get('active') === 'true') {
          artifacts = artifacts.filter(a => a.isActive);
        }

        return NextResponse.json({ success: true, artifacts });

      case 'get':
        if (!id) {
          return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        }
        const artifact = await artifactsService.getArtifact(id);
        if (!artifact) {
          return NextResponse.json({ success: false, error: 'Artifact not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, artifact });

      case 'active':
        const activeArtifacts = await artifactsService.getActiveArtifacts();
        return NextResponse.json({ success: true, artifacts: activeArtifacts });

      case 'folders':
        const folders = await artifactsService.getFolders();
        return NextResponse.json({ success: true, folders });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Artifacts API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;

    switch (action) {
      case 'upload':
        const files = formData.getAll('files') as File[];
        const category = formData.get('category') as string;
        const uploadType = formData.get('uploadType') as string;
        const usageType = formData.get('usageType') as string;
        const folderId = formData.get('folderId') as string;
        const isActive = formData.get('isActive') === 'true';
        const customName = formData.get('customName') as string;
        const instructions = formData.get('instructions') as string;

        if (!files || files.length === 0) {
          return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
        }

        const uploadedArtifacts = await artifactsService.uploadArtifacts(files, category as any, {
          uploadType: uploadType as any,
          usageType: usageType as any,
          folderId,
          isActive,
          customName,
          instructions
        });

        return NextResponse.json({ success: true, artifacts: uploadedArtifacts });

      case 'activate':
        const artifactId = formData.get('artifactId') as string;
        if (!artifactId) {
          return NextResponse.json({ success: false, error: 'Artifact ID required' }, { status: 400 });
        }

        await artifactsService.activateArtifact(artifactId);
        return NextResponse.json({ success: true });

      case 'deactivate':
        const deactivateId = formData.get('artifactId') as string;
        if (!deactivateId) {
          return NextResponse.json({ success: false, error: 'Artifact ID required' }, { status: 400 });
        }

        await artifactsService.deactivateArtifact(deactivateId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Artifacts upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Artifact ID required' }, { status: 400 });
    }

    const updatedArtifact = await artifactsService.updateArtifact(id, updates);
    return NextResponse.json({ success: true, artifact: updatedArtifact });

  } catch (error) {
    console.error('❌ Artifacts update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Artifact ID required' }, { status: 400 });
    }

    await artifactsService.deleteArtifact(id);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Artifacts delete error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
