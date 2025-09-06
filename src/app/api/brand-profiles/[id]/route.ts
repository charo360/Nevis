// API routes for individual brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileMongoService } from '@/lib/mongodb/services/brand-profile-service';

// GET /api/brand-profiles/[id] - Get brand profile by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const profileId = params.id;

    const profile = await brandProfileMongoService.getBrandProfileById(profileId);
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error getting brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to get brand profile' },
      { status: 500 }
    );
  }
}

// PUT /api/brand-profiles/[id] - Update brand profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;
    const updates = await request.json();

    await brandProfileMongoService.updateBrandProfile(profileId, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to update brand profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/brand-profiles/[id] - Delete brand profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: profileId } = await params;

    await brandProfileMongoService.deleteBrandProfile(profileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete brand profile' },
      { status: 500 }
    );
  }
}
