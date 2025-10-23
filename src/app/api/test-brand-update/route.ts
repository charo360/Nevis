// Test API endpoint to fetch and update brand profile for specific user
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Search for brand profiles with "BrightLeaf Solutions Ltd" or similar
    const { data: brandProfiles, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .or('business_name.ilike.%BrightLeaf%,business_name.ilike.%brightleaf%,website_url.ilike.%paya.co.ke%,contact->>website.ilike.%paya.co.ke%');

    if (brandError) {
      console.error('❌ Error fetching brand profiles:', brandError);
      return NextResponse.json({ 
        error: 'Failed to fetch brand profiles',
        details: brandError.message 
      }, { status: 500 });
    }

    console.log('📋 Brand profiles found:', brandProfiles?.length || 0);

    if (!brandProfiles || brandProfiles.length === 0) {
      // Let's search for all brands to find the right one
      const { data: allBrands, error: allBrandsError } = await supabase
        .from('brand_profiles')
        .select('id, business_name, website_url, contact, location')
        .limit(20);
      
      // Filter for brands that might match
      const matchingBrands = allBrands?.filter(brand => 
        brand.business_name?.toLowerCase().includes('brightleaf') ||
        brand.business_name?.toLowerCase().includes('bright') ||
        brand.location?.toLowerCase().includes('mombasa') ||
        brand.website_url?.includes('paya.co.ke') ||
        brand.contact?.website?.includes('paya.co.ke')
      ) || [];
      
      return NextResponse.json({
        error: 'No exact match found',
        message: 'Searching for BrightLeaf Solutions Ltd or similar brands',
        availableBrands: allBrands || [],
        matchingBrands: matchingBrands,
        searchError: allBrandsError?.message
      }, { status: 404 });
    }

    const targetBrand = brandProfiles[0]; // Take the first match

    console.log('🎯 Target brand found:', {
      id: targetBrand.id,
      business_name: targetBrand.business_name,
      current_website: targetBrand.website_url,
      contact_website: targetBrand.contact?.website
    });

    return NextResponse.json({
      success: true,
      targetBrand: {
        id: targetBrand.id,
        business_name: targetBrand.business_name,
        current_website_url: targetBrand.website_url,
        current_contact_website: targetBrand.contact?.website,
        logo_url: targetBrand.logo_url,
        user_id: targetBrand.user_id
      },
      message: 'Brand found successfully. Ready for update test.'
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { brandId, newWebsiteUrl, newLogoUrl } = await request.json();

    if (!brandId) {
      return NextResponse.json({
        error: 'Missing required parameter: brandId'
      }, { status: 400 });
    }

    if (!newWebsiteUrl && !newLogoUrl) {
      return NextResponse.json({
        error: 'Missing required parameters: newWebsiteUrl or newLogoUrl'
      }, { status: 400 });
    }

    console.log('🔄 Updating brand:', brandId);
    if (newWebsiteUrl) console.log('   Website URL:', newWebsiteUrl);
    if (newLogoUrl) console.log('   Logo URL:', newLogoUrl);

    // Prepare update object
    const updateData: any = {};
    
    if (newWebsiteUrl) {
      updateData.website_url = newWebsiteUrl;
      updateData.contact = {
        website: newWebsiteUrl
      };
    }
    
    if (newLogoUrl) {
      updateData.logo_url = newLogoUrl;
    }

    // Update the brand profile
    const { data, error } = await supabase
      .from('brand_profiles')
      .update(updateData)
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update failed:', error);
      return NextResponse.json({
        error: 'Update failed',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Brand updated successfully:', data);

    return NextResponse.json({
      success: true,
      updatedBrand: {
        id: data.id,
        business_name: data.business_name,
        website_url: data.website_url,
        contact: data.contact,
        logo_url: data.logo_url
      },
      message: 'Brand updated successfully'
    });

  } catch (error) {
    console.error('❌ Update API error:', error);
    return NextResponse.json({
      error: 'Update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
