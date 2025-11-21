/**
 * Set Default Brand Asset
 * Set an asset as the default for its type
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrandAssetLibraryService } from '@/lib/brand-asset-library';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/brand-assets/set-default
 * Set an asset as default for its type
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assetId, brandProfileId } = body;

    if (!assetId || !brandProfileId) {
      return NextResponse.json(
        { error: 'assetId and brandProfileId are required' },
        { status: 400 }
      );
    }

    await BrandAssetLibraryService.setAsDefault(
      assetId,
      session.user.id,
      brandProfileId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error setting default asset:', error);
    return NextResponse.json(
      { error: 'Failed to set default asset' },
      { status: 500 }
    );
  }
}

