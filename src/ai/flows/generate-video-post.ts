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
import * as fs from 'fs';
import {Readable} from 'stream';

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
    
    // This is a placeholder for downloading and converting the video to a data URI
    // In a real implementation, you would fetch the video from the URL and encode it.
    // For now, we'll just return a placeholder.
    const videoDataUrl = videoPart.media.url; // In a real scenario, you'd process this URL.

    return {
      videoUrl: videoDataUrl, 
    };
  }
);
