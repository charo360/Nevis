// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview Analyzes a brand's social media presence to extract brand voice and visual style.
 *
 * - analyzeBrand - A function that initiates the brand analysis process.
 * - AnalyzeBrandInput - The input type for the analyzeBrand function.
 * - AnalyzeBrandOutput - The return type for the analyzeBrand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBrandInputSchema = z.object({
  socialMediaUrl: z
    .string()
    .describe('The URL of the brand social media profile to analyze.'),
});
export type AnalyzeBrandInput = z.infer<typeof AnalyzeBrandInputSchema>;

const AnalyzeBrandOutputSchema = z.object({
  visualStyle: z
    .string()
    .describe('A description of the brand visual style, including colors, layouts, and image types.'),
  writingTone: z.string().describe('A description of the brand writing tone.'),
  contentThemes: z.string().describe('A description of the brand content themes.'),
});
export type AnalyzeBrandOutput = z.infer<typeof AnalyzeBrandOutputSchema>;

export async function analyzeBrand(input: AnalyzeBrandInput): Promise<AnalyzeBrandOutput> {
  return analyzeBrandFlow(input);
}

const analyzeBrandPrompt = ai.definePrompt({
  name: 'analyzeBrandPrompt',
  input: {schema: AnalyzeBrandInputSchema},
  output: {schema: AnalyzeBrandOutputSchema},
  prompt: `You are an expert social media brand analyst. Analyze the provided social media profile and extract the brand's visual style, writing tone, and content themes.

Social Media Profile URL: {{{socialMediaUrl}}}

Provide a detailed analysis of the brand's visual style, writing tone, and content themes. Be specific and provide examples from the provided social media profile.`,
});

const analyzeBrandFlow = ai.defineFlow(
  {
    name: 'analyzeBrandFlow',
    inputSchema: AnalyzeBrandInputSchema,
    outputSchema: AnalyzeBrandOutputSchema,
  },
  async input => {
    const {output} = await analyzeBrandPrompt(input);
    return output!;
  }
);
