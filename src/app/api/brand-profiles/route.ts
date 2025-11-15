// API routes for brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { createClient } from '@supabase/supabase-js';

// Lazy Supabase client creation to ensure env vars are loaded
let supabaseServiceClient: ReturnType<typeof createClient> | null = null;
let supabaseAuthClient: ReturnType<typeof createClient> | null = null;

function getSupabaseService() {
  if (!supabaseServiceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔑 Creating service client...');
    console.log('   URL:', url);
    console.log('   Service key exists:', !!key);
    console.log('   Service key length:', key?.length);
    console.log('   Service key starts with:', key?.substring(0, 30));
    console.log('   Service key ends with:', key?.substring(key.length - 10));
    
    if (!url || !key) {
      throw new Error('Missing Supabase service role credentials');
    }
    
    supabaseServiceClient = createClient(url, key);
    console.log('✅ Service client created');
  }
  return supabaseServiceClient;
}

function getSupabaseAuth() {
  if (!supabaseAuthClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase anon credentials');
    }
    
    supabaseAuthClient = createClient(url, key);
  }
  return supabaseAuthClient;
}

// Helper function to verify Supabase auth token and get user
async function verifySupabaseAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify the token using Supabase
    const { data: { user }, error } = await getSupabaseAuth().auth.getUser(token);
    
    if (error || !user) {
      return { error: 'Invalid or expired token', status: 401 };
    }
    
    return { user, userId: user.id };
  } catch (error) {
    return { error: 'Token verification failed', status: 401 };
  }
}

// Helper function to upload logo data URL to Supabase Storage
async function uploadLogoToSupabase(logoDataUrl: string, userId: string, brandName: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {

    // Convert data URL to buffer
    const base64Data = logoDataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid logo data URL format' };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');

    // Create upload path for logo
    const timestamp = Date.now();
    const safeBrandName = brandName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uploadPath = `brands/${userId}/logos/${safeBrandName}-${timestamp}.png`;
    
    const { data, error } = await getSupabaseService().storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Logo upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabaseService().storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('❌ Logo upload error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// GET /api/brand-profiles - Load user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log('🔍 Fetching brand profiles for user:', authResult.userId);

    try {
      // Use the getSupabaseService() client directly (it's created at the top with service role key)
      const supabase = getSupabaseService();
      console.log('✅ Got Supabase client');
      
      const { data: profiles, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', authResult.userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching brands:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        return NextResponse.json(
          { error: 'Failed to load brand profiles: ' + error.message },
          { status: 500 }
        );
      }

      console.log('✅ Found', profiles?.length || 0, 'brand profiles');
      return NextResponse.json(profiles || []);
    } catch (err) {
      console.error('❌ Exception fetching brands:', err);
      return NextResponse.json(
        { error: 'Failed to load brand profiles: ' + (err instanceof Error ? err.message : String(err)) },
        { status: 500 }
      );
    }
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
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const profile = await request.json();

    // Process logo upload if logoDataUrl is provided
    let processedProfile = { ...profile };
    if (profile.logoDataUrl && profile.logoDataUrl.startsWith('data:')) {
      const logoResult = await uploadLogoToSupabase(
        profile.logoDataUrl,
        authResult.userId!,
        profile.businessName || 'brand'
      );
      if (logoResult.success && logoResult.url) {
        processedProfile.logoUrl = logoResult.url;
        delete processedProfile.logoDataUrl;
      } else {
        console.error('❌ Logo upload failed:', logoResult.error);
        console.warn('⚠️  Using logoDataUrl as fallback - this may cause performance issues');
      }
    }

    // Use authenticated user ID instead of trusting the request body
    const profileWithUserId = {
      ...processedProfile,
      userId: authResult.userId!,
    };

    console.log('💾 Saving brand profile for user:', authResult.userId);

    try {
      // Prepare brand profile data for database
      const brandData: any = {
        user_id: authResult.userId,
        business_name: profileWithUserId.businessName || '',
        business_type: profileWithUserId.businessType || null,
        location: profileWithUserId.location || null,
        website_url: profileWithUserId.websiteUrl || null,
        description: profileWithUserId.description || null,
        target_audience: profileWithUserId.targetAudience || null,
        services: profileWithUserId.services || null,
        logo_url: profileWithUserId.logoUrl || null,
        brand_colors: profileWithUserId.brandColors || null,
        contact_info: profileWithUserId.contactInfo || null,
        social_handles: profileWithUserId.socialHandles || null,
        website_analysis: profileWithUserId.websiteAnalysis || null,
        brand_voice: profileWithUserId.brandVoice || null,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      // If profile has an ID, update it; otherwise insert new
      if (profileWithUserId.id) {
        const { data, error } = await getSupabaseService()
          .from('brand_profiles')
          .update(brandData)
          .eq('id', profileWithUserId.id)
          .eq('user_id', authResult.userId)
          .select()
          .single();

        if (error) {
          console.error('❌ Error updating brand profile:', error);
          return NextResponse.json(
            { error: 'Failed to update brand profile: ' + error.message },
            { status: 500 }
          );
        }

        console.log('✅ Updated brand profile:', data.id);
        return NextResponse.json({ id: data.id });
      } else {
        // Insert new profile
        brandData.created_at = new Date().toISOString();
        
        const { data, error } = await getSupabaseService()
          .from('brand_profiles')
          .insert(brandData)
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating brand profile:', error);
          return NextResponse.json(
            { error: 'Failed to create brand profile: ' + error.message },
            { status: 500 }
          );
        }

        console.log('✅ Created brand profile:', data.id);
        return NextResponse.json({ id: data.id });
      }
    } catch (saveError) {
      console.error('Error saving brand profile (inner):', saveError);
      return NextResponse.json(
        { error: saveError instanceof Error ? saveError.message : String(saveError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error saving brand profile (outer):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
