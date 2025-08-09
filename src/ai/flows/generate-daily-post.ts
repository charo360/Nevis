'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a daily social media post.
 *
 * It takes into account business type, location, brand voice, current weather, and local events to create engaging content.
 *
 * @exports {
 *   generateDailyPost: function
 *   GenerateDailyPostInput: type
 *   GenerateDailyPostOutput: type
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDailyPostInputSchema = z.object({
  businessType: z.string().describe('The type of business (e.g., restaurant, salon).'),
  location: z.string().describe('The location of the business (city, state).'),
  brandVoice: z.string().describe('The brand voice of the business.'),
  weather: z.string().describe('The current weather conditions.'),
  events: z.string().describe('Local events happening on the target date.'),
  dayOfWeek: z.string().describe('The day of the week for the post.'),
});

export type GenerateDailyPostInput = z.infer<typeof GenerateDailyPostInputSchema>;

const GenerateDailyPostOutputSchema = z.object({
  content: z.string().describe('The generated social media post content (the caption).'),
  imageText: z.string().describe('A very short, catchy headline for the image itself (max 5 words).'),
  hashtags: z.string().describe('Relevant hashtags for the post.'),
});

export type GenerateDailyPostOutput = z.infer<typeof GenerateDailyPostOutputSchema>;

export async function generateDailyPost(input: GenerateDailyPostInput): Promise<GenerateDailyPostOutput> {
  return generateDailyPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyPostPrompt',
  input: {schema: GenerateDailyPostInputSchema},
  output: {schema: GenerateDailyPostOutputSchema},
  prompt: `You are a social media manager for a local business.
  Your goal is to create engaging content that is relevant to the business's location, brand, and current events.

  Here's the information you have:
  - Business Type: {{{businessType}}}
  - Location: {{{location}}}
  - Brand Voice: {{{brandVoice}}}
  - Weather: {{{weather}}}
  - Local Events: {{{events}}}
  - Day of Week: {{{dayOfWeek}}}

  Generate a social media post. This includes a longer text for the caption, and a separate, very brief text to be placed on the image.
  
  1.  **Caption (content):** Generate a post that is appropriate for the given platform and target audience. Consider the weather and local events when creating the post. The post should match the brand voice.
  2.  **Image Text (imageText):** Generate a very short, catchy headline (max 5 words) that relates to the caption and is suitable for being overlaid on an image.
  3.  **Hashtags:** Include relevant hashtags.

  Output the content, the imageText, and relevant hashtags.
  `,
});

const generateDailyPostFlow = ai.defineFlow(
  {
    name: 'generateDailyPostFlow',
    inputSchema: GenerateDailyPostInputSchema,
    outputSchema: GenerateDailyPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
