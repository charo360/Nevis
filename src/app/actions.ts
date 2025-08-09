"use server";

import { analyzeBrand as analyzeBrandFlow } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import type { BrandAnalysisResult, BrandProfile, GeneratedPost } from "@/lib/types";

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

export async function generateContentAction(
  profile: BrandProfile
): Promise<GeneratedPost> {
  try {
    const today = new Date();
    const localData = await getLocalData(profile.location, today);
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const currentDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const postDetails = await generatePostFromProfileFlow({
      businessType: profile.businessType,
      location: profile.location,
      writingTone: profile.writingTone,
      contentThemes: profile.contentThemes,
      visualStyle: profile.visualStyle,
      logoDataUrl: profile.logoDataUrl,
      weather: localData.weather,
      events: localData.events,
      dayOfWeek,
      currentDate,
    });

    return {
      id: new Date().toISOString(),
      date: today.toISOString(),
      platform: 'Instagram', // Default to Instagram for now
      content: postDetails.content,
      imageUrl: postDetails.imageUrl || `https://placehold.co/1080x1080.png`,
      imageText: postDetails.imageText,
      hashtags: postDetails.hashtags,
      status: 'generated',
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
