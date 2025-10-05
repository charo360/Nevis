// src/app/actions.ts
"use server";

import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { modelRegistry } from "@/ai/models/registry/model-registry";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset } from "@/lib/types";
import { artifactsService } from "@/lib/services/artifacts-service";
import type { Artifact } from "@/lib/types/artifacts";
import { generateEnhancedDesign } from "@/ai/gemini-2.5-design";
import { generateRevo2ContentAction, generateRevo2CreativeAssetAction } from "@/app/actions/revo-2-actions";
import { supabaseService } from "@/lib/services/supabase-service";
import type { ScheduledService } from "@/services/calendar-service";

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
      console.log('🔄 Converting logo URL to base64 for AI generation:', logoUrl.substring(0, 50) + '...');

      const response = await fetch(logoUrl);
      if (!response.ok) {
        console.warn('⚠️ Failed to fetch logo from URL:', response.status);
        return undefined;
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      console.log('✅ Logo converted to base64 successfully (' + buffer.byteLength + ' bytes)');
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

    // Step 2: Check robots.txt (log warning but don't block)
    try {
      const robotsResponse = await fetch(`${normalizedUrl}/robots.txt`, { signal: AbortSignal.timeout(5000) });
      if (robotsResponse.ok) {
        const robotsText = await robotsResponse.text();
        if (robotsText.includes('Disallow: /')) {
          console.warn('⚠️ Website has robots.txt that disallows scraping, but proceeding for user-initiated analysis');
        }
      }
    } catch {
      // Ignore robots.txt errors, proceed
    }

    // Step 3: Scrape content using basic fetch (for static sites; dynamic sites may not work perfectly)
    let scrapedContent = '';
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      // Simple text extraction from HTML (remove basic tags)
      scrapedContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                           .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                           .replace(/<[^>]+>/g, ' ')
                           .replace(/\s+/g, ' ')
                           .trim();

      if (!scrapedContent || scrapedContent.length < 100) {
        return {
          success: false,
          error: "Unable to extract sufficient content from the website. It may be protected or have minimal text.",
          errorType: 'error'
        };
      }
    } catch (scrapeError: any) {
      if (scrapeError.name === 'AbortError') {
        return {
          success: false,
          error: "Website took too long to load. Please try again or use a different URL.",
          errorType: 'timeout'
        };
      }
      return {
        success: false,
        error: "Failed to access the website. It may be down or blocking requests.",
        errorType: 'error'
      };
    }

    // Step 4: Call existing AI analysis with scraped content
    const result = await analyzeBrandFlow({
      websiteUrl: normalizedUrl,
      designImageUris: designImageUris || [],
      websiteContent: scrapedContent // Pass scraped content to AI flow for better accuracy
    });

    if (!result) {
      return {
        success: false,
        error: "Analysis returned empty result",
        errorType: 'error'
      };
    }

    // Step 5: Basic validation of AI result
    if (!result.businessName || typeof result.businessName !== 'string' || result.businessName.trim().length === 0) {
      return {
        success: false,
        error: "AI could not extract a valid business name from the website.",
        errorType: 'error'
      };
    }

    return {
      success: true,
      data: result
    };

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
    console.log('🎯 generateContentAction called with scheduled services:', {
      scheduledServicesCount: scheduledServices?.length || 0,
      scheduledServiceNames: scheduledServices?.map(s => s.serviceName) || [],
      businessName: profile.businessName
    });

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Apply brand consistency logic
    const effectiveDesignExamples = brandConsistency?.strictConsistency
      ? (profile.designExamples || [])
      : []; // Don't use design examples if not strict consistency

    // Enhanced brand profile data extraction
    const enhancedProfile = {
      ...profile,
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
        address: (profile as any).contactAddress || ''
      },
      socialMedia: profile.socialMedia || {},
    };

    // Debug logging for contact information
    console.log('🔍 [Actions] Contact Information Debug:', {
      profileContactInfo: profile.contactInfo,
      profileContactPhone: (profile as any).contactPhone,
      profileContactEmail: (profile as any).contactEmail,
      profileContactAddress: (profile as any).contactAddress,
      enhancedContactInfo: enhancedProfile.contactInfo,
      includeContacts: brandConsistency?.includeContacts
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



    // Ensure model registry is initialized
    if (!modelRegistry.isInitialized()) {
      await modelRegistry.initialize();
    }


    // Use Revo 1.0 model through the registry for enhanced Gemini 2.5 Flash Image Preview
    const revo10Model = modelRegistry.getModel('revo-1.0');
    if (!revo10Model) {
      throw new Error('Revo 1.0 model not available');
    }


    console.log('🔍 [Actions] People Toggle Debug:', {
      includePeopleInDesignsParam: includePeopleInDesigns,
      includePeopleInDesignsType: typeof includePeopleInDesigns,
      businessName: profile.businessName
    });

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
      // Contact information for brand consistency
      includeContacts: brandConsistency?.includeContacts || false,
      contactInfo: enhancedProfile.contactInfo || {},
      websiteUrl: enhancedProfile.websiteUrl,
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

    console.log('🔍 [Actions] Generation Request People Toggle:', {
      includePeople: generationRequest.includePeople,
      includePeopleType: typeof generationRequest.includePeople
    });

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
  }
): Promise<CreativeAsset> {
  try {
    console.log('🎨 [Creative Studio Action] Called with:', {
      prompt,
      outputType,
      preferredModel,
      useBrandProfile,
      brandProfileName: brandProfile?.businessName,
      hasReferenceAsset: !!referenceAssetUrl
    });

    const result = await generateCreativeAssetFlow({
      prompt,
      outputType,
      referenceAssetUrl,
      useBrandProfile,
      brandProfile: useBrandProfile ? brandProfile : null,
      maskDataUrl,
      aspectRatio,
      preferredModel,
      designColors,
    });

    // Upload image to Supabase storage if it's a data URL
    if (result.imageUrl && result.imageUrl.startsWith('data:image/')) {
      try {
        console.log('🔄 Uploading generated image to Supabase storage...');

        // Convert data URL to buffer
        const base64Data = result.imageUrl.split(',')[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');

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
          console.log('✅ Image uploaded to Supabase:', uploadResult.url);
          // Replace data URL with Supabase URL
          result.imageUrl = uploadResult.url;
        } else {
          console.log('⚠️ Supabase upload failed, keeping data URL');
        }
      } catch (uploadError) {
        console.log('⚠️ Image upload error, keeping data URL:', uploadError);
        // Keep the original data URL if upload fails
      }
    }

    return result;
  } catch (error) {
    // Always pass the specific error message from the flow to the client.
    throw new Error((error as Error).message);
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
