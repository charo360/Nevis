
// src/ai/flows/generate-creative-asset.ts
'use server';

/**
 * @fileOverview A Genkit flow for generating a creative asset (image or video)
 * based on a user's prompt, an optional reference image, and brand profile settings.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { BrandProfile } from '@/lib/types';
import { MediaPart } from 'genkit';
import { GenerateRequest } from 'genkit/generate';

// Define the input schema for the creative asset generation flow.
const CreativeAssetInputSchema = z.object({
  prompt: z.string().describe('The main text prompt describing the desired asset.'),
  outputType: z.enum(['image', 'video']).describe('The type of asset to generate.'),
  referenceAssetUrl: z.string().nullable().describe('An optional reference image or video as a data URI.'),
  useBrandProfile: z.boolean().describe('Whether to apply the brand profile.'),
  brandProfile: z.custom<BrandProfile>().nullable().describe('The brand profile object.'),
  maskDataUrl: z.string().nullable().optional().describe('An optional mask image for inpainting as a data URI.'),
  aspectRatio: z.enum(['16:9', '9:16']).optional().describe('The aspect ratio for video generation.'),
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

    if (input.maskDataUrl && input.referenceAssetUrl) {
      // This is an inpainting request.
      textPrompt = `You are an expert image editor performing a precise inpainting task.
You will be given an original image, a mask, and a text prompt.
Your task is to modify the original image *only* in the areas designated by the black region of the mask.
The rest of the image must remain absolutely unchanged.
If the prompt is a "remove" or "delete" instruction, perform a seamless, content-aware fill to replace the masked object with a photorealistic background that matches the surrounding area.
The user's instruction for the masked area is: "${remainingPrompt}".
Recreate the content within the black-masked region based on this instruction, ensuring a seamless and photorealistic blend with the surrounding, untouched areas of the image.`;
      
      promptParts.push({ text: textPrompt });
      promptParts.push({ media: { url: input.referenceAssetUrl, contentType: getMimeTypeFromDataURI(input.referenceAssetUrl) } });
      promptParts.push({ media: { url: input.maskDataUrl, contentType: getMimeTypeFromDataURI(input.maskDataUrl) } });

    } else if (input.referenceAssetUrl) {
        // This is a generation prompt with a reference asset (image or video).
        let referencePrompt = `You are an expert creative director specializing in high-end advertisements. You will be given a reference asset and a text prompt with instructions.
Your task is to generate a new asset that is inspired by the reference asset and follows the new instructions.

Your primary goal is to intelligently interpret the user's request, considering the provided reference asset. Do not just copy the reference.
Analyze the user's prompt for common editing terminology and apply it creatively. For example:
- If asked to "change the background," intelligently isolate the main subject and replace the background with a new one that matches the prompt, preserving the foreground subject.
- If asked to "make the logo bigger" or "change the text color," perform those specific edits while maintaining the overall composition.
- If the prompt is more general, use the reference asset for style, color, and subject inspiration to create a new, distinct asset.

The user's instruction is: "${remainingPrompt}"`;

        if (imageText) {
             referencePrompt += `\n\n**Explicit Text Overlay:** The user has provided specific text in quotes: "${imageText}". You MUST overlay this text on the image. If there was existing text, replace it. Ensure the new text is readable and well-composed.`
        }
        
        if (input.outputType === 'video') {
             referencePrompt += `\n\n**Video Specifics:** Generate a video that is cinematically interesting, well-composed, and has a sense of completeness. Create a well-composed shot with a clear beginning, middle, and end, even within a short duration. Avoid abrupt cuts or unfinished scenes.`
             if(input.aspectRatio === "16:9") {
                 referencePrompt += ' The video should include sound.'
             }
        }

        if (input.useBrandProfile && input.brandProfile) {
            const bp = input.brandProfile;
            let brandGuidelines = '\n\n**Brand Guidelines:**';

            if (bp.logoDataUrl) {
                promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                brandGuidelines += ` A logo has also been provided. Integrate it naturally into the new design.`
            }
            referencePrompt += brandGuidelines;
        }

        textPrompt = referencePrompt;
        promptParts.push({ text: textPrompt });
        promptParts.push({ media: { url: input.referenceAssetUrl, contentType: getMimeTypeFromDataURI(input.referenceAssetUrl) } });

    } else if (input.useBrandProfile && input.brandProfile) {
        // This is a new, on-brand asset generation.
        const bp = input.brandProfile;
        const colorInstructions = (input.outputType === 'image' && bp.primaryColor && bp.accentColor && bp.backgroundColor) 
            ? `The brand's color palette is: Primary HSL(${bp.primaryColor}), Accent HSL(${bp.accentColor}), Background HSL(${bp.backgroundColor}). Please use these colors in the design.`
            : 'The brand has not specified colors, so use a visually appealing and appropriate palette based on the visual style.';
        
        let onBrandPrompt = `You are an expert creative director creating a social media advertisement ${input.outputType} for a ${bp.businessType}. Your goal is to generate a single, cohesive, and visually stunning asset for a professional marketing campaign.

**Key Elements to Include:**
- **Visual Style:** The design must be ${bp.visualStyle}. The writing tone is ${bp.writingTone} and content should align with these themes: ${bp.contentThemes}.
- **Brand Colors:** ${colorInstructions}
- **Subject/Theme:** The core subject of the ${input.outputType} should be: "${remainingPrompt}".
- **Text Overlay:** ${imageText ? `The following text must be overlaid on the asset in a stylish, readable font: "${imageText}". It must be fully visible and well-composed.` : 'No text should be added to the asset.'}
- **Logo Placement:** The provided logo must be integrated naturally into the design (e.g., on a product, a sign, or as a subtle watermark).`;
        
        if (input.outputType === 'video') {
             onBrandPrompt += `\n\n**Video Specifics:** Generate a video that is cinematically interesting, well-composed, and has a sense of completeness. Create a well-composed shot with a clear beginning, middle, and end, even within a short duration. Avoid abrupt cuts or unfinished scenes.`
             if(input.aspectRatio === "16:9") {
                 onBrandPrompt += ' The video should include sound.'
             }
        }

        if (bp.logoDataUrl) {
            promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
        }
        
        textPrompt = onBrandPrompt;
        promptParts.unshift({text: textPrompt});

    } else {
        // This is a new, un-branded, creative prompt.
        let creativePrompt = `You are an expert creative director specializing in high-end advertisements. Generate a compelling, high-quality social media advertisement ${input.outputType} based on the following instruction: "${remainingPrompt}".`;
        if (imageText) {
             creativePrompt += `\nOverlay the following text onto the asset: "${imageText}". Ensure the text is readable and well-composed.`
        }
        if (input.outputType === 'video') {
            creativePrompt += `\n\nFor this video, create a cinematically interesting shot that is well-composed and suitable for a professional marketing campaign. It should have a sense of completeness and avoid abrupt cuts or unfinished scenes.`
            if(input.aspectRatio === "16:9") {
                 creativePrompt += ' The video should include sound.'
             }
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
            const isVertical = input.aspectRatio === '9:16';
            
            const model = isVertical ? 'googleai/veo-2.0-generate-001' : 'googleai/veo-3.0-generate-preview';
            const config: Record<string, any> = {};
            if (isVertical) {
                config.aspectRatio = '9:16';
                config.durationSeconds = 8;
            }

            const result = await generateWithRetry({
                model,
                prompt: promptParts,
                config,
            });
            
            let operation = result.operation;

            if (!operation) {
                throw new Error('The video generation process did not start correctly. Please try again.');
            }

            // Poll for completion
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5s
                operation = await ai.checkOperation(operation);
            }
            
            if (operation.error) {
                console.error("Video generation operation failed", operation.error);
                throw new Error(`Video generation failed: ${operation.error.message}. Please try again.`);
            }

            const videoPart = operation.output?.message?.content.find(p => !!p.media);
            if (!videoPart || !videoPart.media) {
                throw new Error('Video generation completed, but the final video file could not be found.');
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
        // Ensure a user-friendly error is thrown
        const message = e.message || "An unknown error occurred during asset generation.";
        throw new Error(message);
    }
  }
);
