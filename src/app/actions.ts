// src/app/actions.ts
"use server";

import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset } from "@/lib/types";
import { artifactsService } from "@/lib/services/artifacts-service";
import type { Artifact } from "@/lib/types/artifacts";
import { generateEnhancedDesign } from "@/ai/gemini-2.5-design";


// --- AI Flow Actions ---

export async function analyzeBrandAction(
  websiteUrl: string,
  designImageUris: string[],
): Promise<BrandAnalysisResult> {
  try {
    console.log("🔍 Starting brand analysis for URL:", websiteUrl);
    console.log("🖼️ Design images count:", designImageUris.length);

    const result = await analyzeBrandFlow({ websiteUrl, designImageUris });

    console.log("✅ Brand analysis result:", JSON.stringify(result, null, 2));
    console.log("🔍 Result type:", typeof result);
    console.log("🔍 Result keys:", result ? Object.keys(result) : "No result");

    return result;
  } catch (error) {
    console.error("❌ Error analyzing brand:", error);
    throw new Error("Failed to analyze brand. Please check the URL and try again.");
  }
}

const getAspectRatioForPlatform = (platform: Platform): string => {
  switch (platform) {
    case 'Instagram':
      return '1:1'; // Square
    case 'Facebook':
      return '1:1'; // Square is highly compatible
    case 'Twitter':
      return '16:9'; // Landscape
    case 'LinkedIn':
      return '1:1'; // Square is recommended
    default:
      return '1:1';
  }
}

export async function generateContentAction(
  profile: BrandProfile,
  platform: Platform,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean }
): Promise<GeneratedPost> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Apply brand consistency logic
    const effectiveDesignExamples = brandConsistency?.strictConsistency
      ? (profile.designExamples || [])
      : []; // Don't use design examples if not strict consistency

    // Convert arrays to newline-separated strings for AI processing
    const keyFeaturesString = Array.isArray(profile.keyFeatures)
      ? profile.keyFeatures.join('\n')
      : profile.keyFeatures || '';

    const competitiveAdvantagesString = Array.isArray(profile.competitiveAdvantages)
      ? profile.competitiveAdvantages.join('\n')
      : profile.competitiveAdvantages || '';

    console.log('🔍 Data transformation debug:');
    console.log('- keyFeatures type:', typeof profile.keyFeatures);
    console.log('- keyFeatures value:', profile.keyFeatures);
    console.log('- keyFeaturesString:', keyFeaturesString);
    console.log('- competitiveAdvantages type:', typeof profile.competitiveAdvantages);
    console.log('- competitiveAdvantagesString:', competitiveAdvantagesString);

    const postDetails = await generatePostFromProfileFlow({
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: profile.contentThemes,
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
      designExamples: effectiveDesignExamples, // Use design examples based on consistency preference
      primaryColor: profile.primaryColor,
      accentColor: profile.accentColor,
      backgroundColor: profile.backgroundColor,
      dayOfWeek,
      currentDate,
      variants: [{
        platform: platform,
        aspectRatio: getAspectRatioForPlatform(platform),
      }],
      // Pass new detailed fields
      services: profile.services,
      targetAudience: profile.targetAudience,
      keyFeatures: keyFeaturesString,
      competitiveAdvantages: competitiveAdvantagesString,
      // Pass brand consistency preferences
      brandConsistency: brandConsistency || { strictConsistency: false, followBrandColors: true },
    });

    const newPost: GeneratedPost = {
      id: new Date().toISOString(),
      date: today.toISOString(),
      content: postDetails.content,
      hashtags: postDetails.hashtags,
      status: 'generated',
      variants: postDetails.variants,
      imageText: postDetails.imageText,
      // Include enhanced AI features
      contentVariants: postDetails.contentVariants,
      hashtagAnalysis: postDetails.hashtagAnalysis,
      // Include advanced AI features
      marketIntelligence: postDetails.marketIntelligence,
      // Include local context features
      localContext: postDetails.localContext,
    };

    return newPost;
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again later.");
  }
}

