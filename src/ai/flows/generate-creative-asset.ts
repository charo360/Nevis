
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
    designColors: z.object({
        primaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
    }).optional().describe('Design-specific colors that override brand colors for this generation.'),
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
 * Enhanced instruction processing with intelligent parsing
 */
interface ParsedInstructions {
    quotedText: string[];
    headline: string | null;
    subheadline: string | null;
    cta: string | null;
    designBrief: string | null;
    remainingPrompt: string;
}

const parseInstructions = (prompt: string): ParsedInstructions => {
    let workingPrompt = prompt;
    const result: ParsedInstructions = {
        quotedText: [],
        headline: null,
        subheadline: null,
        cta: null,
        designBrief: null,
        remainingPrompt: prompt
    };

    // Extract all quoted text (highest priority)
    const quotedTextRegex = /"([^"]*)"/g;
    let match;
    while ((match = quotedTextRegex.exec(prompt)) !== null) {
        result.quotedText.push(match[1]);
        workingPrompt = workingPrompt.replace(match[0], '').trim();
    }

    // Extract structured content instructions
    const headlineMatch = workingPrompt.match(/\b(?:headline|title|heading):\s*([^\n.!?]+)/i);
    if (headlineMatch) {
        result.headline = headlineMatch[1].trim();
        workingPrompt = workingPrompt.replace(headlineMatch[0], '').trim();
    }

    const subheadlineMatch = workingPrompt.match(/\b(?:subheadline|subtitle|tagline|description):\s*([^\n.!?]+)/i);
    if (subheadlineMatch) {
        result.subheadline = subheadlineMatch[1].trim();
        workingPrompt = workingPrompt.replace(subheadlineMatch[0], '').trim();
    }

    const ctaMatch = workingPrompt.match(/\b(?:cta|call.to.action|button|action):\s*([^\n.!?]+)/i);
    if (ctaMatch) {
        result.cta = ctaMatch[1].trim();
        workingPrompt = workingPrompt.replace(ctaMatch[0], '').trim();
    }

    const designBriefMatch = workingPrompt.match(/\b(?:design.brief|brief|style|aesthetic|look):\s*([^\n]+)/i);
    if (designBriefMatch) {
        result.designBrief = designBriefMatch[1].trim();
        workingPrompt = workingPrompt.replace(designBriefMatch[0], '').trim();
    }

    result.remainingPrompt = workingPrompt.trim();
    return result;
};

// Intelligent analysis to distinguish between literal text instructions vs design direction
const analyzeUserIntent = (prompt: string, parsedInstructions: ParsedInstructions): {
    isLiteralTextRequest: boolean;
    isDesignDirectionRequest: boolean;
    textInstructions: string[];
    designDirection: string;
} => {
    const lowerPrompt = prompt.toLowerCase();

    // Patterns that indicate literal text instructions
    const literalTextPatterns = [
        /add\s+(?:the\s+)?text/i,
        /include\s+(?:the\s+)?(?:words?|text)/i,
        /write\s+(?:the\s+)?(?:words?|text)/i,
        /put\s+(?:the\s+)?(?:words?|text)/i,
        /use\s+(?:the\s+)?(?:words?|text)/i,
        /display\s+(?:the\s+)?(?:words?|text)/i,
        /show\s+(?:the\s+)?(?:words?|text)/i,
        /with\s+(?:the\s+)?(?:words?|text)/i,
        /saying/i,
        /that\s+says/i,
        /headline:\s*/i,
        /subheadline:\s*/i,
        /cta:\s*/i
    ];

    // Patterns that indicate design direction requests
    const designDirectionPatterns = [
        /create\s+(?:a\s+)?(?:promotional|marketing|advertising)/i,
        /make\s+(?:a\s+)?(?:promotional|marketing|advertising)/i,
        /design\s+(?:a\s+)?(?:promotional|marketing|advertising)/i,
        /generate\s+(?:a\s+)?(?:promotional|marketing|advertising)/i,
        /create\s+(?:a\s+)?design/i,
        /make\s+(?:a\s+)?design/i,
        /generate\s+(?:a\s+)?design/i,
        /design\s+(?:something|anything)/i,
        /for\s+today'?s?\s+(?:special|event|promotion)/i,
        /for\s+today/i,
        /promotional\s+design/i,
        /marketing\s+design/i,
        /advertising\s+design/i,
        /social\s+media\s+post/i,
        /business\s+promotion/i
    ];

    const hasLiteralTextPatterns = literalTextPatterns.some(pattern => pattern.test(prompt));
    const hasDesignDirectionPatterns = designDirectionPatterns.some(pattern => pattern.test(prompt));
    const hasQuotedText = parsedInstructions.quotedText.length > 0;
    const hasStructuredInstructions = !!(parsedInstructions.headline || parsedInstructions.subheadline || parsedInstructions.cta);

    // Debug pattern matching
    console.log('🔍 [Intent Analysis] Pattern Matching:', {
        prompt,
        hasLiteralTextPatterns,
        hasDesignDirectionPatterns,
        hasQuotedText,
        hasStructuredInstructions,
        matchingDesignPatterns: designDirectionPatterns.filter(pattern => pattern.test(prompt)).map(p => p.toString())
    });

    // Determine intent
    const isLiteralTextRequest = hasLiteralTextPatterns || hasQuotedText || hasStructuredInstructions;
    const isDesignDirectionRequest = hasDesignDirectionPatterns && !isLiteralTextRequest;

    // Collect all text instructions
    const textInstructions: string[] = [];
    if (hasQuotedText) {
        textInstructions.push(...parsedInstructions.quotedText);
    }
    if (parsedInstructions.headline) {
        textInstructions.push(`HEADLINE: ${parsedInstructions.headline}`);
    }
    if (parsedInstructions.subheadline) {
        textInstructions.push(`SUBHEADLINE: ${parsedInstructions.subheadline}`);
    }
    if (parsedInstructions.cta) {
        textInstructions.push(`CTA: ${parsedInstructions.cta}`);
    }

    return {
        isLiteralTextRequest,
        isDesignDirectionRequest,
        textInstructions,
        designDirection: parsedInstructions.remainingPrompt
    };
};

