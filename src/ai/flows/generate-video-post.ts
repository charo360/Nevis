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

// Define the input schema for the video generation flow.
const GenerateVideoInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  imageText: z.string().describe('A brief, catchy headline to be overlaid on the video.'),
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
    const contentType = videoPart.media.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64Video}`;
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
    const videoPrompt = `Create a short, engaging promotional video for a ${input.businessType} in ${input.location}. The visual style should be ${input.visualStyle}. The video should be visually appealing and suitable for a social media post. It should also have a clear area where text can be overlaid. The text to include is: "${input.imageText}".`;

    let { operation } = await ai.generate({
        model: 'googleai/veo-2.0-generate-001',
        prompt: videoPrompt,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
      });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    const videoPart = operation.output?.message?.content.find(p => !!p.media && p.media.contentType?.startsWith('video/'));
    
    if (!videoPart || !videoPart.media) {
        throw new Error('No video was generated in the operation result.');
    }
    
    const videoDataUrl = await videoToDataURI(videoPart);

    return {
      videoUrl: videoDataUrl, 
    };
  }
);
