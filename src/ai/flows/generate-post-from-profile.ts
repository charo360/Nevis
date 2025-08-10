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
import {z} from 'genkit';

const GeneratePostFromProfileInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  visualStyle: z.string().describe('The visual style of the brand (e.g., modern, vintage).'),
  writingTone: z.string().describe('The brand voice of the business.'),
  contentThemes: z.string().describe('The content themes of the business.'),
  logoDataUrl: z.string().describe("The business logo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  weather: z.string().describe('The current weather conditions.'),
  events: z.string().describe('Local events happening on the target date.'),
  dayOfWeek: z.string().describe('The day of the week for the post.'),
  currentDate: z.string().describe('The current date for the post.'),
  variants: z.array(z.object({
    platform: z.string(),
    aspectRatio: z.string(),
  })).describe('An array of platform and aspect ratio variants to generate.'),
  primaryColor: z.string().optional().describe('The primary brand color in HSL format.'),
  accentColor: z.string().optional().describe('The accent brand color in HSL format.'),
  backgroundColor: z.string().optional().describe('The background brand color in HSL format.'),
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
      weather: z.string(),
      events: z.string(),
      dayOfWeek: z.string(),
      currentDate: z.string(),
    })},
    output: { schema: z.object({
      content: z.string().describe('The generated social media post content (the caption).'),
      imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
      hashtags: z.string().describe('Relevant hashtags for the post.'),
    })},
    prompt: `You are a social media manager and an expert in the {{{businessType}}} industry.
    Your goal is to create engaging content that is relevant to the business's location, brand, and current events.
    
    Here's the information you have:
    - Business Type: {{{businessType}}}
    - Location: {{{location}}}
    - Brand Voice: {{{writingTone}}}
    - Content Themes: {{{contentThemes}}}
    - Weather: {{{weather}}}
    - Local Events: {{{events}}}
    - Day of Week: {{{dayOfWeek}}}
    - Today's Date: {{{currentDate}}}

    Incorporate trends, seasonal topics, or common conversations relevant to the {{{businessType}}} industry. Use the date to ensure the content is fresh and not repetitive.
    
    Generate a social media post. This includes a longer text for the caption, a separate, very brief text to be placed on the image, and hashtags.
    
    1.  **Caption (content):** Generate a post that is appropriate for a general audience. Consider the weather and local events when creating the post. The post should match the brand voice.
    2.  **Image Text (imageText):** Generate a brief, catchy headline (max 5 words) that relates to the caption and is suitable for being overlaid on an image.
    3.  **Hashtags:** Include relevant hashtags.
    `,
});

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
        weather: input.weather,
        events: input.events,
        dayOfWeek: input.dayOfWeek,
        currentDate: input.currentDate,
    });
    

    if (!textOutput) {
        throw new Error('Failed to generate post text content.');
    }
    
    // Step 2: Generate Image for each variant using the generated text
    const generateImageForVariant = async (variant: {platform: string, aspectRatio: string}) => {
        
      const colorInstructions = `The brand's color palette is: Primary HSL(${input.primaryColor}), Accent HSL(${input.accentColor}), Background HSL(${input.backgroundColor}). Please use these colors in the design.`;

      const { media } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
          {
            text: `First, generate an appealing background image for a social media post for a ${input.businessType} in ${input.location}. The brand's visual style is ${input.visualStyle}. ${input.primaryColor ? colorInstructions : ''} The image should have a clear, uncluttered area suitable for placing text. The image must have an aspect ratio of ${variant.aspectRatio}. Then, overlay the following text onto the image: "${textOutput.imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated at the edges of the image. The entire text must be visible. Finally, place the provided logo naturally onto the generated background image. The logo should be clearly visible but not overpower the main subject. It could be on a product, a sign, or as a subtle watermark.`,
          },
          { media: { url: input.logoDataUrl } },
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
    
    const variants = await Promise.all(input.variants.map(v => generateImageForVariant(v)));

    return {
        ...textOutput,
        variants,
    };
  }
);
