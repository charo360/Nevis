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
});

export type GeneratePostFromProfileInput = z.infer<typeof GeneratePostFromProfileInputSchema>;

const GeneratePostFromProfileOutputSchema = z.object({
  content: z.string().describe('The generated social media post content (the caption).'),
  imageText: z.string().describe('A brief, catchy headline for the image itself (max 5 words).'),
  hashtags: z.string().describe('Relevant hashtags for the post.'),
  imageUrl: z.string().describe('The URL of the generated image.'),
});

export type GeneratePostFromProfileOutput = z.infer<typeof GeneratePostFromProfileOutputSchema>;

export async function generatePostFromProfile(input: GeneratePostFromProfileInput): Promise<GeneratePostFromProfileOutput> {
  return generatePostFromProfileFlow(input);
}


const generatePostFromProfileFlow = ai.defineFlow(
  {
    name: 'generatePostFromProfileFlow',
    inputSchema: GeneratePostFromProfileInputSchema,
    outputSchema: GeneratePostFromProfileOutputSchema,
  },
  async (input) => {
    // Step 1: Generate Text Content
    const textGenPrompt = ai.definePrompt({
      name: 'generatePostTextPrompt',
      input: { schema: GeneratePostFromProfileInputSchema },
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
      
      1.  **Caption (content):** Generate a post that is appropriate for the given platform and target audience. Consider the weather and local events when creating the post. The post should match the brand voice.
      2.  **Image Text (imageText):** Generate a brief, catchy headline (max 5 words) that relates to the caption and is suitable for being overlaid on an image.
      3.  **Hashtags:** Include relevant hashtags.
      `,
    });

    const { output: textOutput } = await textGenPrompt(input);

    if (!textOutput) {
        throw new Error('Failed to generate post text content.');
    }

    // Step 2: Generate Image using text from Step 1
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {
          text: `First, generate an appealing background image for a social media post for a ${input.businessType} in ${input.location}. The brand's visual style is ${input.visualStyle}. The image should have a clear, uncluttered area suitable for placing text. The image must be a square (1:1 aspect ratio). Then, overlay the following text onto the image: "${textOutput.imageText}". It is critical that the text is clearly readable, well-composed, and not cut off or truncated at the edges of the image. The entire text must be visible. Finally, place the provided logo naturally onto the generated background image. The logo should be clearly visible but not overpower the main subject. It could be on a product, a sign, or as a subtle watermark.`,
        },
        { media: { url: input.logoDataUrl } },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {
        ...textOutput,
        imageUrl: media?.url ?? '',
    };
  }
);
