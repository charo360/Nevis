// API routes for brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileMongoService } from '@/lib/mongodb/services/brand-profile-service';
import { verifyToken } from '@/lib/auth/jwt';

// GET /api/brand-profiles - Load user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profiles = await brandProfileMongoService.loadBrandProfiles(decoded.userId);
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const profile = await request.json();

    // Use authenticated user ID instead of trusting the request body
    const profileWithUserId = {
      ...profile,
      userId: decoded.userId,
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
