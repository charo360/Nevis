
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
import {
    ADVANCED_DESIGN_PRINCIPLES,
    PLATFORM_SPECIFIC_GUIDELINES,
    BUSINESS_TYPE_DESIGN_DNA,
    QUALITY_ENHANCEMENT_INSTRUCTIONS
} from '@/ai/prompts/advanced-design-prompts';
import {
    analyzeDesignExample,
    selectOptimalDesignExamples,
    extractDesignDNA,
    type DesignAnalysis
} from '@/ai/utils/design-analysis';
import {
    assessDesignQuality,
    generateImprovementPrompt,
    meetsQualityStandards,
    type DesignQuality
} from '@/ai/utils/design-quality';

// Define the input schema for the creative asset generation flow.
const CreativeAssetInputSchema = z.object({
    prompt: z.string().describe('The main text prompt describing the desired asset.'),
    outputType: z.enum(['image', 'video']).describe('The type of asset to generate.'),
    referenceAssetUrl: z.string().nullable().describe('An optional reference image or video as a data URI.'),
    useBrandProfile: z.boolean().describe('Whether to apply the brand profile.'),
    brandProfile: z.custom<BrandProfile>().nullable().describe('The brand profile object.'),
    maskDataUrl: z.string().nullable().optional().describe('An optional mask image for inpainting as a data URI.'),
    aspectRatio: z.enum(['16:9', '9:16']).optional().describe('The aspect ratio for video generation.'),
    preferredModel: z.string().optional().describe('Preferred model for generation (e.g., gemini-2.5-flash-image-preview).'),
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
                referencePrompt += `\n\n**Video Specifics:** Generate a video that is cinematically interesting, well-composed, and has a sense of completeness. Create a well-composed shot with a clear beginning, middle, and end, even within a short duration. Avoid abrupt cuts or unfinished scenes.`;
                if (imageText) {
                    referencePrompt += `\n\n**Text Overlay:** The following text MUST be overlaid on the video in a stylish, readable font: "${imageText}". It is critical that the text is clearly readable, well-composed, and not cut off. The entire text must be visible.`;
                }
            }

            if (input.useBrandProfile && input.brandProfile) {
                const bp = input.brandProfile;
                let brandGuidelines = '\n\n**Brand Guidelines:**';

                if (bp.logoDataUrl && !bp.logoDataUrl.includes('image/svg+xml')) {
                    promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                    brandGuidelines += ` A logo has also been provided. Integrate it naturally into the new design.`
                } else if (bp.logoDataUrl && bp.logoDataUrl.includes('image/svg+xml')) {
                    brandGuidelines += ` Create a design that represents the brand identity (SVG logo format not supported by AI model).`
                }
                referencePrompt += brandGuidelines;
            }

            textPrompt = referencePrompt;
            if (textPrompt) {
                promptParts.push({ text: textPrompt });
            }
            promptParts.push({ media: { url: input.referenceAssetUrl, contentType: getMimeTypeFromDataURI(input.referenceAssetUrl) } });

        } else if (input.useBrandProfile && input.brandProfile) {
            // This is a new, on-brand asset generation with advanced design principles.
            const bp = input.brandProfile;

            // Get business-specific design DNA
            const businessDNA = BUSINESS_TYPE_DESIGN_DNA[bp.businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;

            // Enhanced target market representation for all locations
            const getTargetMarketInstructions = (location: string, businessType: string, targetAudience: string) => {
                const locationKey = location.toLowerCase();
                const africanCountries = ['kenya', 'nigeria', 'south africa', 'ghana', 'uganda', 'tanzania', 'ethiopia', 'rwanda', 'zambia', 'zimbabwe', 'botswana', 'namibia', 'malawi', 'mozambique', 'senegal', 'mali', 'burkina faso', 'ivory coast', 'cameroon', 'chad', 'sudan', 'egypt', 'morocco', 'algeria', 'tunisia', 'libya'];
                
                // Get business-specific target market
                const getBusinessTargetMarket = (businessType: string) => {
                    const businessTypeLower = businessType.toLowerCase();
                    
                    if (businessTypeLower.includes('restaurant') || businessTypeLower.includes('food') || businessTypeLower.includes('cafe')) {
                        return 'diverse families, couples, food enthusiasts, local community members';
                    } else if (businessTypeLower.includes('fitness') || businessTypeLower.includes('gym') || businessTypeLower.includes('health')) {
                        return 'fitness enthusiasts, health-conscious individuals, athletes, people working out';
                    } else if (businessTypeLower.includes('beauty') || businessTypeLower.includes('salon') || businessTypeLower.includes('spa')) {
                        return 'beauty-conscious individuals, people getting beauty treatments, fashion-forward people';
                    } else if (businessTypeLower.includes('retail') || businessTypeLower.includes('shop') || businessTypeLower.includes('store')) {
                        return 'shoppers, customers browsing products, families shopping, fashion enthusiasts';
                    } else if (businessTypeLower.includes('finance') || businessTypeLower.includes('bank') || businessTypeLower.includes('payment')) {
                        return 'business professionals, entrepreneurs, people using financial services, tech-savvy individuals';
                    } else if (businessTypeLower.includes('tech') || businessTypeLower.includes('software') || businessTypeLower.includes('digital')) {
                        return 'tech professionals, entrepreneurs, digital natives, people using technology';
                    } else if (businessTypeLower.includes('education') || businessTypeLower.includes('school') || businessTypeLower.includes('training')) {
                        return 'students, teachers, parents, people learning, educational professionals';
                    } else if (businessTypeLower.includes('real estate') || businessTypeLower.includes('property') || businessTypeLower.includes('housing')) {
                        return 'homebuyers, families, property investors, people looking for homes';
                    } else if (businessTypeLower.includes('automotive') || businessTypeLower.includes('car') || businessTypeLower.includes('vehicle')) {
                        return 'car owners, drivers, automotive enthusiasts, people with vehicles';
                    } else if (businessTypeLower.includes('healthcare') || businessTypeLower.includes('medical') || businessTypeLower.includes('clinic')) {
                        return 'patients, healthcare workers, families, people seeking medical care';
                    } else {
                        return 'local community members, customers, people using the service';
                    }
                };

                const targetMarket = getBusinessTargetMarket(businessType);
                
                // Check if it's an African country
                const isAfricanCountry = africanCountries.some(country => locationKey.includes(country));
                
                if (isAfricanCountry) {
                    return `
**CRITICAL TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- MANDATORY: Include authentic Black/African people who represent the target market
- Show people who would actually use ${businessType} services: ${targetMarket}
- Display local African people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct with no deformations
- Emphasize cultural authenticity and local representation
- AVOID: Generic office workers - show people who match the target audience
- PRIORITY: 80%+ of people in the image should be Black/African when business is in African country
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
                } else {
                    return `
**TARGET MARKET REPRESENTATION FOR ${location.toUpperCase()}:**
- Include people who represent the target market: ${targetMarket}
- Show people who would actually use ${businessType} services
- Display people in settings relevant to ${businessType} business
- Ensure faces are fully visible, well-lit, and anatomically correct
- Context: Show people in ${businessType}-relevant settings, not generic offices
- Target Audience: ${targetAudience || targetMarket}`;
                }
            };

            const targetMarketInstructions = getTargetMarketInstructions(bp.location || '', bp.businessType, bp.targetAudience || '');

            // Clean business name pattern from content
            const cleanBusinessNamePattern = (text: string): string => {
                let cleaned = text
                    .replace(/^[A-Z\s]+:\s*/i, '') // Remove "BUSINESS NAME: "
                    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+:\s*/i, '') // Remove "Business Name: "
                    .replace(/^[A-Z]+:\s*/i, '') // Remove "PAYA: "
                    .replace(/^[A-Z][a-z]+:\s*/i, '') // Remove "Paya: "
                    .trim();
                
                if (cleaned.length < 3) {
                    return text;
                }
                
                return cleaned;
            };

            const cleanedContent = cleanBusinessNamePattern(remainingPrompt);

            let onBrandPrompt = `Create a stunning, professional social media ${input.outputType} for ${bp.businessName || 'this business'}.

BUSINESS: ${bp.businessName || 'Professional Business'} (${bp.businessType})
CONTENT: "${cleanedContent}"
STYLE: ${bp.visualStyle}, modern, clean, professional

FORMAT: ${input.aspectRatio ? `${input.aspectRatio} aspect ratio` : 'Square 1:1 format'}

BRAND COLORS (use prominently):
${bp.primaryColor ? `- Primary: ${bp.primaryColor}` : ''}
${bp.accentColor ? `- Accent: ${bp.accentColor}` : ''}
${bp.backgroundColor ? `- Background: ${bp.backgroundColor}` : ''}

${targetMarketInstructions}

REQUIREMENTS:
- High-quality, professional design
- ${bp.visualStyle} aesthetic
- Clean, modern layout
- Perfect for ${bp.businessType} business
- Brand colors prominently featured
- Professional social media appearance`;

            // Intelligent design examples processing
            let designDNA = '';
            let selectedExamples: string[] = [];

            if (bp.designExamples && bp.designExamples.length > 0) {
                try {
                    // Analyze design examples for intelligent processing
                    const analyses: DesignAnalysis[] = [];
                    for (const example of bp.designExamples.slice(0, 3)) { // Limit for performance
                        try {
                            const analysis = await analyzeDesignExample(
                                example,
                                bp.businessType,
                                'creative-studio',
                                `${bp.visualStyle} ${input.outputType} for ${remainingPrompt}`
                            );
                            analyses.push(analysis);
                        } catch (error) {
                        }
                    }

                    if (analyses.length > 0) {
                        // Extract design DNA from analyzed examples
                        designDNA = extractDesignDNA(analyses);

                        // Select optimal examples based on analysis
                        selectedExamples = selectOptimalDesignExamples(
                            bp.designExamples,
                            analyses,
                            remainingPrompt,
                            'creative-studio',
                            2
                        );
                    } else {
                        selectedExamples = bp.designExamples.slice(0, 2);
                    }
                } catch (error) {
                    selectedExamples = bp.designExamples.slice(0, 2);
                }

                onBrandPrompt += `\n**STYLE REFERENCE:**
Use the provided design examples as style reference to create a similar visual aesthetic, color scheme, typography, and overall design approach. Match the style, mood, and visual characteristics of the reference designs while creating new content.

${designDNA}`;
            }

            if (input.outputType === 'image') {
                onBrandPrompt += `\n- **Text Overlay Requirements:** ${imageText ? `
                  * Display this EXACT text: "${imageText}"
                  * Use ENGLISH ONLY - no foreign languages, symbols, or corrupted characters
                  * Make text LARGE and BOLD for mobile readability
                  * Apply high contrast (minimum 4.5:1 ratio) between text and background
                  * Add text shadows, outlines, or semi-transparent backgrounds for readability
                  * Position text using rule of thirds for optimal composition
                  * Ensure text is the primary focal point of the design` : 'No text should be added to the asset.'}`;
                onBrandPrompt += `\n- **Logo Placement:** The provided logo must be integrated naturally into the design (e.g., on a product, a sign, or as a subtle watermark).`;
                onBrandPrompt += `\n- **Critical Language Rule:** ALL text must be in clear, readable ENGLISH only. Never use foreign languages, corrupted text, or unreadable symbols.`;

                if (bp.logoDataUrl && !bp.logoDataUrl.includes('image/svg+xml')) {
                    promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                }
                textPrompt = onBrandPrompt;
                if (textPrompt) {
                    promptParts.unshift({ text: textPrompt });
                }
            } else { // Video
                onBrandPrompt += `\n- **Video Specifics:** Generate a video that is cinematically interesting, well-composed, and has a sense of completeness. Create a well-composed shot with a clear beginning, middle, and end, even within a short duration. Avoid abrupt cuts or unfinished scenes.`;
                if (input.aspectRatio === '16:9') {
                    onBrandPrompt += ' The video should have relevant sound.';
                }
                if (imageText) {
                    onBrandPrompt += `\n- **Text Overlay:** The following text MUST be overlaid on the video in a stylish, readable font: "${imageText}". It is critical that the text is clearly readable, well-composed, and not cut off. The entire text must be visible.`
                }
                if (bp.logoDataUrl && !bp.logoDataUrl.includes('image/svg+xml')) {
                    onBrandPrompt += `\n- **Logo Placement:** The provided logo must be integrated naturally into the design.`;
                    promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                } else if (bp.logoDataUrl && bp.logoDataUrl.includes('image/svg+xml')) {
                    onBrandPrompt += `\n- **Brand Identity:** Create a design that represents the brand identity and style.`;
                }

                // Add selected design examples as reference
                selectedExamples.forEach(designExample => {
                    promptParts.push({ media: { url: designExample, contentType: getMimeTypeFromDataURI(designExample) } });
                });

                textPrompt = onBrandPrompt;
                if (textPrompt) {
                    promptParts.unshift({ text: textPrompt });
                }
            }
        } else {
            // This is a new, un-branded, creative prompt.
            let creativePrompt = `You are an expert creative director specializing in high-end advertisements. Generate a compelling, high-quality social media advertisement ${input.outputType} based on the following instruction: "${remainingPrompt}".

⚡ GEMINI 2.0 FLASH HD QUALITY ENHANCEMENTS:
- MAXIMUM RESOLUTION: Ultra-high definition rendering (4K+ quality)
- SMALL FONT SIZE EXCELLENCE: Perfect rendering at 8pt, 10pt, 12pt, and all small font sizes
- TINY TEXT PRECISION: Every character sharp and legible even when font size is very small
- HIGH-DPI SMALL TEXT: Render small fonts as if on 300+ DPI display for maximum sharpness
- PERFECT ANATOMY: Complete, symmetrical faces with natural expressions
- SHARP DETAILS: Crystal-clear textures, no blur or artifacts
- PROFESSIONAL LIGHTING: Studio-quality lighting with proper shadows
- PREMIUM COMPOSITION: Golden ratio layouts with perfect balance
- ADVANCED COLOR THEORY: Perfect contrast ratios (7:1 minimum) with vibrant, accurate colors`;

            if (input.outputType === 'image' && imageText) {
                creativePrompt += `

🚨🚨🚨 EMERGENCY OVERRIDE - CRITICAL TEXT CONTROL 🚨🚨🚨

⛔ ABSOLUTE PROHIBITION - NO EXCEPTIONS:
- NEVER add "Flex Your Finances" or any financial terms
- NEVER add "Payroll Banking Simplified" or banking phrases
- NEVER add "Banking Made Easy" or similar taglines
- NEVER add company descriptions or service explanations
- NEVER add marketing copy or promotional text
- NEVER add placeholder text or sample content
- NEVER create fake headlines or taglines
- NEVER add descriptive text about the business
- NEVER add ANY text except what is specified below

🎯 ONLY THIS TEXT IS ALLOWED: "${imageText}"
🎯 REPEAT: ONLY THIS TEXT: "${imageText}"
🎯 NO OTHER TEXT PERMITTED: "${imageText}"

🌍 ENGLISH ONLY REQUIREMENT:
- ALL text must be in clear, readable English
- NO foreign languages (Arabic, Chinese, Hindi, etc.)
- NO special characters, symbols, or corrupted text
- NO accents or diacritical marks

Overlay ONLY the following text onto the asset: "${imageText}".
DO NOT ADD ANY OTHER TEXT.
Ensure the text is readable and well-composed.`
                textPrompt = creativePrompt;
                if (textPrompt) {
                    promptParts.unshift({ text: textPrompt });
                }
            } else { // Video
                creativePrompt += `\n\n**Video Specifics:** Generate a video that is cinematically interesting, well-composed, and has a sense of completeness. Create a well-composed shot with a clear beginning, middle, and end, even within a short duration. Avoid abrupt cuts or unfinished scenes.`;
                if (input.aspectRatio === '16:9') {
                    creativePrompt += ' The video should have relevant sound.';
                }
                if (imageText) {
                    creativePrompt += `\n\n**Text Overlay:** The following text MUST be overlaid on the video in a stylish, readable font: "${imageText}". It is critical that the text is clearly readable, well-composed, and not cut off. The entire text must be visible.`;
                }
                textPrompt = creativePrompt;
                if (textPrompt) {
                    promptParts.unshift({ text: textPrompt });
                }
            }
        }

        const aiExplanationPrompt = ai.definePrompt({
            name: 'creativeAssetExplanationPrompt',
            prompt: `Based on the generated ${input.outputType}, write a very brief, one-sentence explanation of the creative choices made. For example: "I created a modern, vibrant image of a coffee shop, using your brand's primary color for the logo."`
        });

        const explanationResult = await aiExplanationPrompt();

        try {
            if (input.outputType === 'image') {
                // Generate image with quality validation
                let finalImageUrl: string | null = null;
                let attempts = 0;
                const maxAttempts = 2;

                while (attempts < maxAttempts && !finalImageUrl) {
                    attempts++;

                    // Determine which model to use based on preferred model parameter
                    let modelToUse = 'googleai/gemini-2.0-flash-preview-image-generation'; // Default

                    if (input.preferredModel) {
                        // Map Gemini model names to Genkit model identifiers
                        const modelMapping: Record<string, string> = {
                            'gemini-2.5-flash-image-preview': 'googleai/gemini-2.5-flash-image-preview',
                            'gemini-2.0-flash-preview-image-generation': 'googleai/gemini-2.0-flash-preview-image-generation',
                            'gemini-2.5-flash': 'googleai/gemini-2.5-flash'
                        };

                        modelToUse = modelMapping[input.preferredModel] || modelToUse;
                    }

                    const { media } = await generateWithRetry({
                        model: modelToUse,
                        prompt: promptParts,
                        config: {
                            responseModalities: ['TEXT', 'IMAGE'],
                        },
                    });

                    let imageUrl = media?.url ?? null;
                    if (!imageUrl) {
                        if (attempts === maxAttempts) {
                            throw new Error('Failed to generate image');
                        }
                        continue;
                    }

                    // Apply aspect ratio correction if needed
                    if (input.aspectRatio && input.aspectRatio !== '1:1') {
                        try {
                            const { cropImageFromUrl } = await import('@/lib/image-processing');
                            // Map aspect ratio to platform for cropping
                            const platformForCropping = input.aspectRatio === '16:9' ? 'linkedin' :
                                input.aspectRatio === '9:16' ? 'story' : 'instagram';
                            imageUrl = await cropImageFromUrl(imageUrl, platformForCropping);
                        } catch (cropError) {
                            // Continue with original image if cropping fails
                        }
                    }

                    // Quality validation for brand profile designs
                    if (input.useBrandProfile && input.brandProfile && attempts === 1) {
                        try {
                            const quality = await assessDesignQuality(
                                imageUrl,
                                input.brandProfile.businessType,
                                'creative-studio',
                                input.brandProfile.visualStyle,
                                undefined,
                                `Creative asset: ${remainingPrompt}`
                            );

                            // If quality is acceptable, use this design
                            if (meetsQualityStandards(quality, 6)) { // Slightly lower threshold for creative assets
                                finalImageUrl = imageUrl;
                                break;
                            }

                            // If quality is poor and we have attempts left, try to improve
                            if (attempts < maxAttempts) {

                                // Add improvement instructions to prompt
                                const improvementInstructions = generateImprovementPrompt(quality);
                                const improvedPrompt = `${promptParts[0].text}\n\n${improvementInstructions}`;
                                promptParts[0] = { text: improvedPrompt };
                                continue;
                            } else {
                                finalImageUrl = imageUrl;
                                break;
                            }
                        } catch (qualityError) {
                            finalImageUrl = imageUrl;
                            break;
                        }
                    } else {
                        finalImageUrl = imageUrl;
                        break;
                    }
                }

                return {
                    imageUrl: finalImageUrl,
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
            // Ensure a user-friendly error is thrown
            const message = e.message || "An unknown error occurred during asset generation.";
            throw new Error(message);
        }
    }
);


