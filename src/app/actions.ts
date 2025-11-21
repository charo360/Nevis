// src/app/actions.ts
"use server";

import { BrandAnalysisResult } from "@/ai/flows/analyze-brand"; // Keep type import for compatibility
import { modelRegistry } from "@/ai/models/registry/model-registry";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset } from "@/lib/types";
import { artifactsService } from "@/lib/services/artifacts-service";
import type { Artifact } from "@/lib/types/artifacts";
import { generateEnhancedDesign } from "@/ai/gemini-2.5-design";
import { generateRevo2ContentAction, generateRevo2CreativeAssetAction } from "@/app/actions/revo-2-actions";
import { brandProfileSupabaseService } from '@/lib/supabase/services/brand-profile-service';
import { supabaseService } from "@/lib/services/supabase-service";
import { createClient } from '@/lib/supabase-server';
import type { ScheduledService } from "@/services/calendar-service";
import { MODEL_COSTS } from '@/lib/credit-integration';
import { formatContactForAI, getPriorityContacts, getExactContactInstructions } from '@/lib/utils/smart-contact-formatter';

// Helper function to convert logo URL to base64 data URL for AI models
async function convertLogoToDataUrl(logoUrl?: string): Promise<string | undefined> {
  if (!logoUrl) return undefined;

  // If it's already a data URL, return as is
  if (logoUrl.startsWith('data:')) {
    return logoUrl;
  }

  // If it's a Supabase Storage URL, fetch and convert to base64
  if (logoUrl.startsWith('http')) {
    try {

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return dataUrl;
    } catch (error) {
      console.error('❌ Error converting logo URL to base64:', error);
      return undefined;
    }
  }

  return undefined;
}

// --- AI Flow Actions ---

type AnalysisResult = {
  success: true;
  data: BrandAnalysisResult;
} | {
  success: false;
  error: string;
  errorType: 'blocked' | 'timeout' | 'error';
};

