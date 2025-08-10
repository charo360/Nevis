// src/ai/flows/generate-creative-asset.ts
'use server';

/**
 * @fileOverview A Genkit flow for generating a creative asset (image or video)
 * based on a user's prompt, an optional reference image, and brand profile settings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { BrandProfile } from '@/lib/types';
import { MediaPart } from 'genkit';

// Define the input schema for the creative asset generation flow.
const CreativeAssetInputSchema = z.object({
  prompt: z.string().describe('The main text prompt describing the desired asset.'),
  outputType: z.enum(['image', 'video']).describe('The type of asset to generate.'),
  referenceImageUrl: z.string().nullable().describe('An optional reference image as a data URI.'),
  useBrandProfile: z.boolean().describe('Whether to apply the brand profile.'),
  brandProfile: z.custom<BrandProfile>().nullable().describe('The brand profile object.'),
});
export type CreativeAssetInput = z.infer<typeof CreativeAssetInputSchema>;

// Define the output schema for the creative asset generation flow.
const CreativeAssetOutputSchema = z.object({
  imageUrl: z.string().nullable().describe('The data URI of the generated image, if applicable.'),
  videoUrl: z.string().nullable().describe('The data URI of the generated video, if applicable.'),
  aiExplanation: z.string().describe('A brief explanation from the AI about what it created.'),
});
export type CreativeAsset = z.infer<typeof CreativeAssetOutputSchema>;

/**
 * An exported wrapper function that calls the creative asset generation flow.
 * @param input - The input data for asset generation.
 * @returns A promise that resolves to the generated asset details.
 */
export async function generateCreativeAsset(input: CreativeAssetInput): Promise<CreativeAsset> {
  return generateCreativeAssetFlow(input);
}


/**
 * Helper function to download video and convert to data URI
 */
async function videoToDataURI(videoPart: MediaPart): Promise<string> {
    if (!videoPart.media || !videoPart.media.url) {
        throw new Error('Media URL not found in video part.');
    }

    const fetch = (await import('node-fetch')).default;
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
 * The core Genkit flow for generating a creative asset.
 */
const generateCreativeAssetFlow = ai.defineFlow(
  {
    name: 'generateCreativeAssetFlow',
    inputSchema: CreativeAssetInputSchema,
    outputSchema: CreativeAssetOutputSchema,
  },
  async (input) => {
    let textPrompt = `You are an expert creative director. Generate a compelling and high-quality ${input.outputType} for a social media advertisement based on the following instructions.\n\n`;
    textPrompt += `Primary Instruction: "${input.prompt}"\n\n`;

    const promptParts: (string | { media: { url: string } })[] = [];

    if (input.useBrandProfile && input.brandProfile) {
      const bp = input.brandProfile;
      textPrompt += `Apply the following brand identity:\n`;
      textPrompt += `- Business: A ${bp.businessType} in ${bp.location}.\n`;
      textPrompt += `- Visual Style: ${bp.visualStyle}\n`;
      textPrompt += `- Writing Tone / Vibe: ${bp.writingTone}\n`;
      textPrompt += `- Key Content Themes: ${bp.contentThemes}\n`;
      if (bp.primaryColor && bp.accentColor && bp.backgroundColor) {
        textPrompt += `- Color Palette: Use Primary HSL(${bp.primaryColor}), Accent HSL(${bp.accentColor}), and Background HSL(${bp.backgroundColor}) as the main colors.\n`;
      }
      if (bp.logoDataUrl) {
          textPrompt += `- Logo: Place the provided logo naturally within the scene. It could be on a product, a sign, or a subtle watermark.\n`;
          promptParts.push({ media: { url: bp.logoDataUrl } });
      }
    }

    if (input.referenceImageUrl) {
        textPrompt += `\nReference Image: Use the provided image as a strong influence for the composition, style, and subject matter.\n`;
        promptParts.push({ media: { url: input.referenceImageUrl } });
    }
    
    // Add the compiled text prompt to the beginning of the parts array.
    promptParts.unshift({text: textPrompt});

    const aiExplanationPrompt = ai.definePrompt({
      name: 'creativeAssetExplanationPrompt',
      prompt: `Based on the generated ${input.outputType}, write a very brief, one-sentence explanation of the creative choices made. For example: "I created a modern, vibrant image of a coffee shop, using your brand's primary color for the logo."`
    });
    
    const explanationResult = await aiExplanationPrompt();

    if (input.outputType === 'image') {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: promptParts,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        return {
            imageUrl: media?.url ?? null,
            videoUrl: null,
            aiExplanation: explanationResult.output ?? "Here is the generated image based on your prompt."
        };
    } else { // Video generation
        let operation;
        try {
            const result = await ai.generate({
                model: 'googleai/veo-3.0-generate-preview',
                prompt: promptParts,
            });
            operation = result.operation;
        } catch (e: any) {
            console.error("Error during ai.generate call:", e);
            throw new Error(e.message || "Video generation failed. The model may be overloaded. Please try again in a few moments.");
        }

        if (!operation) {
            throw new Error('Expected the model to return an operation');
        }

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.checkOperation(operation);
        }

        if (operation.error) {
            console.error("Video generation operation failed", operation.error);
            throw new Error(`Video generation failed. Please try again. Error: ${operation.error.message}`);
        }

        const videoPart = operation.output?.message?.content.find(p => !!p.media);
        if (!videoPart || !videoPart.media) {
            throw new Error('No video was generated in the operation result.');
        }

        const videoDataUrl = await videoToDataURI(videoPart);

        return {
            imageUrl: null,
            videoUrl: videoDataUrl,
            aiExplanation: explanationResult.output ?? "Here is the generated video based on your prompt."
        };
    }
  }
);
    