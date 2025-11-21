/**
 * Save Brand Asset from URL
 * Used by e-commerce scraper to save extracted images
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandAssetLibraryService, SaveAssetFromUrlOptions } from '@/lib/brand-asset-library';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/brand-assets/save-from-url
 * Save an asset from a URL (for e-commerce scraper)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandProfileId, imageUrl, name, type, source, metadata, tags, width, height } = body;

    if (!brandProfileId || !imageUrl || !name || !type || !source) {
      return NextResponse.json(
        { error: 'brandProfileId, imageUrl, name, type, and source are required' },
        { status: 400 }
      );
    }

    const options: SaveAssetFromUrlOptions = {
      name,
      type,
      source,
      originalUrl: imageUrl,
      metadata: metadata || {},
      tags: tags || [],
      width,
      height
    };

    const asset = await BrandAssetLibraryService.saveAssetFromUrl(
      session.user.id,
      brandProfileId,
      imageUrl,
      options
    );

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('❌ Error saving asset from URL:', error);
    return NextResponse.json(
      { error: 'Failed to save asset from URL' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand-assets/save-from-url/batch
 * Save multiple assets from URLs (bulk operation for e-commerce scraper)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandProfileId, assets } = body;

    if (!brandProfileId || !assets || !Array.isArray(assets)) {
      return NextResponse.json(
        { error: 'brandProfileId and assets array are required' },
        { status: 400 }
      );
    }

    const savedAssets = [];
    const errors = [];

    for (const assetData of assets) {
      try {
        const options: SaveAssetFromUrlOptions = {
          name: assetData.name,
          type: assetData.type,
          source: assetData.source,
          originalUrl: assetData.imageUrl,
          metadata: assetData.metadata || {},
          tags: assetData.tags || [],
          width: assetData.width,
          height: assetData.height
        };

        const asset = await BrandAssetLibraryService.saveAssetFromUrl(
          session.user.id,
          brandProfileId,
          assetData.imageUrl,
          options
        );

        savedAssets.push(asset);
      } catch (error) {
        console.error(`❌ Error saving asset ${assetData.name}:`, error);
        errors.push({
          name: assetData.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedAssets,
      errors,
      totalSaved: savedAssets.length,
      totalErrors: errors.length
    });
  } catch (error) {
    console.error('❌ Error in batch save:', error);
    return NextResponse.json(
      { error: 'Failed to save assets' },
      { status: 500 }
    );
  }
}

