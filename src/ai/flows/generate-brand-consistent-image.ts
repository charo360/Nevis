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
  imageText: z.string().describe('The short text to be placed on the image.'),
  businessType: z.string().describe('The type of the business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  logoDataUrl: z.string().describe("The business logo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export type GenerateBrandConsistentImageInput = z.infer<typeof GenerateBrandConsistentImageInputSchema>;

const GenerateBrandConsistentImageOutputSchema = z.object({
  imageUrl: z.string().describe('The URL of the generated image.'),
});

export type GenerateBrandConsistentImageOutput = z.infer<typeof GenerateBrandConsistentImageOutputSchema>;

export async function generateBrandConsistentImage(input: GenerateBrandConsistentImageInput): Promise<GenerateBrandConsistentImageOutput> {
  return generateBrandConsistentImageFlow(input);
}

const generateBrandConsistentImageFlow = ai.defineFlow(
  {
    name: 'generateBrandConsistentImageFlow',
    inputSchema: GenerateBrandConsistentImageInputSchema,
    outputSchema: GenerateBrandConsistentImageOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {text: `Generate an appealing background image for a social media post for a ${input.businessType} in ${input.location}. The brand's visual style is ${input.visualStyle}.`},
        {text: `Now, overlay the following text onto the image: "${input.imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated at the edges of the image. The entire text must be visible.`},
        {media: {url: input.logoDataUrl}},
        {text: 'Place the provided logo naturally onto the generated background image. The logo should be clearly visible but not overpower the main subject. It could be on a product, a sign, or as a subtle watermark.'}
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {imageUrl: media?.url ?? ''};
  }
);