export async function generateVideoContentAction(
  profile: BrandProfile,
  imageText: string,
  postContent: string,
): Promise<{ videoUrl: string }> {
  try {
    const result = await generateVideoPostFlow({
      businessType: profile.businessType,
      location: profile.location,
      visualStyle: profile.visualStyle,
      imageText: imageText,
      postContent: postContent,
    });
    return { videoUrl: result.videoUrl };
  } catch (error) {
    console.error("Error generating video content:", error);
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
  aspectRatio: '16:9' | '9:16' | undefined
): Promise<CreativeAsset> {
  try {
    const result = await generateCreativeAssetFlow({
      prompt,
      outputType,
      referenceAssetUrl,
      useBrandProfile,
      brandProfile: useBrandProfile ? brandProfile : null,
      maskDataUrl,
      aspectRatio,
    });
    return result;
  } catch (error) {
    console.error("Error generating creative asset:", error);
    // Always pass the specific error message from the flow to the client.
    throw new Error((error as Error).message);
  }
}

export async function generateEnhancedDesignAction(
  businessType: string,
  platform: string,
  visualStyle: string,
  imageText: string,
  brandProfile?: BrandProfile,
  enableEnhancements: boolean = true,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean },
  artifactInstructions?: string
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

    console.log('🎨 Enhanced Design Generation Started');
    console.log('- Business Type:', businessType);
    console.log('- Platform:', platform);
    console.log('- Visual Style:', visualStyle);
    console.log('- Image Text:', imageText);
    console.log('- Brand Profile:', brandProfile.businessName);
    console.log('- Enhancements Enabled:', enableEnhancements);

    // Try Gemini 2.5 first (best quality), then fallback to OpenAI, then Gemini 2.0 HD
    let result;

    try {
      console.log('🚀 Using Gemini 2.5 Pro for superior design generation...');

      result = await generateEnhancedDesign({
        businessType,
        platform,
        visualStyle,
        imageText,
        brandProfile,
        brandConsistency,
        artifactInstructions,
      });

      console.log('✅ Gemini 2.5 enhanced design generated successfully');
      console.log(`🎯 Quality Score: ${result.qualityScore}/10`);
      console.log(`⚡ Processing Time: ${result.processingTime}ms`);

    } catch (gemini25Error) {
      console.warn('⚠️ Gemini 2.5 generation failed, falling back to OpenAI:', gemini25Error);

      try {
        console.log('🚀 Using OpenAI GPT-Image 1 for enhanced design generation...');
        const { generateEnhancedDesignWithFallback } = await import('@/ai/openai-enhanced-design');

        result = await generateEnhancedDesignWithFallback({
          businessType,
          platform,
          visualStyle,
          imageText,
          brandProfile,
          brandConsistency,
          artifactInstructions,
        });

        console.log('✅ OpenAI GPT-Image 1 enhanced design generated successfully');
      } catch (openaiError) {
        console.warn('⚠️ OpenAI generation also failed, falling back to Gemini 2.0 HD:', openaiError);

        console.log('🚀 Using Gemini 2.0 Flash HD for enhanced design generation...');
        const { generateGeminiHDEnhancedDesignWithFallback } = await import('@/ai/gemini-hd-enhanced-design');

        result = await generateGeminiHDEnhancedDesignWithFallback({
          businessType,
          platform,
          visualStyle,
          imageText,
          brandProfile,
          brandConsistency,
          artifactInstructions,
        });

        console.log('✅ Gemini 2.0 HD enhanced design generated successfully');
      }
    }

    console.log('🔗 Image URL:', result.imageUrl);
    console.log('⭐ Quality Score:', result.qualityScore);
    console.log('🎯 Enhancements Applied:', result.enhancementsApplied);

    return {
      imageUrl: result.imageUrl,
      qualityScore: result.qualityScore,
      enhancementsApplied: result.enhancementsApplied,
      processingTime: result.processingTime
    };


  } catch (error) {
    console.error("Error generating enhanced design:", error);
    throw new Error((error as Error).message);
  }
}

