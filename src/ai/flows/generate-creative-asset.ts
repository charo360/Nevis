
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
import { GenerateRequest } from 'genkit/generate';

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
                if (e.message && e.message.includes('429')) {
                    throw new Error("You've exceeded your request limit for the AI model. Please check your plan or try again later.");
                }
                throw e; // Rethrow other errors immediately
            }
        }
    }
    // This line should not be reachable if retries are configured, but as a fallback:
    throw new Error("The AI model is currently overloaded after multiple retries. Please try again later.");
}

const getMimeTypeFromDataURI = (dataURI: string): string => {
    const match = dataURI.match(/^data:(.*?);/);
    return match ? match[1] : 'application/octet-stream'; // Default if no match
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
    const promptParts: (string | { text: string } | { media: { url: string; contentType?: string } })[] = [];
    let textPrompt = '';
    
    const { imageText, remainingPrompt } = extractQuotedText(input.prompt);

    if (input.referenceImageUrl) {
        // This is a refinement prompt.
        let refinePrompt = `Use the provided image as a strong reference. Your instruction for how to change it is: "${remainingPrompt}".`;
        
        if (imageText) {
             refinePrompt += `\nIf there was text on the original image, replace it with the following text: "${imageText}". If there was no text, add this text: "${imageText}". Ensure the new text is readable and well-composed.`
        }

        if (input.useBrandProfile && input.brandProfile) {
            const bp = input.brandProfile;
            const colorInstructions = (bp.primaryColor && bp.accentColor && bp.backgroundColor) 
            ? ` The brand's color palette is: Primary HSL(${bp.primaryColor}), Accent HSL(${bp.accentColor}), Background HSL(${bp.backgroundColor}). You MUST use these colors in the new design.`
            : '';
            refinePrompt += colorInstructions;

            if (bp.logoDataUrl) {
                promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                refinePrompt += ` The user may also provide a logo. If they do, follow any instructions regarding the logo, such as placing or removing it.`
            }
        }

        textPrompt = refinePrompt;
        promptParts.push({ text: textPrompt });
        promptParts.push({ media: { url: input.referenceImageUrl, contentType: getMimeTypeFromDataURI(input.referenceImageUrl) } });

    } else if (input.useBrandProfile && input.brandProfile) {
        // This is a new, on-brand asset generation.
        const bp = input.brandProfile;
        const colorInstructions = (bp.primaryColor && bp.accentColor && bp.backgroundColor) 
            ? `The brand's color palette is: Primary HSL(${bp.primaryColor}), Accent HSL(${bp.accentColor}), Background HSL(${bp.backgroundColor}). Please use these colors in the design.`
            : '';
        
        const onBrandPrompt = `You are an expert graphic designer creating a social media ${input.outputType} for a ${bp.businessType}.

Your goal is to generate a single, cohesive, and visually stunning asset.

**Key Elements to Include:**
- **Visual Style:** The design must be ${bp.visualStyle}. The writing tone is ${bp.writingTone} and content should align with these themes: ${bp.contentThemes}.
- **Brand Colors:** ${colorInstructions}
- **Subject/Theme:** The core subject of the ${input.outputType} should be: "${remainingPrompt}".
- **Text Overlay:** ${imageText ? `The following text must be overlaid on the asset in a stylish, readable font: "${imageText}". It must be fully visible and well-composed.` : 'No text should be added to the asset.'}
- **Logo Placement:** The provided logo must be integrated naturally into the design (e.g., on a product, a sign, or as a subtle watermark).`;

        if (bp.logoDataUrl) {
            promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
        }
        
        textPrompt = onBrandPrompt;
        promptParts.unshift({text: textPrompt});

    } else {
        // This is a new, un-branded, creative prompt.
        let creativePrompt = `You are an expert creative director. Generate a compelling and high-quality ${input.outputType} for a social media advertisement based on the following instruction: "${remainingPrompt}".`;
        if (imageText) {
             creativePrompt += `\nOverlay the following text onto the asset: "${imageText}". Ensure the text is readable and well-composed.`
        }
        textPrompt = creativePrompt;
        promptParts.unshift({text: textPrompt});
    }
    
    const aiExplanationPrompt = ai.definePrompt({
      name: 'creativeAssetExplanationPrompt',
      prompt: `Based on the generated ${input.outputType}, write a very brief, one-sentence explanation of the creative choices made. For example: "I created a modern, vibrant image of a coffee shop, using your brand's primary color for the logo."`
    });
    
    const explanationResult = await aiExplanationPrompt();

    try {
        if (input.outputType === 'image') {
            const { media } = await generateWithRetry({
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
            const result = await generateWithRetry({
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
        console.error("Error during creative asset generation:", e);
        throw new Error(e.message || "Asset generation failed. Please check your inputs and try again.");
    }
  }
);