export async function analyzeBrandAction(
  websiteUrl: string,
  designImageUris: string[],
): Promise<AnalysisResult> {
  try {
    // Step 1: URL Validation and Normalization
    if (!websiteUrl || !websiteUrl.trim()) {
      return {
        success: false,
        error: "Website URL is required",
        errorType: 'error'
      };
    }

    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return {
        success: false,
        error: "Invalid URL format. Please enter a valid website URL (e.g., https://example.com).",
        errorType: 'error'
      };
    }

    // Security: Prevent scraping internal/private URLs
    const urlObj = new URL(normalizedUrl);
    if (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('127.') || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.startsWith('10.')) {
      return {
        success: false,
        error: "Cannot analyze local or private network URLs.",
        errorType: 'error'
      };
    }

    // Step 2: Check robots.txt (log only, don't block - let actual fetch determine if blocked)
    try {
      const robotsResponse = await fetch(`${normalizedUrl}/robots.txt`, { signal: AbortSignal.timeout(5000) });
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        if (robotsText.includes('Disallow: /')) {
          console.log('ℹ️ Website has robots.txt with Disallow: / - will attempt analysis anyway');
          // Don't block here - many sites have this but still allow scraping
          // Let the actual fetch attempt determine if we're blocked
        }
      }
    } catch {
      // Ignore robots.txt errors, proceed with analysis
    }

    // Step 3: Run AI-powered comprehensive analysis (PRIMARY METHOD)
    console.log('🚀 Running AI-powered comprehensive analysis...');

    try {
      // Use Claude analysis as PRIMARY method (Enhanced with actual product extraction)
      console.log('🤖 Using Claude-enhanced website analysis...');
      
      // In development, always use localhost to avoid calling production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const baseUrl = isDevelopment 
        ? 'http://localhost:3001' 
        : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001');
      
      const apiUrl = `${baseUrl}/api/analyze-brand-claude`;
      console.log('📡 Calling API:', apiUrl);
      console.log('📦 Request body:', { websiteUrl: normalizedUrl, businessType: 'auto-detect' });

      // Add timeout for Claude API call (60 seconds to handle complex websites)
      // This prevents the first analysis from timing out for new users
      const analysisResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: normalizedUrl,
          businessType: 'auto-detect',
          includeCompetitorAnalysis: false
        }),
        signal: AbortSignal.timeout(60000) // 60 second timeout for Claude analysis
      });

      console.log('📊 Response status:', analysisResponse.status, analysisResponse.statusText);

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || 'Claude analysis failed');
      }

      const claudeResult = await analysisResponse.json();
      
      if (!claudeResult.success) {
        throw new Error(claudeResult.error || 'Claude analysis failed');
      }

      const aiResult = claudeResult.data;

      console.log('✅ AI analysis complete!');
      console.log(`🏢 Business name: ${aiResult.businessName}`);
      console.log(`💡 Business type: ${aiResult.businessType}`);
      console.log(`📝 Description: ${aiResult.description?.substring(0, 100)}...`);

      // Validation
      if (!aiResult.businessName || aiResult.businessName.trim().length === 0) {
        return {
          success: false,
          error: "AI could not extract a valid business name from the website.",
          errorType: 'error'
        };
      }

      return {
        success: true,
        data: aiResult
      };

    } catch (aiError) {
      // Check if it's a timeout error
      const errorMessage = aiError instanceof Error ? aiError.message : String(aiError);
      if (errorMessage.includes('aborted') || errorMessage.includes('timeout')) {
        console.error('⏱️ Analysis timed out after 60 seconds');
        return {
          success: false,
          error: "Website analysis is taking longer than expected. This might be a complex website. Please try again or contact support if the issue persists.",
          errorType: 'timeout'
        };
      }

      console.warn('⚠️ AI analysis failed, falling back to simple scraper:', aiError);

      // FALLBACK: Use simple scraper only if AI fails
      try {
        const { analyzeWebsiteComprehensively } = await import('@/ai/website-analyzer/simple-scraper');
        const websiteAnalysis = await analyzeWebsiteComprehensively(normalizedUrl);

        console.log('✅ Fallback scraper analysis complete!');
        console.log(`📊 Products found: ${websiteAnalysis.businessIntel.products.length}`);
        console.log(`🖼️ Images found: ${websiteAnalysis.mediaAssets.images.length}`);

        // Map scraper data to expected format
        const result = {
          businessName: websiteAnalysis.basicInfo.title.replace(/\s*[-–—]\s*.*$/, '').trim() || 'Business',
          description: websiteAnalysis.basicInfo.description,
          businessType: websiteAnalysis.businessIntel.businessType,
          industry: websiteAnalysis.businessIntel.industry,
          location: 'Global',
          services: websiteAnalysis.businessIntel.services.slice(0, 5).join('\n'),
          keyFeatures: 'Quality service delivery\nProfessional expertise\nCustomer satisfaction focus',
          competitiveAdvantages: 'Quality service delivery\nProfessional expertise',
          targetAudience: `${websiteAnalysis.businessIntel.businessType} customers seeking quality solutions`,
          visualStyle: 'Modern and professional design with clean layouts',
          writingTone: 'Professional, informative, and customer-focused',
          contentThemes: 'Quality, reliability, innovation, customer success',
          brandPersonality: 'Professional, trustworthy, innovative',
          colorPalette: {
            primary: '#3B82F6',
            secondary: '#10B981',
            accent: '#8B5CF6',
            description: 'Professional color scheme extracted from website'
          },
          contactInfo: {
            phone: websiteAnalysis.businessIntel.contactInfo.phone || '',
            email: websiteAnalysis.businessIntel.contactInfo.email || '',
            address: websiteAnalysis.businessIntel.contactInfo.address || '',
            website: normalizedUrl,
            hours: ''
          },
          socialMedia: {
            facebook: '',
            instagram: '',
            twitter: '',
            linkedin: '',
            youtube: '',
            other: []
          },
          enhancedData: {
            products: websiteAnalysis.businessIntel.products.map(product => ({
              name: product.name,
              price: product.price,
              category: product.category || 'General',
              inStock: product.inStock !== false,
              description: product.description || ''
            })),
            uniqueSellingPropositions: ['Quality service delivery', 'Professional expertise', 'Customer satisfaction focus'],
            customerPainPoints: ['Finding reliable service providers', 'Managing costs effectively', 'Ensuring quality results'],
            valuePropositions: ['Professional quality guaranteed', 'Competitive pricing', 'Expert consultation included', 'Fast and reliable service'],
            adCampaignAngles: ['Problem-solution focused messaging', 'Cost-savings emphasis', 'Speed and efficiency benefits', 'Professional expertise positioning'],
            seoKeywords: websiteAnalysis.basicInfo.keywords,
            productImages: websiteAnalysis.mediaAssets.images.filter(img => img.type === 'product').map(img => img.url),
            logoUrls: websiteAnalysis.mediaAssets.logos,
            totalImagesFound: websiteAnalysis.mediaAssets.images.length,
            marketGaps: ['Underserved customer segments', 'Technology adoption opportunities', 'Service quality improvements', 'Pricing optimization potential'],
            contentOpportunities: ['Educational content about services', 'Customer success stories', 'Behind-the-scenes content', 'Industry expertise demonstrations'],
            improvementAreas: ['Website optimization', 'SEO improvements', 'Content strategy'],
            analysisMetadata: {
              dataCompleteness: 70,
              confidenceScore: 75,
              productsFound: websiteAnalysis.businessIntel.products.length,
              imagesDownloaded: websiteAnalysis.mediaAssets.images.length,
              analysisVersion: 'v2.0-fallback-scraper'
            }
          }
        };

        if (!result.businessName || result.businessName.trim().length === 0) {
          return {
            success: false,
            error: "Could not extract a valid business name from the website.",
            errorType: 'error'
          };
        }

        return {
          success: true,
          data: result
        };

      } catch (scraperError) {
        console.error('❌ Both AI and scraper analysis failed:', scraperError);
        return {
          success: false,
          error: "Website analysis failed. Please check the URL and try again.",
          errorType: 'error'
        };
      }
    }

  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    return {
      success: false,
      error: error.message || "Unexpected error during analysis",
      errorType: 'error'
    };
  }
}

const getAspectRatioForPlatform = (platform: Platform): string => {
  // ALL PLATFORMS USE 1:1 SQUARE FOR MAXIMUM QUALITY
  // No cropping = No quality loss from Gemini's native 1024x1024
  return '1:1';
}

