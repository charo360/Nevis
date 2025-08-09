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
  content: z.string().describe('The generated social media post content.'),
  imageUrl: z.string().describe('URL of the generated image, if any.'),
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

  Generate a social media post that is appropriate for the given platform and target audience. 
  Include relevant hashtags. Consider the weather and local events when creating the post.  The post should match the brand voice.

  Output the content, a URL for an image related to the content, and relevant hashtags. Be brief.
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
