// Debug API route to check what's in the brand profiles collection
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileService } from '@/lib/mongodb/database';

export async function GET(request: NextRequest) {
  try {
    // Get all brand profiles in the database (for debugging)
    const allProfiles = await brandProfileService.getAll({});
    
    return NextResponse.json({
      totalProfiles: allProfiles.length,
      profiles: allProfiles.map(profile => ({
        id: profile._id?.toString(),
        userId: profile.userId,
        businessName: profile.businessName,
        businessType: profile.businessType,
        createdAt: profile.createdAt,
      }))
    });
  } catch (error) {
    console.error('Error debugging brand profiles:', error);
    return NextResponse.json(
      { error: 'Failed to debug brand profiles', details: error.message },
      { status: 500 }
    );
  }
}