export async function generateContentAction(
  profile: BrandProfile,
  platform: Platform,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean; includeContacts: boolean },
  useLocalLanguage: boolean = false,
  scheduledServices?: ScheduledService[],
  includePeopleInDesigns: boolean = true
): Promise<GeneratedPost> {
  try {
    // 🔄 FETCH FRESH BRAND PROFILE DATA FROM DATABASE
    // This ensures we always use the latest colors and data, not cached frontend data
    let freshProfile: BrandProfile = profile;

    if (profile.id) {
      console.log('🔄 [Actions] Fetching fresh brand profile from database:', profile.id);
      try {
        const latestProfile = await brandProfileSupabaseService.loadBrandProfile(profile.id);
        if (latestProfile) {
          freshProfile = latestProfile;
          console.log('✅ [Actions] Fresh brand profile loaded with colors:', {
            primaryColor: latestProfile.primaryColor,
            accentColor: latestProfile.accentColor,
            backgroundColor: latestProfile.backgroundColor,
            businessName: latestProfile.businessName
          });
        } else {
          console.warn('⚠️ [Actions] Could not load fresh profile, using provided data');
        }
      } catch (error) {
        console.error('❌ [Actions] Error loading fresh profile:', error);
        console.log('⚠️ [Actions] Falling back to provided brand profile data');
      }
    } else {
      console.log('⚠️ [Actions] No brand profile ID provided, using frontend data');
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Apply brand consistency logic (using fresh profile)
    const effectiveDesignExamples = brandConsistency?.strictConsistency
      ? (freshProfile.designExamples || [])
      : []; // Don't use design examples if not strict consistency

    // Enhanced brand profile data extraction (using fresh profile)
    const enhancedProfile = {
      ...freshProfile,
      // Ensure brand colors are available
      primaryColor: profile.primaryColor || '#3B82F6',
      accentColor: profile.accentColor || '#10B981',
      backgroundColor: profile.backgroundColor || '#F8FAFC',
      // Extract services information
      servicesArray: typeof profile.services === 'string'
        ? profile.services.split('\n').filter(s => s.trim())
        : Array.isArray(profile.services)
          ? profile.services.map(s => typeof s === 'string' ? s : s.name || s.description || '')
          : [],
      // Extract contact information for brand context
      contactInfo: profile.contactInfo || {
        phone: (profile as any).contactPhone || '',
        email: (profile as any).contactEmail || '',
        address: (profile as any).contactAddress || '',
        website: profile.websiteUrl || ''
      },
      socialMedia: profile.socialMedia || {},
    };

    // 🎨📞 ENHANCED DEBUG LOGGING FOR BRAND COLORS AND CONTACT INFORMATION (Fresh Data)
    console.log('🎨 [Actions] Brand Colors Debug (Fresh Data):', {
      frontendPrimaryColor: profile.primaryColor,
      frontendAccentColor: profile.accentColor,
      frontendBackgroundColor: profile.backgroundColor,
      freshPrimaryColor: freshProfile.primaryColor,
      freshAccentColor: freshProfile.accentColor,
      freshBackgroundColor: freshProfile.backgroundColor,
      enhancedPrimaryColor: enhancedProfile.primaryColor,
      enhancedAccentColor: enhancedProfile.accentColor,
      enhancedBackgroundColor: enhancedProfile.backgroundColor,
      followBrandColors: brandConsistency?.followBrandColors,
      hasValidBrandColors: !!(freshProfile.primaryColor && freshProfile.accentColor && freshProfile.backgroundColor),
      colorsChanged: (profile.primaryColor !== freshProfile.primaryColor ||
        profile.accentColor !== freshProfile.accentColor ||
        profile.backgroundColor !== freshProfile.backgroundColor)
    });

    console.log('📞 [Actions] Contact Information Debug (Fresh Data):', {
      frontendContactInfo: profile.contactInfo,
      frontendContactPhone: (profile as any).contactPhone,
      frontendContactEmail: (profile as any).contactEmail,
      frontendContactAddress: (profile as any).contactAddress,
      frontendWebsiteUrl: profile.websiteUrl,
      freshContactInfo: freshProfile.contactInfo,
      freshWebsiteUrl: freshProfile.websiteUrl,
      enhancedContactInfo: enhancedProfile.contactInfo,
      includeContacts: brandConsistency?.includeContacts,
      hasValidContactInfo: !!(enhancedProfile.contactInfo?.phone || enhancedProfile.contactInfo?.email || enhancedProfile.websiteUrl)
    });

    // Convert arrays to newline-separated strings for AI processing
    const keyFeaturesString = Array.isArray(profile.keyFeatures)
      ? profile.keyFeatures.join('\n')
      : profile.keyFeatures || '';

    const competitiveAdvantagesString = Array.isArray(profile.competitiveAdvantages)
      ? profile.competitiveAdvantages.join('\n')
      : profile.competitiveAdvantages || '';

    // Convert services array to newline-separated string
    const servicesString = Array.isArray(profile.services)
      ? profile.services.map(service =>
        typeof service === 'object' && service.name
          ? `${service.name}: ${service.description || ''}`
          : service
      ).join('\n')
      : profile.services || '';

    // Smart contact formatting for AI generation
    const smartContactInfo = enhancedProfile.contactInfo || {};
    const priorityContacts = getPriorityContacts(smartContactInfo, 3);
    const formattedContactForAI = formatContactForAI(smartContactInfo, 150);
    const exactContactInstructions = getExactContactInstructions(smartContactInfo);
    
    console.log('📞 [Actions] Smart Contact Formatting:', {
      originalContacts: smartContactInfo,
      priorityContacts: priorityContacts.map(c => ({ type: c.type, value: c.displayValue })),
      formattedForAI: formattedContactForAI,
      exactInstructions: exactContactInstructions,
      includeContacts: brandConsistency?.includeContacts
    });

    // Ensure model registry is initialized
    if (!modelRegistry.isInitialized()) {
      await modelRegistry.initialize();
    }

    // Use Revo 1.0 model through the registry for enhanced Gemini 2.5 Flash Image Preview
    const revo10Model = modelRegistry.getModel('revo-1.0');
    if (!revo10Model) {
      throw new Error('Revo 1.0 model not available');
    }

    const generationRequest = {
      modelId: 'revo-1.0',
      profile: enhancedProfile,
      platform: platform,
      brandConsistency: brandConsistency || { strictConsistency: false, followBrandColors: true, includeContacts: false },
      artifactIds: [], // Revo 1.0 doesn't support artifacts
      contentThemes: enhancedProfile.contentThemes || [],
      writingTone: enhancedProfile.writingTone || 'professional',
      targetAudience: enhancedProfile.targetAudience || 'General',
      keyFeatures: enhancedProfile.keyFeatures || [],
      competitiveAdvantages: enhancedProfile.competitiveAdvantages || [],
      services: enhancedProfile.services || [],
      visualStyle: enhancedProfile.visualStyle || 'modern',
      primaryColor: enhancedProfile.primaryColor || '#3B82F6',
      accentColor: enhancedProfile.accentColor || '#10B981',
      backgroundColor: enhancedProfile.backgroundColor || '#F8FAFC',
      logoDataUrl: await convertLogoToDataUrl((enhancedProfile as any).logoUrl || enhancedProfile.logoDataUrl || (enhancedProfile as any).logo_url),
      logoUrl: (enhancedProfile as any).logoUrl || (enhancedProfile as any).logo_url, // Pass original URL for Revo 1.0
      designExamples: effectiveDesignExamples,
      dayOfWeek: dayOfWeek,
      currentDate: currentDate,
      // Contact information for brand consistency (using smart formatting)
      includeContacts: brandConsistency?.includeContacts || false,
      contactInfo: brandConsistency?.includeContacts 
        ? Object.fromEntries(
            priorityContacts.map(contact => [contact.type, contact.displayValue])
          )
        : {},
      websiteUrl: priorityContacts.find(c => c.type === 'website')?.value || enhancedProfile.websiteUrl,
      // Add formatted contact string for AI prompts
      formattedContacts: brandConsistency?.includeContacts ? formattedContactForAI : '',
      // Add exact contact preservation instructions
      exactContactInstructions: brandConsistency?.includeContacts ? exactContactInstructions : '',
      // Brand colors toggle
      followBrandColors: brandConsistency?.followBrandColors !== false, // Default to true
      // Local language control
      useLocalLanguage: useLocalLanguage,
      // Product image descriptions for AI context
      productImageDescriptions: profile.productImageDescriptions || {},
      // NEW: Scheduled services integration
      scheduledServices: scheduledServices || [],
      // People in designs toggle
      includePeople: includePeopleInDesigns,
      variants: [{
        platform: platform,
        aspectRatio: getAspectRatioForPlatform(platform),
      }]
    };

    const result = await revo10Model.contentGenerator.generateContent(generationRequest);

    if (!result.success) {
      throw new Error(result.error || 'Content generation failed');
    }

    const postDetails = result.data;

    const newPost: GeneratedPost = {
      id: new Date().toISOString(),
      date: today.toISOString(),
      content: postDetails.content,
      hashtags: postDetails.hashtags,
      status: 'generated',
      variants: postDetails.variants,
      catchyWords: postDetails.catchyWords,
      subheadline: postDetails.subheadline || '',
      callToAction: postDetails.callToAction || '',
      // Revo 1.0 doesn't include these advanced features
      contentVariants: undefined,
      hashtagAnalysis: undefined,
      marketIntelligence: undefined,
      localContext: undefined,
    };

    return newPost;
  } catch (error) {
    console.error('❌ Content generation error:', error);

    // Extract user-friendly message if it exists
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If it's already a user-friendly message, use it directly
    if (errorMessage.includes('🚀') || errorMessage.includes('🔧') || errorMessage.includes('😴')) {
      throw new Error(errorMessage);
    }

    // Otherwise, make it friendly
    throw new Error('Revo 1.0 is taking a quick break! 😴 Try Revo 2.0 for amazing results while we wait for it to come back online.');
  }
}

export async function generateVideoContentAction(
  profile: BrandProfile,
  catchyWords: string,
  postContent: string,
): Promise<{ videoUrl: string }> {
  try {
    const result = await generateVideoPostFlow({
      businessType: profile.businessType,
      location: profile.location,
      visualStyle: profile.visualStyle,
      imageText: catchyWords, // Use catchyWords as imageText for video generation
      postContent: postContent,
    });
    return { videoUrl: result.videoUrl };
  } catch (error) {
    // Pass the specific error message from the flow to the client
    throw new Error((error as Error).message);
  }
}

export async function generateCreativeAssetAction(
  prompt: string,
  outputType: 'image' | 'video',
  referenceAssetUrl: string | null,
  useBrandProfile: boolean,
  brandProfile: BrandProfile | null,
  maskDataUrl: string | null | undefined,
  aspectRatio: '16:9' | '9:16' | undefined,
  preferredModel?: string,
  designColors?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
  },
  accessToken?: string // Optional: pass access token from client as fallback
): Promise<CreativeAsset> {
  try {
    // Enforce credit deduction for creative studio generations
    let userId: string | null = null;
    let user: any = null;

    console.log('🔍 [Creative Studio] Starting authentication process...');

    // Try to get user from cookies (preferred method) with better error handling
    try {
      const { cookies } = await import('next/headers');
      const { createServerClient } = await import('@supabase/ssr');

      console.log('🔍 [Creative Studio] Attempting cookie authentication...');
      const cookieStore = await cookies();

      // Create Supabase client with SSR support for server actions
      const supabaseServer = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {
              // Server actions can't modify cookies, so we do nothing here
            },
          },
        }
      );

      const { data: { user: cookieUser }, error: authError } = await supabaseServer.auth.getUser();

      if (!authError && cookieUser?.id) {
        userId = cookieUser.id;
        user = cookieUser;
        console.log('✅ [Creative Studio] Cookie authentication successful:', userId);
      } else {
        console.warn('⚠️ [Creative Studio] Cookie auth failed:', authError?.message || 'No user found');
      }
    } catch (cookieError) {
      console.warn('⚠️ [Creative Studio] Cookie access error:', cookieError instanceof Error ? cookieError.message : 'Unknown cookie error');
    }

    // Fallback: Use access token if provided and cookie auth failed
    if (!userId && accessToken) {
      try {
        console.log('🔍 [Creative Studio] Attempting access token authentication...');
        const { createClient: createAdminClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(accessToken);

        if (!tokenError && tokenUser?.id) {
          userId = tokenUser.id;
          user = tokenUser;
          console.log('✅ [Creative Studio] Access token authentication successful:', userId);
        } else {
          console.warn('⚠️ [Creative Studio] Token auth failed:', tokenError?.message || 'No user found');
        }
      } catch (tokenError) {
        console.warn('⚠️ [Creative Studio] Token auth error:', tokenError instanceof Error ? tokenError.message : 'Unknown token error');
      }
    }

    if (!userId || !user) {
      console.error('❌ [Creative Studio] All authentication methods failed');
      throw new Error('🔐 Please log in to use Creative Studio. If you\'re already logged in, try refreshing the page.');
    }

    console.log('✅ [Creative Studio] Authentication successful, proceeding with generation...');

    const { withCreditTracking } = await import('@/lib/credit-integration');

    // Map preferredModel to correct ModelVersion based on the selected model
    // Credit costs: revo-1.0 (3 credits), revo-1.5 (4 credits), revo-2.0 (5 credits)
    let modelVersion: 'revo-1.0' | 'revo-1.5' | 'revo-2.0' = 'revo-1.5'; // default to 1.5

    if (preferredModel) {
      // Check for explicit model identifiers first (most specific)
      if (preferredModel.includes('revo-2.0')) {
        modelVersion = 'revo-2.0'; // 5 credits
      } else if (preferredModel.includes('revo-1.0')) {
        modelVersion = 'revo-1.0'; // 3 credits
      } else if (preferredModel.includes('revo-1.5')) {
        modelVersion = 'revo-1.5'; // 4 credits
      } else if (preferredModel.includes('2.5') || preferredModel.includes('gemini-2.5')) {
        // Default to revo-2.0 for Gemini 2.5 models (same as Quick Content logic)
        modelVersion = 'revo-2.0'; // 5 credits
      }
    }

    const wrapped = await withCreditTracking(
      {
        userId: user.id,
        modelVersion,
        feature: 'image_generation',
        generationType: 'creative_studio',
        metadata: {
          preferredModel,
          hasBrand: !!brandProfile?.id
        }
      },
      async () => await generateCreativeAssetFlow({
        prompt,
        outputType,
        referenceAssetUrl,
        useBrandProfile,
        brandProfile: useBrandProfile ? brandProfile : null,
        maskDataUrl,
        aspectRatio,
        preferredModel,
        designColors,
      })
    );

    if (!wrapped.success) {
      // Extract credit information from error message if available
      const errorMessage = wrapped.error || wrapped.creditInfo?.message || 'Credit deduction failed';

      // Check if it's a credit error and format it nicely
      if (wrapped.creditInfo?.remainingCredits !== undefined && wrapped.creditInfo?.costDeducted === 0) {
        const creditsRequired = MODEL_COSTS[modelVersion] || 0;
        const creditsAvailable = wrapped.creditInfo.remainingCredits;
        const needed = creditsRequired - creditsAvailable;

        throw new Error(
          `Insufficient credits. Need ${creditsRequired} credits, but only have ${creditsAvailable} credits.`
        );
      }

      throw new Error(errorMessage);
    }

    const result = wrapped.result!;

    let finalImageUrl = result.imageUrl;
    let imagePath: string | undefined;
    let imageBuffer: Buffer | undefined;

    // Upload image to Supabase storage if it's a data URL
    if (result.imageUrl && result.imageUrl.startsWith('data:image/')) {
      try {
        // Convert data URL to buffer
        const base64Data = result.imageUrl.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');

        // Generate unique filename
        const timestamp = Date.now();
        const brandId = brandProfile?.id || 'default';
        const filename = `generated_${timestamp}.png`;
        const storagePath = `creative-assets/${brandId}/${filename}`;

        // Upload to Supabase
        const uploadResult = await supabaseService.uploadImage(
          imageBuffer,
          storagePath,
          'image/png'
        );

        if (uploadResult) {
          // Replace data URL with Supabase URL
          finalImageUrl = uploadResult.url;
          imagePath = uploadResult.path;
        }
      } catch (uploadError) {
        console.warn('⚠️ [Creative Studio] Image upload failed:', uploadError);
        // Keep the original data URL if upload fails
      }
    }

    // Save to database (similar to Quick Content)
    try {
      // For Creative Studio, we save to generated_posts table
      // Only save if we have a brand profile (brand_profile_id is required by schema)
      if (brandProfile?.id && finalImageUrl) {
        const savedPost = await supabaseService.saveGeneratedPost(
          user.id,
          brandProfile.id,
          {
            content: `Creative Studio: ${prompt}`, // Use prompt as content
            imageText: prompt, // Store the prompt as image text
            platform: 'creative_studio', // Mark as creative studio
            aspectRatio: aspectRatio || undefined,
            generationModel: preferredModel || modelVersion,
            generationPrompt: prompt,
            generationSettings: {
              outputType,
              useBrandProfile,
              hasBrand: true,
              referenceAssetUrl,
              designColors,
              modelVersion
            }
          },
          imageBuffer // Pass the buffer if we have it
        );

        if (savedPost) {
          console.log('✅ [Creative Studio] Saved to database:', savedPost.id);
          // Update result with database ID if needed
          result.id = savedPost.id;
        }
      } else if (finalImageUrl && !brandProfile?.id) {
        // Log warning if we have an image but no brand profile to save it
        console.warn('⚠️ [Creative Studio] Generated image but no brand profile - not saving to database');
      }
    } catch (dbError) {
      // Log but don't fail - image was already generated and uploaded
      console.warn('⚠️ [Creative Studio] Failed to save to database:', dbError);
    }

    // Update result with final image URL
    result.imageUrl = finalImageUrl;

    return result;
  } catch (error) {
    console.error('❌ [Creative Studio Action] Error occurred:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Handle specific error types with user-friendly messages
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('log in')) {
      throw new Error('🔐 Please log in to use Creative Studio. If you\'re already logged in, try refreshing the page.');
    }

    if (errorMessage.includes('cookies') || errorMessage.includes('request scope')) {
      throw new Error('🔄 Creative Studio had a temporary hiccup. Please try again in a moment.');
    }

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      throw new Error('😅 Creative Studio is experiencing high demand right now! Please try again in a few minutes.');
    }

    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      throw new Error('🔧 Creative Studio is experiencing technical difficulties. Please try again in a moment.');
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      throw new Error('🌐 Connection hiccup! Please try again in a moment.');
    }

    // If it's already a user-friendly message, pass it through
    if (errorMessage.includes('😅') || errorMessage.includes('🔧') || errorMessage.includes('🌐') || errorMessage.includes('🔐') || errorMessage.includes('🔄')) {
      throw new Error(errorMessage);
    }

    // Default fallback for unknown errors
    throw new Error('🎨 Creative Studio encountered an unexpected issue. Please try again or contact support if the problem persists.');
  }
}

