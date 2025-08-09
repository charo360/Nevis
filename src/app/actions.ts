"use server";

import { analyzeBrand as analyzeBrandFlow } from "@/ai/flows/analyze-brand";
import { generateDailyPost as generateDailyPostFlow } from "@/ai/flows/generate-daily-post";
import { generateBrandConsistentImage as generateBrandConsistentImageFlow } from "@/ai/flows/generate-brand-consistent-image";
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

    const postDetails = await generateDailyPostFlow({
      businessType: profile.businessType,
      location: profile.location,
      brandVoice: profile.writingTone,
      weather: localData.weather,
      events: localData.events,
      dayOfWeek,
    });
    
    const imageDetails = await generateBrandConsistentImageFlow({
        textContent: postDetails.content,
        businessType: profile.businessType,
        location: profile.location,
        visualStyle: profile.visualStyle,
        logoDataUrl: profile.logoDataUrl,
    });

    return {
      id: new Date().toISOString(),
      date: today.toISOString(),
      platform: 'Instagram', // Default to Instagram for now
      content: postDetails.content,
      imageUrl: imageDetails.imageUrl || `https://placehold.co/1080x1080.png`,
      hashtags: postDetails.hashtags,
      status: 'generated',
    };
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error("Failed to generate content. Please try again later.");
  }
}
