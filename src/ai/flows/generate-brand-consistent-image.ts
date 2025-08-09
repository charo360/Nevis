// src/ai/flows/generate-brand-consistent-image.ts
'use server';
/**
 * @fileOverview Generates brand-consistent images using DALL-E 3 based on text content and user's brand profile.
 *
 * - generateBrandConsistentImage - A function that handles the image generation process.
 * - GenerateBrandConsistentImageInput - The input type for the generateBrandConsistentImage function.
 * - GenerateBrandConsistentImageOutput - The return type for the generateBrandConsistentImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBrandConsistentImageInputSchema = z.object({
  textContent: z.string().describe('The text content for which an image needs to be generated.'),
  businessType: z.string().describe('The type of the business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  brandStyleMood: z.string().describe('The mood of the brand style (e.g., modern, vintage).'),
  brandStyleColorPalette: z.string().describe('The color palette of the brand (e.g., pastel, vibrant).'),
  brandStyleDesignElements: z.string().describe('The design elements of the brand (e.g., minimalist, geometric).'),
});

export type GenerateBrandConsistentImageInput = z.infer<typeof GenerateBrandConsistentImageInputSchema>;

const GenerateBrandConsistentImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});

export type GenerateBrandConsistentImageOutput = z.infer<typeof GenerateBrandConsistentImageOutputSchema>;

export async function generateBrandConsistentImage(input: GenerateBrandConsistentImageInput): Promise<GenerateBrandConsistentImageOutput> {
  return generateBrandConsistentImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBrandConsistentImagePrompt',
  input: {schema: GenerateBrandConsistentImageInputSchema},
  output: {schema: GenerateBrandConsistentImageOutputSchema},
  prompt: `Create a {{{brandStyleMood}}} image for a {{businessType}} in {{location}}. Use {{brandStyleColorPalette}} color scheme. Style: {{brandStyleDesignElements}}. Content context: {{{textContent}}}. Professional quality, social media optimized.`,
});

const generateBrandConsistentImageFlow = ai.defineFlow(
  {
    name: 'generateBrandConsistentImageFlow',
    inputSchema: GenerateBrandConsistentImageInputSchema,
    outputSchema: GenerateBrandConsistentImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Create a {{{brandStyleMood}}} image for a {{businessType}} in {{location}}. Use {{brandStyleColorPalette}} color scheme. Style: {{brandStyleDesignElements}}. Content context: {{{textContent}}}. Professional quality, social media optimized.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {imageUrl: media?.url ?? ''};
  }
);
