// Debug API route - using Supabase instead of MongoDB
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all brand profiles from Supabase (for debugging)
    const { data: allProfiles, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      totalProfiles: allProfiles?.length || 0,
      profiles: allProfiles?.map(profile => ({
        id: profile.id,
        userId: profile.user_id,
        businessName: profile.business_name,
        businessType: profile.business_type,
        location: profile.location,
        description: profile.description,
        services: profile.services,
        websiteUrl: profile.website_url,
        contactInfo: profile.contact_info,
        brandColors: profile.brand_colors,
        logoUrl: profile.logo_url,
        isActive: profile.is_active,
        createdAt: profile.created_at,
      })) || []
    });
  } catch (error) {
    console.error('Error debugging brand profiles:', error);
    return NextResponse.json(
      { error: 'Failed to debug brand profiles', details: error.message },
      { status: 500 }
    );
  }
}
