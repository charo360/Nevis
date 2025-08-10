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
 * Extracts text in quotes and the remaining prompt.
 */
const extractQuotedText = (prompt: string): { imageText: string | null; remainingPrompt: string } => {
    const quoteRegex = /"([^"]*)"/;
    const match = prompt.match(quoteRegex);
    if (match) {
        return {
            imageText: match[1],
            remainingPrompt: prompt.replace(quoteRegex, '').trim()
        };
    }
    return {
        imageText: null,
        remainingPrompt: prompt
    };
};

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
    const promptParts: (string | { text: string } | { media: { url: string } })[] = [];
    let textPrompt = '';
    
    const { imageText, remainingPrompt } = extractQuotedText(input.prompt);

    if (input.useBrandProfile && input.brandProfile) {
        const bp = input.brandProfile;
        const colorInstructions = (bp.primaryColor && bp.accentColor && bp.backgroundColor) 
            ? `The brand's color palette is: Primary HSL(${bp.primaryColor}), Accent HSL(${bp.accentColor}), Background HSL(${bp.backgroundColor}). Please use these colors in the design.`
            : '';
        
        let onBrandPrompt = `Generate a social media ${input.outputType} for a ${bp.businessType}.
The brand's visual style is ${bp.visualStyle}.
The brand's writing tone is '${bp.writingTone}' and content should align with these themes: '${bp.contentThemes}'.
${colorInstructions}
The subject of the ${input.outputType} should be: "${remainingPrompt}".
It should be a high-quality, visually appealing asset that reflects the brand's identity.`;

        if (imageText) {
             onBrandPrompt += `\nThen, overlay the following text onto the asset: "${imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated at the edges. The entire text must be visible.`;
        }

        onBrandPrompt += `\nFinally, place the provided logo naturally onto the generated asset. The logo should be clearly visible but not overpower the main subject.`;
        
        textPrompt = onBrandPrompt;

        if (bp.logoDataUrl) {
            promptParts.push({ media: { url: bp.logoDataUrl } });
        }

    } else {
        // Unstructured, creative prompt
        let creativePrompt = `You are an expert creative director. Generate a compelling and high-quality ${input.outputType} for a social media advertisement based on the following instruction: "${remainingPrompt}".`;
        if (imageText) {
             creativePrompt += `\nOverlay the following text onto the asset: "${imageText}". Ensure the text is readable and well-composed.`
        }
        textPrompt = creativePrompt + `\n\n`;
    }

    if (input.referenceImageUrl) {
        textPrompt += `\nUse the provided image as a strong influence for the composition, style, and subject matter.\n`;
        promptParts.push({ media: { url: input.referenceImageUrl } });
    }
    
    promptParts.unshift({text: textPrompt});

    const aiExplanationPrompt = ai.definePrompt({
      name: 'creativeAssetExplanationPrompt',
      prompt: `Based on the generated ${input.outputType}, write a very brief, one-sentence explanation of the creative choices made. For example: "I created a modern, vibrant image of a coffee shop, using your brand's primary color for the logo."`
    });
    
    const explanationResult = await aiExplanationPrompt();

    try {
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
            const result = await ai.generate({
                model: 'googleai/veo-3.0-generate-preview',
                prompt: promptParts,
            });
            let operation = result.operation;

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
    } catch (e: any) {
        if (e.message && e.message.includes('503')) {
            throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
        }
        console.error("Error during creative asset generation:", e);
        throw new Error(e.message || "Asset generation failed. Please check your inputs and try again.");
    }
  }
);
