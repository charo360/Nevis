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
    const result = await analyzeBrandFlow({ websiteUrl, designImageUris });
    return result;
  } catch (error) {
    console.error("Error analyzing brand:", error);
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
): Promise<GeneratedPost> {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const postDetails = await generatePostFromProfileFlow({
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: profile.contentThemes,
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
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
    });

    const newPost: GeneratedPost = {
      id: new Date().toISOString(),
      date: today.toISOString(),
      content: postDetails.content,
      hashtags: postDetails.hashtags,
      status: 'generated',
      variants: postDetails.variants,
      imageText: postDetails.imageText,
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
