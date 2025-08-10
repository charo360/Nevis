// src/app/actions.ts
"use server";

import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { analyzeBrand as analyzeBrandFlow, BrandAnalysisResult } from "@/ai/flows/analyze-brand";
import { generatePostFromProfile as generatePostFromProfileFlow } from "@/ai/flows/generate-post-from-profile";
import { generateVideoPost as generateVideoPostFlow } from "@/ai/flows/generate-video-post";
import { generateCreativeAsset as generateCreativeAssetFlow } from "@/ai/flows/generate-creative-asset";
import type { BrandProfile, GeneratedPost, Platform, CreativeAsset } from "@/lib/types";

// For this starter, we'll use a hardcoded document ID for the brand profile.
// In a multi-user app, this would be dynamically set based on the logged-in user.
const BRAND_PROFILE_DOC_ID = "default_brand_profile";
const POSTS_COLLECTION_ID = "generated_posts";

// --- Database Actions ---

export async function saveBrandProfileAction(profile: BrandProfile): Promise<void> {
    try {
        const profileRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
        await setDoc(profileRef, profile);
    } catch (error) {
        console.error("Error saving brand profile to Firestore:", error);
        throw new Error("Failed to save brand profile.");
    }
}

export async function getBrandProfileAction(): Promise<BrandProfile | null> {
    try {
        const profileRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID);
        const docSnap = await getDoc(profileRef);
        if (docSnap.exists()) {
            return docSnap.data() as BrandProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching brand profile from Firestore:", error);
        throw new Error("Failed to fetch brand profile.");
    }
}

export async function getGeneratedPostsAction(): Promise<GeneratedPost[]> {
    try {
        const postsCollection = collection(db, "brandProfiles", BRAND_PROFILE_DOC_ID, POSTS_COLLECTION_ID);
        const q = query(postsCollection, orderBy("date", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as GeneratedPost);
    } catch (error) {
        console.error("Error fetching generated posts:", error);
        throw new Error("Failed to fetch posts.");
    }
}

async function saveGeneratedPostAction(post: GeneratedPost): Promise<void> {
     try {
        const postRef = doc(db, "brandProfiles", BRAND_PROFILE_DOC_ID, POSTS_COLLECTION_ID, post.id);
        await setDoc(postRef, post);
    } catch (error) {
        console.error("Error saving generated post:", error);
        throw new Error("Failed to save post.");
    }
}

export async function updateGeneratedPostAction(post: GeneratedPost): Promise<void> {
    // For Firestore, save and update can be the same operation with setDoc
    return saveGeneratedPostAction(post);
}


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

    // Save the newly generated post to the database
    await saveGeneratedPostAction(newPost);

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
    referenceImageUrl: string | null,
    useBrandProfile: boolean,
    brandProfile: BrandProfile | null
): Promise<CreativeAsset> {
    try {
        const result = await generateCreativeAssetFlow({
            prompt,
            outputType,
            referenceImageUrl,
            useBrandProfile,
            brandProfile: useBrandProfile ? brandProfile : null
        });
        return result;
    } catch (error) {
        console.error("Error generating creative asset:", error);
        throw new Error((error as Error).message);
    }
}
