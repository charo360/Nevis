// API routes for brand profile management
import { NextRequest, NextResponse } from 'next/server';
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase clients
// Use service-role client for storage/DB operations
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Use anon client for verifying user JWTs
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to verify Supabase auth token and get user
async function verifySupabaseAuth(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authorization token required', status: 401 };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Verify the token using Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
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
    console.log('📤 Uploading brand logo to Supabase Storage for:', brandName);

    // Convert data URL to buffer
    const base64Data = logoDataUrl.split(',')[1];
    if (!base64Data) {
      return { success: false, error: 'Invalid logo data URL format' };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    console.log(`📦 Logo buffer size: ${buffer.length} bytes`);

    // Create upload path for logo
    const timestamp = Date.now();
    const safeBrandName = brandName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const uploadPath = `brands/${userId}/logos/${safeBrandName}-${timestamp}.png`;
    console.log(`🎯 Logo upload path: ${uploadPath}`);
    
    const { data, error } = await supabaseService.storage
      .from('nevis-storage')
      .upload(uploadPath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Logo upload error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Logo upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabaseService.storage
      .from('nevis-storage')
      .getPublicUrl(uploadPath);

    console.log('✅ Brand logo uploaded to Supabase Storage:', publicUrl);
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

    const profiles = await brandProfileSupabaseService.loadBrandProfiles(authResult.userId!);
    console.log(`✅ Loaded ${profiles.length} brand profiles for user:`, authResult.userId);
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
    const authResult = await verifySupabaseAuth(request.headers.get('authorization'));
    
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

  const profile = await request.json();
  console.log('📋 Processing brand profile save:', {
    businessName: profile.businessName,
    hasLogoDataUrl: !!profile.logoDataUrl,
    logoDataLength: profile.logoDataUrl?.length || 0
  });

  // Process logo upload if logoDataUrl is provided
  let processedProfile = { ...profile };
  
  if (profile.logoDataUrl && profile.logoDataUrl.startsWith('data:')) {
    console.log('📤 Processing logo upload for brand:', profile.businessName);
    
    const logoResult = await uploadLogoToSupabase(
      profile.logoDataUrl,
      authResult.userId!,
      profile.businessName || 'brand'
    );
    
    if (logoResult.success && logoResult.url) {
      // Replace logoDataUrl with the Supabase storage URL
      processedProfile.logoUrl = logoResult.url;
      // Remove the large base64 data to save database space
      delete processedProfile.logoDataUrl;
      console.log('✅ Logo uploaded successfully, using storage URL:', logoResult.url);
    } else {
      console.error('❌ Logo upload failed:', logoResult.error);
      // Keep the logoDataUrl as fallback, but warn about it
      console.warn('⚠️  Using logoDataUrl as fallback - this may cause performance issues');
    }
  }

  // Use authenticated user ID instead of trusting the request body
  const profileWithUserId = {
    ...processedProfile,
    userId: authResult.userId!,
  };

  console.log('💾 Saving brand profile to MongoDB:', {
    businessName: profileWithUserId.businessName,
    hasLogoUrl: !!profileWithUserId.logoUrl,
    hasLogoDataUrl: !!profileWithUserId.logoDataUrl
  });

  const profileId = await brandProfileSupabaseService.saveBrandProfile(profileWithUserId);
    return NextResponse.json({ id: profileId });
  } catch (error) {
    console.error('Error saving brand profile:', error);
    return NextResponse.json(
      { error: 'Failed to save brand profile' },
      { status: 500 }
    );
  }
}
