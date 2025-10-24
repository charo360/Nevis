// API endpoint to force refresh brand data and clear cache
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { brandId } = await request.json();

    if (!brandId) {
      return NextResponse.json({
        error: 'Missing required parameter: brandId'
      }, { status: 400 });
    }

    console.log('🔄 Force refreshing brand data for ID:', brandId);

    // Get the latest brand data from database
    const { data: brandData, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError) {
      console.error('❌ Error fetching brand data:', brandError);
      return NextResponse.json({
        error: 'Failed to fetch brand data',
        details: brandError.message
      }, { status: 500 });
    }

    if (!brandData) {
      return NextResponse.json({
        error: 'Brand not found'
      }, { status: 404 });
    }

    // Convert to the format expected by the frontend
    const formattedBrandData = {
      id: brandData.id,
      businessName: brandData.business_name,
      businessType: brandData.business_type,
      location: brandData.location,
      websiteUrl: brandData.website_url,
      description: brandData.description,
      targetAudience: brandData.target_audience,
      services: brandData.services,
      logoUrl: brandData.logo_url,
      logoDataUrl: brandData.logo_data_url,
      brandColors: brandData.brand_colors,
      contactInfo: brandData.contact_info,
      socialHandles: brandData.social_handles,
      websiteAnalysis: brandData.website_analysis,
      brandVoice: brandData.brand_voice,
      contact: brandData.contact,
      socialMedia: brandData.social_media,
      designExamples: brandData.design_examples,
      isActive: brandData.is_active,
      createdAt: brandData.created_at,
      updatedAt: brandData.updated_at
    };

    console.log('✅ Brand data refreshed:', {
      id: formattedBrandData.id,
      businessName: formattedBrandData.businessName,
      websiteUrl: formattedBrandData.websiteUrl,
      contactWebsite: formattedBrandData.contact?.website,
      logoUrl: formattedBrandData.logoUrl
    });

    return NextResponse.json({
      success: true,
      brandData: formattedBrandData,
      message: 'Brand data refreshed successfully'
    });

  } catch (error) {
    console.error('❌ Force refresh error:', error);
    return NextResponse.json({
      error: 'Force refresh failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}



