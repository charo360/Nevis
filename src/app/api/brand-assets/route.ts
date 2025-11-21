/**
 * Brand Assets API
 * Endpoints for managing brand assets (logos, product images, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandAssetLibraryService, UploadAssetOptions } from '@/lib/brand-asset-library';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/brand-assets
 * Get all assets for a brand or search assets
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const brandProfileId = searchParams.get('brandProfileId');
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    if (!brandProfileId) {
      return NextResponse.json({ error: 'brandProfileId is required' }, { status: 400 });
    }

    let assets;

    if (query) {
      // Search assets
      assets = await BrandAssetLibraryService.searchAssets(
        session.user.id,
        brandProfileId,
        query
      );
    } else if (type) {
      // Get assets by type
      assets = await BrandAssetLibraryService.getAssetsByType(
        session.user.id,
        brandProfileId,
        type as any
      );
    } else {
      // Get all assets (library)
      const library = await BrandAssetLibraryService.getBrandLibrary(
        session.user.id,
        brandProfileId
      );
      return NextResponse.json({ success: true, library });
    }

    return NextResponse.json({ success: true, assets });
  } catch (error) {
    console.error('❌ Error getting brand assets:', error);
    return NextResponse.json(
      { error: 'Failed to get brand assets' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-assets
 * Upload a new asset
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const brandProfileId = formData.get('brandProfileId') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const source = formData.get('source') as string;
    const metadataStr = formData.get('metadata') as string;
    const tagsStr = formData.get('tags') as string;
    const isDefault = formData.get('isDefault') === 'true';

    if (!file || !brandProfileId || !type) {
      return NextResponse.json(
        { error: 'file, brandProfileId, and type are required' },
        { status: 400 }
      );
    }

    const options: UploadAssetOptions = {
      name: name || file.name,
      type: type as any,
      source: (source as any) || 'manual_upload',
      metadata: metadataStr ? JSON.parse(metadataStr) : {},
      tags: tagsStr ? JSON.parse(tagsStr) : [],
      isDefault
    };

    const asset = await BrandAssetLibraryService.uploadAsset(
      session.user.id,
      brandProfileId,
      file,
      options
    );

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('❌ Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/brand-assets
 * Update asset metadata
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assetId, updates } = body;

    if (!assetId || !updates) {
      return NextResponse.json(
        { error: 'assetId and updates are required' },
        { status: 400 }
      );
    }

    const asset = await BrandAssetLibraryService.updateAsset(assetId, updates);

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('❌ Error updating asset:', error);
    return NextResponse.json(
      { error: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-assets
 * Delete an asset
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const assetId = searchParams.get('assetId');

    if (!assetId) {
      return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
    }

    await BrandAssetLibraryService.deleteAsset(assetId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