/**
 * Generate enhanced design specifically using Gemini 2.0 Flash HD
 * This action forces the use of Gemini HD for maximum quality
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
      throw new Error('Brand profile is required for Gemini HD design generation');
    }

    console.log('🎨 Gemini HD Design Generation Started');
    console.log('- Business Type:', businessType);
    console.log('- Platform:', platform);
    console.log('- Visual Style:', visualStyle);
    console.log('- Image Text:', imageText);
    console.log('- Brand Profile:', brandProfile.businessName);

    console.log('🚀 Using Gemini 2.0 Flash HD for enhanced design generation...');
    const { generateGeminiHDEnhancedDesignWithFallback } = await import('@/ai/gemini-hd-enhanced-design');

    const result = await generateGeminiHDEnhancedDesignWithFallback({
      businessType,
      platform,
      visualStyle,
      imageText,
      brandProfile,
      brandConsistency,
      artifactInstructions,
    });

    console.log('✅ Gemini HD enhanced design generated successfully');
    console.log('🔗 Image URL:', result.imageUrl);
    console.log('⭐ Quality Score:', result.qualityScore);
    console.log('🎯 Enhancements Applied:', result.enhancementsApplied);

    return {
      platform,
      imageUrl: result.imageUrl,
      caption: imageText,
      hashtags: [],
    };
  } catch (error) {
    console.error('❌ Error in Gemini HD design generation:', error);
    throw new Error(`Gemini HD design generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate content with artifact references (Enhanced)
 */
export async function generateContentWithArtifactsAction(
  profile: BrandProfile,
  platform: Platform,
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean },
  artifactIds: string[] = [],
  useEnhancedDesign: boolean = true
): Promise<GeneratedPost> {
  try {
    console.log('🎨 Generating content with artifacts...');
    console.log('- Platform:', platform);
    console.log('- Artifacts:', artifactIds.length);
    console.log('- Enhanced Design:', useEnhancedDesign);

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
      console.log('🔍 Active artifacts found:', activeArtifacts.length);
      console.log('📋 Active artifacts details:', activeArtifacts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        usageType: a.usageType,
        isActive: a.isActive,
        instructions: a.instructions
      })));

      const exactUseArtifacts = activeArtifacts.filter(a => a.usageType === 'exact-use');
      const referenceArtifacts = activeArtifacts.filter(a => a.usageType === 'reference');

      // Prioritize exact-use artifacts
      targetArtifacts = [...exactUseArtifacts, ...referenceArtifacts.slice(0, 3)];

      // Track usage for active artifacts
      for (const artifact of targetArtifacts) {
        await artifactsService.trackUsage(artifact.id, 'quick-content');
      }
    }

    console.log('📎 Using artifacts:', targetArtifacts.map(a => `${a.name} (${a.usageType})`));

    // Generate base content first
    const basePost = await generateContentAction(profile, platform, brandConsistency);

    // If enhanced design is disabled, return base content
    if (!useEnhancedDesign) {
      console.log('🔄 Enhanced design disabled, using base content generation');
      return basePost;
    }

    // Enhanced design is enabled - always use enhanced generation regardless of artifacts
    console.log('🎨 Enhanced design enabled - proceeding with enhanced generation');
    console.log(`📊 Artifacts available: ${targetArtifacts.length}`);

    if (targetArtifacts.length === 0) {
      console.log('✨ No artifacts provided - using enhanced design without artifact context');
    } else {
      console.log('🎯 Using enhanced design with artifact context');
    }

    // Separate exact-use and reference artifacts
    const exactUseArtifacts = targetArtifacts.filter(a => a.usageType === 'exact-use');
    const referenceArtifacts = targetArtifacts.filter(a => a.usageType === 'reference');

    let enhancedImageText = basePost.imageText || 'Engaging Content';
    let enhancedContent = basePost.content;

    // Collect usage instructions from artifacts
    const artifactInstructions = targetArtifacts
      .filter(a => a.instructions && a.instructions.trim())
      .map(a => `- ${a.name}: ${a.instructions}`)
      .join('\n');

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
          enhancedImageText = primaryExactUse.textOverlay.headline;
          console.log('📝 Using headline from exact-use artifact:', enhancedImageText);
        }

        if (primaryExactUse.textOverlay.message) {
          enhancedContent = primaryExactUse.textOverlay.message;
          console.log('📝 Using message from exact-use artifact');
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
      console.log('🎨 Applying style references from artifacts');
      const primaryStyleDirective = styleDirectives.find(d => d.priority >= 7);
      if (primaryStyleDirective) {
        visualStyleOverride = 'artifact-inspired';
        console.log('🎨 Using artifact-inspired visual style');
      }
    }

    // Combine all instructions
    const allInstructions = [artifactInstructions, textOverlayInstructions]
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
      allInstructions || undefined
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

    console.log('✅ Enhanced content with artifacts generated successfully');
    return enhancedPost;

  } catch (error) {
    console.error("Error generating content with artifacts:", error);
    throw new Error((error as Error).message);
  }
}