/**
 * Legacy function for backward compatibility
 */
const extractQuotedText = (prompt: string): { imageText: string | null; remainingPrompt: string } => {
    const parsed = parseInstructions(prompt);
    return {
        imageText: parsed.quotedText.length > 0 ? parsed.quotedText.join(' ') : null,
        remainingPrompt: parsed.remainingPrompt
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
    if (match) {
        return match[1];
    }

    // If no MIME type found, try to detect from data URI content
    if (dataURI.startsWith('data:')) {
        // Check if it looks like a PNG (starts with iVBORw0KGgo)
        if (dataURI.includes('iVBORw0KGgo')) {
            return 'image/png';
        }
        // Check if it looks like a JPEG (starts with /9j/)
        if (dataURI.includes('/9j/')) {
            return 'image/jpeg';
        }
        // Check if it looks like a WebP (starts with UklGR)
        if (dataURI.includes('UklGR')) {
            return 'image/webp';
        }
        // Check if it looks like a GIF (starts with R0lGOD)
        if (dataURI.includes('R0lGOD')) {
            return 'image/gif';
        }
        // Check if it looks like an SVG (starts with PHN2Zy)
        if (dataURI.includes('PHN2Zy')) {
            return 'image/svg+xml';
        }
    }

    // Default to PNG for image data URIs (most common and widely supported)
    return 'image/png';
};


/**
 * The core Genkit flow for generating a creative asset.
 */
// Simple SVG fallback generator to guarantee an image if models fail
function createBrandFallbackSVG({ size = 1080, primary = '#3B82F6', accent = '#10B981', background = '#F8FAFC', title = 'Creative Asset', subtitle = '' }: { size?: number; primary?: string; accent?: string; background?: string; title?: string; subtitle?: string; }) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${background}"/>
      <stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 3}" fill="${accent}" fill-opacity="0.15" />
  <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size / 14)}" fill="#0f172a" font-weight="700">${escapeXml(title)}</text>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size / 28)}" fill="#1f2937" opacity="0.9">${escapeXml(subtitle)}</text>
