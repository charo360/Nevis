// API routes for brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileMongoService } from '@/lib/mongodb/services/brand-profile-service';
import { getAuthenticatedUser } from '@/lib/auth/supabase-jwt';

// GET /api/brand-profiles - Load user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profiles = await brandProfileMongoService.loadBrandProfiles(user.userId);
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error loading brand profiles:', error);
    return NextResponse.json(
      { error: 'Failed to load brand profiles' },
      { status: 500 }
    );
  }
}

// POST /api/brand-profiles - Create new brand profile
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const user = await getAuthenticatedUser(authHeader);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profile = await request.json();

    // Use authenticated user ID instead of trusting the request body
    const profileWithUserId = {
      ...profile,
      userId: user.userId,
    };

    const profileId = await brandProfileMongoService.saveBrandProfile(profileWithUserId);
    return NextResponse.json({ id: profileId });
  } catch (error) {
    console.error('Error saving brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to save brand profile' },
      { status: 500 }
    );
  }
}
