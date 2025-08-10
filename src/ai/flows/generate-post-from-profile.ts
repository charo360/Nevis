
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a daily social media post.
 *
 * It takes into account business type, location, brand voice, current weather, and local events to create engaging content.
 *
 * @exports {
 *   generatePostFromProfile: function
 *   GeneratePostFromProfileInput: type
 *   GeneratePostFromProfileOutput: type
 * }
 */

import {ai} from '@/ai/genkit';
import { GenerateRequest } from 'genkit/generate';
import {z} from 'zod';
import { getWeatherTool, getEventsTool } from '@/ai/tools/local-data';

const GeneratePostFromProfileInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  writingTone: z.string().describe('The brand voice of the business.'),
  contentThemes: z.string().describe('The content themes of the business.'),
  logoDataUrl: z.string().describe("The business logo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  dayOfWeek: z.string().describe('The day of the week for the post.'),
  currentDate: z.string().describe('The current date for the post.'),
  variants: z.array(z.object({
    platform: z.string(),
    aspectRatio: z.string(),
  })).describe('An array of platform and aspect ratio variants to generate.'),
  primaryColor: z.string().optional().describe('The primary brand color in HSL format.'),
  accentColor: z.string().optional().describe('The accent brand color in HSL format.'),
  backgroundColor: z.string().optional().describe('The background brand color in HSL format.'),

  // New detailed fields for richer content
  services: z.string().optional().describe('A newline-separated list of key services or products.'),
  targetAudience: z.string().optional().describe('A description of the target audience.'),
  keyFeatures: z.string().optional().describe('A newline-separated list of key features or selling points.'),
  competitiveAdvantages: z.string().optional().describe('A newline-separated list of competitive advantages.'),
});

export type GeneratePostFromProfileInput = z.infer<typeof GeneratePostFromProfileInputSchema>;

const GeneratePostFromProfileOutputSchema = z.object({
  content: z.string().describe('The generated social media post content (the caption).'),
  imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
  hashtags: z.string().describe('Relevant hashtags for the post.'),
  variants: z.array(z.object({
    platform: z.string(),
    imageUrl: z.string(),
  })),
});

export type GeneratePostFromProfileOutput = z.infer<typeof GeneratePostFromProfileOutputSchema>;

export async function generatePostFromProfile(input: GeneratePostFromProfileInput): Promise<GeneratePostFromProfileOutput> {
  return generatePostFromProfileFlow(input);
}


// Define the text generation prompt at the top level.
const textGenPrompt = ai.definePrompt({
    name: 'generatePostTextPrompt',
    input: { schema: z.object({
      businessType: z.string(),
      location: z.string(),
      writingTone: z.string(),
      contentThemes: z.string(),
      dayOfWeek: z.string(),
      currentDate: z.string(),
      services: z.string().optional(),
      targetAudience: z.string().optional(),
      keyFeatures: z.string().optional(),
      competitiveAdvantages: z.string().optional(),
    })},
    output: { schema: z.object({
      content: z.string().describe('The generated social media post content (the caption).'),
      imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
      hashtags: z.string().describe('Relevant hashtags for the post.'),
    })},
    tools: [getWeatherTool, getEventsTool],
    prompt: `You are a social media manager and an expert in the {{{businessType}}} industry.
    Your goal is to create content that drives the highest possible engagement.
    Your response MUST be a valid JSON object that conforms to the output schema.
    
    You have tools to get the current weather and local events for the business's location.
    You should consider using these tools if you think that information will make the post more timely and engaging. Do not use them if it feels forced or irrelevant.
    
    Here's the information you have:
    - Business Type: {{{businessType}}}
    - Location: {{{location}}} (Use this for your tool calls)
    - Brand Voice: {{{writingTone}}}
    - Content Themes: {{{contentThemes}}}
    - Day of Week: {{{dayOfWeek}}}
    - Today's Date: {{{currentDate}}}
    {{#if services}}- Services/Products:
{{{services}}}{{/if}}
    {{#if targetAudience}}- Target Audience: {{{targetAudience}}}{{/if}}
    {{#if keyFeatures}}- Key Features:
{{{keyFeatures}}}{{/if}}
    {{#if competitiveAdvantages}}- Why We're Different:
{{{competitiveAdvantages}}}{{/if}}

    Incorporate trends, seasonal topics, or common conversations relevant to the {{{businessType}}} industry.
    Use the detailed business information (services, audience, features) to make the content highly specific and compelling.
    
    Generate a social media post. This includes a longer text for the caption, a separate, very brief text to be placed on the image, and hashtags.
    
    1.  **Caption (content):** Generate a post that is appropriate for a general audience. The post MUST:
        - Start with a strong, attention-grabbing hook.
        - Include a question to encourage comments and interaction.
        - End with a clear call-to-action (e.g., "Book now," "Visit us today," "Comment below with your favorite").
        - Match the brand voice and directly or indirectly promote one of the services or key features.
    2.  **Image Text (imageText):** Generate a brief, catchy headline (max 5 words) that relates to the caption and is suitable for being overlaid on an image.
    3.  **Hashtags:** Include relevant hashtags.
    `,
});

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