export async function generateEnhancedDesignAction(
  businessType: string,
  platform: string,
  visualStyle: string,
  imageText: string | { catchyWords: string; subheadline?: string; callToAction?: string },
  brandProfile?: BrandProfile,
  enableEnhancements: boolean = true,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean },
  artifactInstructions?: string,
  includePeopleInDesigns: boolean = true,
  useLocalLanguage: boolean = false,
  uploadedImageUrl?: string | null
): Promise<{
  imageUrl: string;
  qualityScore: number;
  enhancementsApplied: string[];
  processingTime: number;
}> {
  const startTime = Date.now();
  const enhancementsApplied: string[] = [];

  try {
    if (!brandProfile) {
      throw new Error('Brand profile is required for enhanced design generation');
    }

    // Handle both old string format and new object format
    let finalImageText: string;
    if (typeof imageText === 'string') {
      finalImageText = imageText;
    } else {
      // Combine catchy words, subheadline, and call-to-action
      const components = [imageText.catchyWords];
      if (imageText.subheadline && imageText.subheadline.trim()) {
        components.push(imageText.subheadline.trim());
      }
      if (imageText.callToAction && imageText.callToAction.trim()) {
        components.push(imageText.callToAction.trim());
      }
      finalImageText = components.join('\n');
    }

    // Try Gemini 2.5 first (best quality), then fallback to OpenAI, then Gemini 2.5 Flash Image Preview
    let result;

    try {

      result = await generateEnhancedDesign({
        businessType,
        platform,
        visualStyle,
        imageText: finalImageText,
        brandProfile,
        brandConsistency,
        artifactInstructions,
        includePeopleInDesigns,
        useLocalLanguage,
        designReferences: uploadedImageUrl ? [uploadedImageUrl] : undefined,
      });

    } catch (gemini25Error) {

      try {
        const { generateEnhancedDesignWithFallback } = await import('@/ai/openai-enhanced-design');

        result = await generateEnhancedDesignWithFallback({
          businessType,
          platform,
          visualStyle,
          imageText: finalImageText,
          brandProfile,
          brandConsistency,
          artifactInstructions,
          designReferences: uploadedImageUrl ? [uploadedImageUrl] : undefined,
        });

      } catch (openaiError) {

        // const { generateGeminiHDEnhancedDesignWithFallback } = await import('@/ai/gemini-hd-enhanced-design');

        // Temporary fallback while fixing syntax errors
        throw new Error('Gemini HD Enhanced Design temporarily disabled due to syntax errors');

        // result = await generateGeminiHDEnhancedDesignWithFallback({
        //   businessType,
        //   platform,
        //   visualStyle,
        //   imageText: finalImageText,
        //   brandProfile,
        //   brandConsistency,
        //   artifactInstructions,
        //   designReferences: uploadedImageUrl ? [uploadedImageUrl] : undefined,
        // });

      }
    }

    return {
      imageUrl: result.imageUrl,
      qualityScore: result.qualityScore,
      enhancementsApplied: result.enhancementsApplied,
      processingTime: result.processingTime
    };

  } catch (error) {
    throw new Error((error as Error).message);
  }
}

