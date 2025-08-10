"use server";

import { analyzeBrand as analyzeBrandFlow } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import type { BrandAnalysisResult, BrandProfile, GeneratedPost, Platform } from "@/lib/types";

// Mock function for local data fetching
async function getLocalData(location: string, date: Date) {
  // In a real app, this would call OpenWeatherMap, Eventbrite, etc.
  console.log(`Fetching local data for ${location} on ${date.toDateString()}`);
  return {
    weather: "sunny with a high of 75°F",
    events: "the annual city fair is happening this weekend at the central park",
  };
}

export async function analyzeBrandAction(
  url: string
): Promise<BrandAnalysisResult> {
  try {
    const result = await analyzeBrandFlow({ socialMediaUrl: url });
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
  platforms: Platform[]
): Promise<GeneratedPost> {
  try {
    const today = new Date();
    const localData = await getLocalData(profile.location, today);
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const variantsToGenerate = platforms.map(platform => ({
        platform,
        aspectRatio: getAspectRatioForPlatform(platform),
    }));

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
      weather: localData.weather,
      events: localData.events,
      dayOfWeek,
      currentDate,
      // Pass the variants array to the flow
      variants: variantsToGenerate,
      // These are now part of the variants array, but we can keep one for top-level context
      platform: platforms[0],
      aspectRatio: getAspectRatioForPlatform(platforms[0]),
    });

    return {
      id: new Date().toISOString(),
      date: today.toISOString(),
      content: postDetails.content,
      hashtags: postDetails.hashtags,
      status: 'generated',
      variants: postDetails.variants,
      imageText: postDetails.imageText,
    };
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again later.");
  }
}

export async function generateVideoContentAction(
  profile: BrandProfile,
  imageText: string
): Promise<{ videoUrl: string }> {
  try {
    const result = await generateVideoPostFlow({
      businessType: profile.businessType,
      location: profile.location,
      visualStyle: profile.visualStyle,
      imageText: imageText,
    });
    return { videoUrl: result.videoUrl };
  } catch (error) {
    console.error("Error generating video content:", error);
    // Pass the specific error message from the flow to the client
    throw new Error((error as Error).message);
  }
}