// Helper function to generate an image for a single variant.
async function generateImageForVariant(
    variant: {platform: string, aspectRatio: string}, 
    input: GeneratePostFromProfileInput, 
    textOutput: { imageText: string }
) {
    const colorInstructions = `The brand's color palette is: Primary HSL(${input.primaryColor}), Accent HSL(${input.accentColor}), Background HSL(${input.backgroundColor}). Please use these colors in the design.`;
    
    const imagePrompt = `You are an expert graphic designer creating a social media post for a ${input.businessType}.
    Your goal is to generate a single, cohesive, and visually stunning image. The image must have an aspect ratio of ${variant.aspectRatio}.

    **Key Elements to Include:**
    - **Visual Style:** The design must be ${input.visualStyle}.
    - **Brand Colors:** ${input.primaryColor ? colorInstructions : 'The brand has not specified colors, so use a visually appealing and appropriate palette.'}
    - **Subject/Theme:** The core subject of the image should be directly inspired by the Image Text below.
    - **Text Overlay:** The following text must be overlaid on the image in a stylish, readable font: "${textOutput.imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated. The entire text must be visible.
    - **Logo Placement:** The provided logo must be integrated naturally into the design. It should be clearly visible but not overpower the main subject. For example, it could be on a product, a sign, or as a subtle watermark.
    `;

    const { media } = await generateWithRetry({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { text: imagePrompt },
        { media: { url: input.logoDataUrl, contentType: getMimeTypeFromDataURI(input.logoDataUrl) } },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
      platform: variant.platform,
      imageUrl: media?.url ?? '',
    }
}


const generatePostFromProfileFlow = ai.defineFlow(
  {
    name: 'generatePostFromProfileFlow',
    inputSchema: GeneratePostFromProfileInputSchema,
    outputSchema: GeneratePostFromProfileOutputSchema,
  },
  async (input) => {
    // Step 1: Generate Text Content (once for all platforms)
    const { output: textOutput } = await textGenPrompt({
        businessType: input.businessType,
        location: input.location,
        writingTone: input.writingTone,
        contentThemes: input.contentThemes,
        dayOfWeek: input.dayOfWeek,
        currentDate: input.currentDate,
        services: input.services,
        targetAudience: input.targetAudience,
        keyFeatures: input.keyFeatures,
        competitiveAdvantages: input.competitiveAdvantages,
    });
    

    if (!textOutput) {
        throw new Error('Failed to generate post text content.');
    }
    
    // Step 2: Generate Image for each variant in parallel
    const imagePromises = input.variants.map(variant => 
        generateImageForVariant(variant, input, textOutput)
    );
    
    const variants = await Promise.all(imagePromises);

    return {
        ...textOutput,
        variants,
    };
  }
);