</svg>`;
}

function escapeXml(s: string) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const generateCreativeAssetFlow = ai.defineFlow(
    {
        name: 'generateCreativeAssetFlow',
        inputSchema: CreativeAssetInputSchema,
        outputSchema: CreativeAssetOutputSchema,
    },
    async (input) => {
        const promptParts: (string | { text: string } | { media: { url: string; contentType?: string } })[] = [];
        let textPrompt = '';

        // Enhanced instruction parsing with intelligent intent analysis
        const parsedInstructions = parseInstructions(input.prompt);
        const userIntent = analyzeUserIntent(input.prompt, parsedInstructions);
        const { imageText, remainingPrompt } = extractQuotedText(input.prompt); // Keep for backward compatibility

        // Debug logging for user intent analysis
        console.log('🔍 [Creative Studio] User Intent Analysis:', {
            prompt: input.prompt,
            preferredModel: input.preferredModel,
            isLiteralTextRequest: userIntent.isLiteralTextRequest,
            isDesignDirectionRequest: userIntent.isDesignDirectionRequest,
            textInstructions: userIntent.textInstructions,
            designDirection: userIntent.designDirection,
            quotedText: parsedInstructions.quotedText,
            remainingPrompt: parsedInstructions.remainingPrompt
        });

        // Additional debug for pattern matching
        console.log('🔍 [Pattern Debug] Analyzing prompt patterns for:', input.prompt);

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
            // This is a generation prompt with an uploaded image that should be integrated into the design
            let referencePrompt = `You are an expert creative director and AI design specialist with advanced image analysis capabilities. You will be given an uploaded image and a text prompt with instructions.

🚫 **CRITICAL: DO NOT CREATE LOGOS** 🚫
- DO NOT generate logo designs, brand marks, or simple graphic symbols
- DO NOT create minimalist logo-style graphics
- DO NOT focus primarily on logo creation or branding elements

🚫 **CRITICAL: DO NOT GENERATE ADDITIONAL IMAGES** 🚫
- DO NOT create any new images, graphics, or visual elements
- DO NOT generate backgrounds, objects, people, or scenes
- DO NOT add illustrations, icons, or decorative elements
- DO NOT create competing visual content
- USE ONLY the uploaded image as the primary visual element

✅ **UPLOADED IMAGE FOCUSED DESIGN** ✅
- Use ONLY the uploaded image as the main visual element
- Enhance the uploaded image with text overlays and design treatments
- Apply professional styling, effects, and composition to the uploaded image
- Create layouts that showcase the uploaded image prominently
- Add text, color treatments, and design elements around the uploaded image

🎯 **UPLOADED IMAGE INTEGRATION MISSION:**
Transform the uploaded image into a professional marketing design by enhancing it with text, styling, and layout - WITHOUT generating any additional images.

**STEP 1: UPLOADED IMAGE ANALYSIS**
Analyze the uploaded image to understand:
- Content type (product, person, landscape, object, logo, artwork, etc.)
- Image quality, lighting conditions, and photographic style
- Dominant colors, textures, and visual elements
- Emotional tone and aesthetic appeal
- How to enhance it with text and design treatments

**STEP 2: ENHANCEMENT STRATEGY**
Based on your analysis, choose the OPTIMAL enhancement approach:

🏆 **HERO SHOWCASE:** If it's a product, service, or key object:
   - Make the uploaded image the star with professional styling
   - Add compelling text overlays and call-to-action elements
   - Apply dramatic lighting effects and color treatments
   - Position as primary focal point with supporting text elements

🎨 **ENHANCED BACKGROUND:** If it works as a scene or backdrop:
   - Use the uploaded image as the background
   - Apply tasteful overlays, gradients, or color grading
   - Ensure perfect text readability with smart contrast enhancements
   - Add text elements that complement the image

🖼️ **TEXT-ENHANCED COMPOSITION:** For lifestyle, people, or complex scenes:
   - Use the uploaded image as the base
   - Add magazine-quality text layouts and typography
   - Apply professional text treatments and positioning
   - Create compelling text overlays that tell a story

✨ **STYLIZED INTEGRATION:** For logos, graphics, or decorative elements:
   - Use the uploaded image as the main element
   - Apply professional effects, shadows, and styling
   - Add complementary text and design treatments
   - Create harmony between the image and text elements

**STEP 3: PROFESSIONAL EXECUTION**
- Use ONLY the uploaded image - do not generate any new images
- Enhance with text overlays, color treatments, and styling
- Maintain consistent visual style and professional appearance
- The uploaded image should be the primary visual element
- Add text and design elements that complement the uploaded image

**USER'S CREATIVE VISION:** "${remainingPrompt}"

