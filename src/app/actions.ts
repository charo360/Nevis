// src/app/actions.ts
"use server";

import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset } from "@/lib/types";


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
      keyFeatures: profile.keyFeatures,
      competitiveAdvantages: profile.competitiveAdvantages,
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
  brandConsistency?: { strictConsistency: boolean; followBrandColors: boolean }
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

    // Use OpenAI DALL-E 3 for enhanced design generation
    console.log('🚀 Using OpenAI DALL-E 3 for enhanced design generation...');

    const { generateEnhancedDesignWithFallback } = await import('@/ai/openai-enhanced-design');

    const result = await generateEnhancedDesignWithFallback({
      businessType,
      platform,
      visualStyle,
      imageText,
      brandProfile,
      brandConsistency,
    });

    console.log('✅ OpenAI enhanced design generated successfully');
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
