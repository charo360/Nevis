// Debug API route - using Supabase instead of MongoDB
import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/services/supabase-service';

export async function GET(request: NextRequest) {
  try {
    // Get all brand profiles from Supabase (for debugging)
    const allProfiles = await supabaseService.getAllBrandProfiles();

    return NextResponse.json({
      totalProfiles: allProfiles.length,
      profiles: allProfiles.map(profile => ({
        id: profile.id,
        userId: profile.user_id,
        businessName: profile.business_name,
        businessType: profile.business_type,
        createdAt: profile.created_at,
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