Transform the uploaded image into a professional marketing design by enhancing it with text, styling, and layout treatments. DO NOT generate any additional images - use only the uploaded image as the visual foundation.`;

            if (imageText) {
                referencePrompt += `\n\n**Text Overlay Integration:** The user has provided specific text in quotes: "${imageText}". You MUST overlay this text on the design in a way that complements both the uploaded image and the overall composition. Ensure the text is readable and professionally integrated.`
            }

            if (input.outputType === 'video') {
                referencePrompt += `\n\n**Video Integration:** Create a video that showcases the uploaded image as a key element throughout the sequence. The uploaded image should be prominently featured and integrated naturally into the video narrative.`;
                if (imageText) {
                    referencePrompt += `\n\n**Video Text Overlay:** The following text MUST be overlaid on the video in a stylish, readable font: "${imageText}". Position it to complement the uploaded image integration.`;
                }
            }

            if (input.useBrandProfile && input.brandProfile) {
                const bp = input.brandProfile;
                let brandGuidelines = '\n\n**Brand Integration Guidelines:**';

                if (bp.logoDataUrl && !bp.logoDataUrl.includes('image/svg+xml')) {
                    promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                    brandGuidelines += ` Create a complete marketing design that uses the uploaded image as the main design element. If a brand logo is provided, integrate it as a small brand identifier within the larger marketing composition - focus on creating a full marketing design, not a logo-centric layout.`
                } else if (bp.logoDataUrl && bp.logoDataUrl.includes('image/svg+xml')) {
                    brandGuidelines += ` Create a comprehensive marketing design that represents the brand identity while prominently featuring the uploaded image as the main visual element.`
                }

                // Use design-specific colors if provided, otherwise fall back to brand colors
                const primaryColor = input.designColors?.primaryColor || bp.primaryColor;
                const accentColor = input.designColors?.accentColor || bp.accentColor;
                const backgroundColor = input.designColors?.backgroundColor || bp.backgroundColor;

                brandGuidelines += `\n- Use design colors: Primary ${primaryColor || 'brand-appropriate colors'}, Accent ${accentColor || 'complementary colors'}, Background ${backgroundColor || 'neutral background'}`;
                brandGuidelines += `\n- Match brand style: ${bp.visualStyle || 'professional'}`;
                brandGuidelines += `\n- Target audience: ${bp.targetAudience || 'general audience'}`;
                brandGuidelines += `\n- Business name: ${bp.businessName}`;
                brandGuidelines += `\n- Business type: ${bp.businessType}`;
                brandGuidelines += `\n- Location: ${bp.location}`;
                if (bp.websiteUrl) {
                    brandGuidelines += `\n- Website: ${bp.websiteUrl}`;
                }
                if (bp.contactInfo?.phone) {
                    brandGuidelines += `\n- Phone: ${bp.contactInfo.phone}`;
                }
                if (bp.contactInfo?.email) {
                    brandGuidelines += `\n- Email: ${bp.contactInfo.email}`;
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
            // May also include an uploaded image for integration
            const bp = input.brandProfile;
            const hasUploadedImage = !!input.referenceAssetUrl;

            // Extract services from brand profile for DNA selection
            const servicesText = typeof bp.services === 'string'
                ? bp.services
                : Array.isArray(bp.services)
                    ? bp.services.map(s => typeof s === 'object' ? s.name : s).join(', ')
                    : '';

            // Debug logging for services
            console.log('🔍 [AI Generation] Services Debug:', {
                services: bp.services,
                servicesText,
                businessType: bp.businessType,
                businessName: bp.businessName
            });

            // Get business-specific design DNA - prioritize services over business type
            let businessDNA = BUSINESS_TYPE_DESIGN_DNA.default;

            if (servicesText) {
                // Try to match services to specific design DNA
                const servicesLower = servicesText.toLowerCase();
                if (servicesLower.includes('buy now pay later') || servicesLower.includes('financing') || servicesLower.includes('credit')) {
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA.finance || BUSINESS_TYPE_DESIGN_DNA.default;
                } else if (servicesLower.includes('banking') || servicesLower.includes('loan') || servicesLower.includes('investment')) {
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA.finance || BUSINESS_TYPE_DESIGN_DNA.default;
                } else if (servicesLower.includes('food') || servicesLower.includes('restaurant') || servicesLower.includes('cafe')) {
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA.restaurant || BUSINESS_TYPE_DESIGN_DNA.default;
                } else if (servicesLower.includes('fitness') || servicesLower.includes('gym') || servicesLower.includes('health')) {
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA.fitness || BUSINESS_TYPE_DESIGN_DNA.default;
                } else if (servicesLower.includes('beauty') || servicesLower.includes('salon') || servicesLower.includes('spa')) {
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA.beauty || BUSINESS_TYPE_DESIGN_DNA.default;
                } else {
                    // Fall back to business type if no service match
                    businessDNA = BUSINESS_TYPE_DESIGN_DNA[bp.businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;
                }
            } else {
                // Use business type if no services available
                businessDNA = BUSINESS_TYPE_DESIGN_DNA[bp.businessType as keyof typeof BUSINESS_TYPE_DESIGN_DNA] || BUSINESS_TYPE_DESIGN_DNA.default;
            }

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

            const cleanedContent = cleanBusinessNamePattern(parsedInstructions.remainingPrompt || remainingPrompt);

            // Build intelligent content instructions based on user intent
            let structuredContentInstructions = '';

            if (userIntent.isLiteralTextRequest) {
                // User wants specific text - use exactly what they specified
                structuredContentInstructions += `\n\n🚨🚨🚨 LITERAL TEXT REQUEST DETECTED 🚨🚨🚨\n`;
                structuredContentInstructions += `**USER SPECIFIED TEXT (HIGHEST PRIORITY):**\n`;
                userIntent.textInstructions.forEach((text, index) => {
                    structuredContentInstructions += `- ${text}\n`;
                });
                structuredContentInstructions += `\n⛔ CRITICAL RESTRICTIONS:\n`;
                structuredContentInstructions += `- ONLY use the exact text specified by the user above\n`;
                structuredContentInstructions += `- NEVER add "CREATE A DESIGN FOR TODAY" or similar promotional text\n`;
                structuredContentInstructions += `- NEVER add marketing slogans or business taglines\n`;
                structuredContentInstructions += `- NEVER generate additional text content\n`;
                structuredContentInstructions += `- DO NOT create promotional phrases unless explicitly requested\n`;
            } else if (userIntent.isDesignDirectionRequest) {
                // User wants AI to create content using brand information
                structuredContentInstructions += `\n\n🎯 DESIGN DIRECTION REQUEST DETECTED 🎯\n`;
                structuredContentInstructions += `**BRAND-BASED CONTENT GENERATION:**\n`;
                structuredContentInstructions += `- Generate appropriate marketing content using the company's brand information\n`;
                structuredContentInstructions += `- Use business name: ${bp.businessName}\n`;
                structuredContentInstructions += `- Focus on services: ${servicesText || bp.businessType}\n`;
                structuredContentInstructions += `- Location context: ${bp.location}\n`;
                structuredContentInstructions += `- Create relevant, professional marketing text that serves the business\n`;
                structuredContentInstructions += `- AVOID generic phrases like "CREATE A DESIGN FOR TODAY"\n`;
                structuredContentInstructions += `- Focus on actual business value and services\n`;
            } else {
                // Default case - minimal promotional content
                structuredContentInstructions += `\n\n📝 GENERAL DESIGN REQUEST\n`;
                structuredContentInstructions += `**CONTENT APPROACH:**\n`;
                structuredContentInstructions += `- Create professional design with minimal text\n`;
                structuredContentInstructions += `- Use business name: ${bp.businessName} if text is needed\n`;
                structuredContentInstructions += `- Focus on visual design over promotional text\n`;
                structuredContentInstructions += `- AVOID adding unnecessary promotional phrases\n`;
            }

            if (parsedInstructions.headline) {
                structuredContentInstructions += `\n**HEADLINE:** ${parsedInstructions.headline}`;
            }

            if (parsedInstructions.subheadline) {
                structuredContentInstructions += `\n**SUBHEADLINE:** ${parsedInstructions.subheadline}`;
            }

            if (parsedInstructions.cta) {
                structuredContentInstructions += `\n**CALL-TO-ACTION:** ${parsedInstructions.cta}`;
            }

            if (parsedInstructions.designBrief) {
                structuredContentInstructions += `\n**DESIGN BRIEF:** ${parsedInstructions.designBrief}`;
            }

            let onBrandPrompt = `Create a stunning, professional FULL MARKETING DESIGN (NOT just a logo) for social media ${input.outputType} for ${bp.businessName || 'this business'}.${structuredContentInstructions}

**BRAND INFORMATION:**
- Business Name: ${bp.businessName}
- Business Type: ${bp.businessType}
- Location: ${bp.location}
${bp.websiteUrl ? `- Website: ${bp.websiteUrl}` : ''}
${bp.contactInfo?.phone ? `- Phone: ${bp.contactInfo.phone}` : ''}
${bp.contactInfo?.email ? `- Email: ${bp.contactInfo.email}` : ''}
${servicesText ? `- Services: ${servicesText}` : ''}

🎯 **DESIGN TYPE:** Complete marketing design with layout, imagery, text, and visual elements - NOT a standalone logo
🎨 **VISUAL APPROACH:** Full-scale marketing composition with backgrounds, imagery, text overlays, and complete design elements

BUSINESS: ${bp.businessName || 'Professional Business'} (${bp.businessType})
${servicesText ? `🎯 PRIMARY FOCUS - SERVICES: ${servicesText}` : ''}
${servicesText ? `🚨 CRITICAL: Generate content specifically for these services, NOT the business type` : ''}
CONTENT: "${cleanedContent}"
STYLE: ${bp.visualStyle}, modern, clean, professional

FORMAT: ${input.aspectRatio ? `${input.aspectRatio} aspect ratio` : 'Square 1:1 format'}

BRAND COLORS (use prominently):
${bp.primaryColor ? `- Primary: ${bp.primaryColor}` : ''}
${bp.accentColor ? `- Accent: ${bp.accentColor}` : ''}
${bp.backgroundColor ? `- Background: ${bp.backgroundColor}` : ''}

${targetMarketInstructions}

REQUIREMENTS:
- **FULL MARKETING DESIGN** - Complete layout with backgrounds, imagery, text, and visual elements
- **NOT A LOGO** - Create a comprehensive marketing design, not just a logo or brand mark
- High-quality, professional design composition
- ${bp.visualStyle} aesthetic with complete visual hierarchy
- Clean, modern layout with multiple design elements
- ${servicesText ? `🎯 CRITICAL: Focus EXCLUSIVELY on ${servicesText} services - ignore business type` : `Perfect for ${bp.businessType} business marketing`}
- ${servicesText ? `🚨 MANDATORY: All content, imagery, and messaging must relate to ${servicesText}` : ''}
- Brand colors prominently featured throughout the design
- Professional social media marketing appearance
- Include backgrounds, imagery, text layouts, and complete design composition`;

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
                // Handle uploaded image integration with AI intelligence
                if (hasUploadedImage) {
                    onBrandPrompt += `\n- **🎯 UPLOADED IMAGE FOCUSED DESIGN:** A user has uploaded an image that must be the PRIMARY visual element. DO NOT generate any additional images.`;
                    onBrandPrompt += `\n  * **AI Analysis Required:** First analyze the uploaded image to understand its content, style, quality, and best enhancement approach`;
                    onBrandPrompt += `\n  * **Enhancement Strategy:** Based on your analysis, choose the optimal enhancement method:`;
                    onBrandPrompt += `\n    - If it's a product/object: Make it the hero element with professional styling and text overlays`;
                    onBrandPrompt += `\n    - If it's a scene/background: Use as backdrop with professional text treatments and overlays`;
                    onBrandPrompt += `\n    - If it's a person/lifestyle: Add dynamic text layouts and professional treatments`;
                    onBrandPrompt += `\n    - If it's a logo/graphic: Enhance with complementary text and design treatments`;
                    onBrandPrompt += `\n  * **Professional Execution:** Use ONLY the uploaded image - enhance with text, color treatments, and styling`;
                    onBrandPrompt += `\n  * **Brand Synergy:** Coordinate text and design treatments with brand colors and aesthetic`;
                    onBrandPrompt += `\n  * **Creative Excellence:** The uploaded image should be the main visual element enhanced with professional text and design treatments`;
                    promptParts.push({ media: { url: input.referenceAssetUrl!, contentType: getMimeTypeFromDataURI(input.referenceAssetUrl!) } });
                }

                onBrandPrompt += `\n- **UPLOADED IMAGE FOCUSED DESIGN:** ${hasUploadedImage ? 'Create a professional marketing design using ONLY the uploaded image as the visual foundation. Enhance it with text overlays, color treatments, and design elements. DO NOT generate any additional images.' : 'Create a complete, professional marketing design with full layout composition. This should be a comprehensive social media post design, NOT just a logo. Include backgrounds, graphics, text elements, and visual hierarchy.'}`;
                onBrandPrompt += `\n- **Brand Integration:** ${bp.logoDataUrl ? 'If a logo is provided, integrate it as a small brand element within the design - focus on enhancing the uploaded image with brand elements' : 'Create a design that represents the brand identity while focusing on the uploaded image'}.`;
                onBrandPrompt += `\n- **Design Completeness:** ${hasUploadedImage ? 'Enhance the uploaded image with professional text layouts, color treatments, and design elements - use ONLY the uploaded image as the visual foundation' : 'Generate a full marketing design with backgrounds, graphics, text layouts, and visual elements - NOT just a logo or simple graphic.'}`;
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

                // Handle uploaded image integration for video with AI intelligence
                if (hasUploadedImage) {
                    onBrandPrompt += `\n- **🎯 UPLOADED IMAGE FOCUSED VIDEO:** A user has uploaded an image that must be the PRIMARY visual element throughout the video. DO NOT generate any additional images.`;
                    onBrandPrompt += `\n  * **Video Analysis:** Analyze the uploaded image to determine the best video enhancement approach:`;
                    onBrandPrompt += `\n    - Product/Object: Feature as hero element with dynamic camera movements and text overlays`;
                    onBrandPrompt += `\n    - Scene/Background: Use as cinematic backdrop with professional text treatments and effects`;
                    onBrandPrompt += `\n    - Person/Lifestyle: Create engaging sequences showcasing the subject with text overlays`;
                    onBrandPrompt += `\n    - Logo/Graphic: Enhance with animated text and design treatments`;
                    onBrandPrompt += `\n  * **Cinematic Quality:** Use ONLY the uploaded image - enhance with professional video effects, text overlays, and treatments`;
                    onBrandPrompt += `\n  * **Brand Storytelling:** Weave the uploaded image into a compelling brand narrative with text and design elements`;
                    onBrandPrompt += `\n  * **Visual Continuity:** Maintain consistent style and mood using the uploaded image as the foundation`;
                    promptParts.push({ media: { url: input.referenceAssetUrl!, contentType: getMimeTypeFromDataURI(input.referenceAssetUrl!) } });
                }

                if (bp.logoDataUrl && !bp.logoDataUrl.includes('image/svg+xml')) {
                    onBrandPrompt += `\n- **COMPLETE MARKETING DESIGN:** Create a full marketing video with comprehensive visual storytelling - NOT just logo animation. Include backgrounds, graphics, text elements, and complete scene composition.`;
                    onBrandPrompt += `\n- **Brand Element Integration:** If a logo is provided, integrate it as a small brand element within the complete marketing video - focus on creating a full marketing story, not logo-centric content.`;
                    promptParts.push({ media: { url: bp.logoDataUrl, contentType: getMimeTypeFromDataURI(bp.logoDataUrl) } });
                } else if (bp.logoDataUrl && bp.logoDataUrl.includes('image/svg+xml')) {
                    onBrandPrompt += `\n- **COMPREHENSIVE MARKETING VIDEO:** Create a complete marketing video that represents the brand identity with full scene composition, storytelling, and visual elements.`;
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

            // Build intelligent content instructions for non-branded content
            let structuredContentInstructions = '';

            if (userIntent.isLiteralTextRequest) {
                // User wants specific text - use exactly what they specified
                structuredContentInstructions += `\n\n🚨🚨🚨 LITERAL TEXT REQUEST DETECTED 🚨🚨🚨\n`;
                structuredContentInstructions += `**USER SPECIFIED TEXT (HIGHEST PRIORITY):**\n`;
                userIntent.textInstructions.forEach((text, index) => {
                    structuredContentInstructions += `- ${text}\n`;
                });
                structuredContentInstructions += `\n⛔ CRITICAL RESTRICTIONS:\n`;
                structuredContentInstructions += `- ONLY use the exact text specified by the user above\n`;
                structuredContentInstructions += `- NEVER add "CREATE A DESIGN FOR TODAY" or similar promotional text\n`;
                structuredContentInstructions += `- NEVER add marketing slogans or business taglines\n`;
                structuredContentInstructions += `- NEVER generate additional text content\n`;
                structuredContentInstructions += `- DO NOT create promotional phrases unless explicitly requested\n`;
            } else if (userIntent.isDesignDirectionRequest) {
                // User wants AI to create general promotional content
                structuredContentInstructions += `\n\n🎯 DESIGN DIRECTION REQUEST DETECTED 🎯\n`;
                structuredContentInstructions += `**CREATIVE CONTENT GENERATION:**\n`;
                structuredContentInstructions += `- Generate appropriate marketing content based on the design direction\n`;
                structuredContentInstructions += `- Create relevant, professional promotional text\n`;
                structuredContentInstructions += `- Focus on the specific request: ${userIntent.designDirection}\n`;
                structuredContentInstructions += `- AVOID generic phrases like "CREATE A DESIGN FOR TODAY"\n`;
                structuredContentInstructions += `- Make it specific to the user's actual request\n`;
            } else {
                // Default case - minimal content
                structuredContentInstructions += `\n\n📝 GENERAL DESIGN REQUEST\n`;
                structuredContentInstructions += `**CONTENT APPROACH:**\n`;
                structuredContentInstructions += `- Create professional design with minimal text\n`;
                structuredContentInstructions += `- Focus on visual design over promotional text\n`;
                structuredContentInstructions += `- AVOID adding unnecessary promotional phrases\n`;
                structuredContentInstructions += `- Keep text simple and relevant to the request\n`;
            }

            let creativePrompt = `You are an expert creative director specializing in high-end advertisements. Generate a compelling, high-quality social media advertisement ${input.outputType} based on the following instruction: "${parsedInstructions.remainingPrompt || remainingPrompt}".${structuredContentInstructions}

⚡ GEMINI 2.5 FLASH IMAGE PREVIEW QUALITY ENHANCEMENTS:
- MOBILE-OPTIMIZED RESOLUTION: 1080x1080px HD square format for perfect mobile viewing
- SMALL FONT SIZE EXCELLENCE: Perfect rendering at 8pt, 10pt, 12pt, and all small font sizes
- TINY TEXT PRECISION: Every character sharp and legible even when font size is very small
- HIGH-DPI SMALL TEXT: Render small fonts as if on 300+ DPI display for maximum sharpness
- PERFECT ANATOMY: Complete, symmetrical faces with natural expressions
- SHARP DETAILS: Crystal-clear textures, no blur or artifacts
- PROFESSIONAL LIGHTING: Studio-quality lighting with proper shadows
- PREMIUM COMPOSITION: Golden ratio layouts with perfect balance
- ADVANCED COLOR THEORY: Perfect contrast ratios (7:1 minimum) with vibrant, accurate colors
- SQUARE FORMAT: 1:1 aspect ratio optimized for Instagram, Facebook, Twitter, LinkedIn mobile`;

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
                    let modelToUse = 'googleai/gemini-2.5-flash-image-preview'; // Default

                    if (input.preferredModel) {
                        // Map Gemini model names to Genkit model identifiers
                        const modelMapping: Record<string, string> = {
                            'gemini-2.5-flash-image-preview': 'googleai/gemini-2.5-flash-image-preview',
                            'gemini-2.5-flash-image-preview': 'googleai/gemini-2.5-flash-image-preview',
                            'gemini-2.5-flash': 'googleai/gemini-2.5-flash'
                        };

                        modelToUse = modelMapping[input.preferredModel] || modelToUse;
                    }

                    let imageUrl: string | null = null;

                    try {
                        const { media } = await generateWithRetry({
                            model: modelToUse,
                            prompt: promptParts,
                            config: {
                                responseModalities: ['TEXT', 'IMAGE'],
                            },
                        });

                        imageUrl = media?.url ?? null;
                    } catch (err: any) {
                        const msg = (err?.message || '').toLowerCase();
                        const isInternalError = msg.includes('500') || msg.includes('internal error');

                        // Fallback 1: try an alternative Google image model once
                        if (isInternalError) {
                            try {
                                const altModel = 'googleai/gemini-2.0-flash-exp-image-generation';
                                const { media: altMedia } = await generateWithRetry({
                                    model: altModel,
                                    prompt: promptParts,
                                    config: { responseModalities: ['TEXT', 'IMAGE'] },
                                });
                                imageUrl = altMedia?.url ?? null;
                                modelToUse = altModel; // note which model succeeded
                            } catch (altErr: any) {
                                // Defer to final fallback below if this also fails
                                imageUrl = null;
                            }
                        } else {
                            // Non-internal error: rethrow to surface a clear message
                            throw err;
                        }
                    }

                    if (!imageUrl) {
                        if (attempts === maxAttempts) {
                            // Final Fallback 2: generate a brand-colored SVG so the user still gets an asset
                            try {
                                const fallbackSvg = createBrandFallbackSVG({
                                    size: 1080,
                                    primary: input.brandProfile?.primaryColor || '#3B82F6',
                                    accent: input.brandProfile?.accentColor || '#10B981',
                                    background: input.brandProfile?.backgroundColor || '#F8FAFC',
                                    title: imageText || (input.brandProfile?.businessName || 'Creative Asset'),
                                    subtitle: remainingPrompt?.slice(0, 120) || '',
                                });
                                imageUrl = `data:image/svg+xml;base64,${Buffer.from(fallbackSvg, 'utf-8').toString('base64')}`;
                            } catch {
                                throw new Error('Failed to generate image');
                            }
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
            // Make the internal error more actionable for users
            if (message.toLowerCase().includes('internal error')) {
                throw new Error('The image model is temporarily unavailable. I tried a fallback automatically; please try again if quality looks off.');
            }
            throw new Error(message);
        }
    }
);