/**
 * Generate enhanced design specifically using Gemini 2.5 Flash Image Preview
 * This action forces the use of Gemini 2.5 Flash Image Preview for maximum quality
 */
export async function generateGeminiHDDesignAction(
  businessType: string,
  platform: string,
  visualStyle: string,
  imageText: string,
  brandProfile: BrandProfile,
  brandConsistency?: {
    strictConsistency: boolean;
    followBrandColors: boolean;
  },
  artifactInstructions?: string
): Promise<PostVariant> {
  try {
    if (!brandProfile) {
      throw new Error('Brand profile is required for Gemini 2.5 Flash Image Preview design generation');
    }

    // Temporarily disabled due to syntax errors
    // const { generateGeminiHDEnhancedDesignWithFallback } = await import('@/ai/gemini-hd-enhanced-design');

    throw new Error('Gemini HD Enhanced Design temporarily disabled due to syntax errors');

    // const result = await generateGeminiHDEnhancedDesignWithFallback({
    //   businessType,
    //   platform,
    //   visualStyle,
    //   imageText,
    //   brandProfile,
    //   brandConsistency,
    //   artifactInstructions,
    // });

    // Temporary return while fixing syntax errors
    return {
      platform,
      imageUrl: 'https://placehold.co/992x1056/cccccc/ffffff?text=Temporarily+Disabled',
      caption: imageText,
      hashtags: [],
    };
  } catch (error) {
    throw new Error(`Gemini 2.5 Flash Image Preview design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate content with artifact references (Enhanced)
 */
export async function generateContentWithArtifactsAction(
  profile: BrandProfile,
  platform: Platform,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean; includeContacts: boolean },
  artifactIds: string[] = [],
  useEnhancedDesign: boolean = true,
  includePeopleInDesigns: boolean = true,
  useLocalLanguage: boolean = false
): Promise<GeneratedPost> {
  try {

    // Get active artifacts if no specific artifacts provided
    let targetArtifacts: Artifact[] = [];

    if (artifactIds.length > 0) {
      // Use specified artifacts
      for (const artifactId of artifactIds) {
        const artifact = artifactsService.getArtifact(artifactId);
        if (artifact) {
          targetArtifacts.push(artifact);
          await artifactsService.trackUsage(artifactId, 'quick-content');
        }
      }
    } else {
      // Use active artifacts, prioritizing exact-use
      const activeArtifacts = artifactsService.getActiveArtifacts();

      const exactUseArtifacts = activeArtifacts.filter(a => a.usageType === 'exact-use');
      const referenceArtifacts = activeArtifacts.filter(a => a.usageType === 'reference');

      // Prioritize exact-use artifacts
      targetArtifacts = [...exactUseArtifacts, ...referenceArtifacts.slice(0, 3)];

      // Track usage for active artifacts
      for (const artifact of targetArtifacts) {
        await artifactsService.trackUsage(artifact.id, 'quick-content');
      }
    }

    // Generate base content first
    const basePost = await generateContentAction(profile, platform, brandConsistency, useLocalLanguage);

    // If enhanced design is disabled, return base content
    if (!useEnhancedDesign) {
      return basePost;
    }

    // Enhanced design is enabled - always use enhanced generation regardless of artifacts

    if (targetArtifacts.length === 0) {
    } else {
    }

    // Separate exact-use and reference artifacts
    const exactUseArtifacts = targetArtifacts.filter(a => a.usageType === 'exact-use');
    const referenceArtifacts = targetArtifacts.filter(a => a.usageType === 'reference');

    // Create enhanced image text structure from post components
    let enhancedImageText: { catchyWords: string; subheadline?: string; callToAction?: string } = {
      catchyWords: basePost.catchyWords || 'Engaging Content',
      subheadline: basePost.subheadline,
      callToAction: basePost.callToAction
    };
    let enhancedContent = basePost.content;

    // Collect usage instructions from artifacts
    const artifactInstructions = targetArtifacts
      .filter(a => a.instructions && a.instructions.trim())
      .map(a => `- ${a.name}: ${a.instructions}`)
      .join('\n');

    // Collect product image descriptions for AI context
    const productDescriptions = profile.productImageDescriptions
      ? Object.entries(profile.productImageDescriptions)
        .map(([productId, description]) => {
          const product = profile.productImages?.find(p => p.id === productId);
          return `- ${product?.name || 'Product'}: ${description}`;
        })
        .join('\n')
      : '';

    // Collect text overlay instructions from text artifacts
    const textOverlayInstructions = exactUseArtifacts
      .filter(a => a.textOverlay?.instructions && a.textOverlay.instructions.trim())
      .map(a => `- ${a.name}: ${a.textOverlay.instructions}`)
      .join('\n');

    // Process exact-use artifacts first (higher priority)
    if (exactUseArtifacts.length > 0) {
      const primaryExactUse = exactUseArtifacts[0];

      // Use text overlay if available
      if (primaryExactUse.textOverlay) {
        if (primaryExactUse.textOverlay.headline) {
          enhancedImageText.catchyWords = primaryExactUse.textOverlay.headline;
        }

        if (primaryExactUse.textOverlay.message) {
          enhancedContent = primaryExactUse.textOverlay.message;
        }

        // Use CTA from artifact if available
        if (primaryExactUse.textOverlay.cta) {
          enhancedImageText.callToAction = primaryExactUse.textOverlay.cta;
        }
      }
    }

    // Process reference artifacts for style guidance
    const activeDirectives = referenceArtifacts.flatMap(artifact =>
      artifact.directives.filter(directive => directive.active)
    );

    // Apply style reference directives
    const styleDirectives = activeDirectives.filter(d => d.type === 'style-reference');
    let visualStyleOverride = profile.visualStyle || 'modern';
    if (styleDirectives.length > 0) {
      const primaryStyleDirective = styleDirectives.find(d => d.priority >= 7);
      if (primaryStyleDirective) {
        visualStyleOverride = 'artifact-inspired';
      }
    }

    // Combine all instructions
    const allInstructions = [artifactInstructions, textOverlayInstructions, productDescriptions]
      .filter(Boolean)
      .join('\n');

    // Generate enhanced design with artifact context
    const enhancedResult = await generateEnhancedDesignAction(
      profile.businessType || 'business',
      platform.toLowerCase(),
      visualStyleOverride,
      enhancedImageText,
      profile,
      true,
      brandConsistency,
      allInstructions || undefined,
      includePeopleInDesigns,
      useLocalLanguage
    );

    // Create enhanced post with artifact metadata
    const enhancedPost: GeneratedPost = {
      ...basePost,
      id: Date.now().toString(),
      variants: [{
        platform: platform,
        imageUrl: enhancedResult.imageUrl
      }],
      content: targetArtifacts.length > 0
        ? `${enhancedContent}\n\n✨ Enhanced with AI+ using ${targetArtifacts.length} reference${targetArtifacts.length !== 1 ? 's' : ''} (Quality: ${enhancedResult.qualityScore}/10)`
        : `${enhancedContent}\n\n✨ Enhanced with AI+ Design Generation (Quality: ${enhancedResult.qualityScore}/10)`,
      date: new Date().toISOString(),
      // Add artifact metadata
      metadata: {
        ...basePost.metadata,
        referencedArtifacts: targetArtifacts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          category: a.category
        })),
        activeDirectives: activeDirectives.map(d => ({
          id: d.id,
          type: d.type,
          label: d.label,
          priority: d.priority
        }))
      }
    };

    return enhancedPost;

  } catch (error) {
    throw new Error((error as Error).message);
  }
}

// E-commerce specific brand analysis action
export async function analyzeEcommerceBrandAction(
  websiteUrl: string,
  designImageUris: string[],
  ecommerceContext: any
): Promise<AnalysisResult> {
  try {
    // Step 1: URL Validation and Normalization
    if (!websiteUrl || !websiteUrl.trim()) {
      return {
        success: false,
        error: "Website URL is required",
        errorType: 'error'
      };
    }

    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return {
        success: false,
        error: "Invalid URL format. Please enter a valid website URL (e.g., https://example.com).",
        errorType: 'error'
      };
    }

    // Step 2: Run E-commerce specific AI analysis
    console.log('🛒 Running E-commerce specific AI analysis with extracted data...');
    console.log('📦 E-commerce context:', {
      platform: ecommerceContext?.platform,
      totalProducts: ecommerceContext?.totalProducts,
      totalImages: ecommerceContext?.totalImages,
      productsCount: ecommerceContext?.products?.length || 0
    });

    try {
      // Use specialized e-commerce analysis endpoint
      const isDevelopment = process.env.NODE_ENV === 'development';
      const baseUrl = isDevelopment 
        ? 'http://localhost:3001' 
        : (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3001');
      
      const apiUrl = `${baseUrl}/api/analyze-ecommerce-brand`;
      console.log('📡 Calling E-commerce API:', apiUrl);

      // Add timeout for E-commerce analysis (45 seconds)
      const analysisResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: normalizedUrl,
          ecommerceContext: ecommerceContext,
          businessType: 'e-commerce'
        }),
        signal: AbortSignal.timeout(45000) // 45 second timeout
      });

      console.log('📊 E-commerce Response status:', analysisResponse.status, analysisResponse.statusText);

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ E-commerce API Error Response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || 'E-commerce analysis failed');
      }

      const result = await analysisResponse.json();
      console.log('✅ E-commerce Analysis successful:', {
        businessName: result.businessName,
        description: result.description?.substring(0, 100) + '...',
        services: Array.isArray(result.services) ? result.services.length : 0,
        products: Array.isArray(result.products) ? result.products.length : 0,
        hasProducts: !!ecommerceContext?.products?.length
      });

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('❌ E-commerce analysis failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: "E-commerce analysis timed out. The store might be too large or complex. Please try again.",
            errorType: 'timeout'
          };
        }
        
        return {
          success: false,
          error: `E-commerce analysis failed: ${error.message}`,
          errorType: 'error'
        };
      }
      
      return {
        success: false,
        error: "Unknown error during e-commerce analysis",
        errorType: 'error'
      };
    }

  } catch (error) {
    console.error('❌ E-commerce brand analysis action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "E-commerce analysis failed",
      errorType: 'error'
    };
  }
}
