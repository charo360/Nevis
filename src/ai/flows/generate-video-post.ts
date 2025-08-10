// src/ai/flows/generate-video-post.ts
'use server';

/**
 * @fileOverview A Genkit flow for generating a short promotional video for a social media post.
 *
 * This flow utilizes a text-to-video model to create dynamic content based on brand information,
 * local context, and specific post details.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { MediaPart } from 'genkit';
import { GenerateRequest } from 'genkit/generate';

// Define the input schema for the video generation flow.
const GenerateVideoInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  imageText: z.string().describe('A brief, catchy headline for the video.'),
  postContent: z.string().describe('The full text content of the social media post for additional context.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

// Define the output schema for the video generation flow.
const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated video file.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;

/**
 * An exported wrapper function that calls the video generation flow.
 * @param input - The input data for video generation.
 * @returns A promise that resolves to the generated video URL.
 */
export async function generateVideoPost(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoPostFlow(input);
}

/**
 * Helper function to download video and convert to data URI
 */
async function videoToDataURI(videoPart: MediaPart): Promise<string> {
    if (!videoPart.media || !videoPart.media.url) {
        throw new Error('Media URL not found in video part.');
    }

    const fetch = (await import('node-fetch')).default;
    // Add API key before fetching the video.
    const videoDownloadResponse = await fetch(
        `${videoPart.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok) {
        throw new Error(`Failed to download video: ${videoDownloadResponse.statusText}`);
    }

    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');
    // Default to video/mp4 if contentType is not provided
    const contentType = videoPart.media.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64Video}`;
}

/**
 * Wraps ai.generate with retry logic for 503 errors.
 */
async function generateWithRetry(request: GenerateRequest, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const result = await ai.generate(request);
            return result;
        } catch (e: any) {
            if (e.message && e.message.includes('503') && i < retries - 1) {
                console.log(`Attempt ${i + 1} failed with 503. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                if (e.message && e.message.includes('503')) {
                    throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
                }
                throw e; // Rethrow other errors immediately
            }
        }
    }
    // This line should not be reachable if retries are configured, but as a fallback:
    throw new Error("The AI model is currently overloaded after multiple retries. Please try again later.");
}

/**
 * The core Genkit flow for generating a video post.
 */
const generateVideoPostFlow = ai.defineFlow(
  {
    name: 'generateVideoPostFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async (input) => {
    const videoPrompt = `Create a short, engaging promotional video with sound for a ${input.businessType} in ${input.location}.
The visual style should be ${input.visualStyle}.
The video should be visually appealing and suitable for a social media post.

The main headline for the video is: "${input.imageText}".

For additional context, here is the full post content that will accompany the video: "${input.postContent}".

Generate a video that is cinematically interesting, has relevant sound, and captures the essence of the post content.`;

    try {
      const result = await generateWithRetry({
        model: 'googleai/veo-3.0-generate-preview',
        prompt: videoPrompt,
      });
      let operation = result.operation;

      if (!operation) {
          throw new Error('Expected the model to return an operation');
      }

      // Poll for completion
      while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s
          operation = await ai.checkOperation(operation);
      }

      if (operation.error) {
          console.error("Video generation operation failed", operation.error);
          throw new Error(`Video generation failed. Please try again. Error: ${operation.error.message}`);
      }

      // Relaxed check for the video part
      const videoPart = operation.output?.message?.content.find(p => !!p.media);
      
      if (!videoPart || !videoPart.media) {
          throw new Error('No video was generated in the operation result.');
      }
      
      const videoDataUrl = await videoToDataURI(videoPart);

      return {
        videoUrl: videoDataUrl, 
      };
    } catch (e: any) {
        console.error("Error during video generation:", e);
        throw new Error(e.message || "Video generation failed. The model may be overloaded. Please try again in a few moments.");
    }
  }
);
