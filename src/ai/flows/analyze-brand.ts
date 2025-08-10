'use server';

/**
 * @fileOverview Analyzes a brand's website and design examples to extract brand voice and visual style.
 *
 * - analyzeBrand - A function that initiates the brand analysis process.
 * - AnalyzeBrandInput - The input type for the analyzeBrand function.
 * - AnalyzeBrandOutput - The return type for the analyzeBrand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeBrandInputSchema = z.object({
  websiteUrl: z.string().describe('The URL of the brand\'s website to analyze.'),
  designImageUris: z.array(z.string()).describe("A list of data URIs of previous design examples. Each must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type AnalyzeBrandInput = z.infer<typeof AnalyzeBrandInputSchema>;

const AnalyzeBrandOutputSchema = z.object({
  visualStyle: z.string().describe('A description of the brand visual style, including colors, layouts, and image types.'),
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
  prompt: `You are an expert brand analyst. Analyze the provided brand website and, most importantly, the design examples to extract the brand's visual style, writing tone, and content themes. The design examples are the primary source of truth for the visual style.

Website URL: {{{websiteUrl}}}

{{#each designImageUris}}
Design Example: {{media url=this}}
{{/each}}


Provide a detailed analysis of the brand's visual style (colors, fonts, imagery, layout), writing tone (formal, casual, witty), and common content themes. Be specific and provide examples where possible.`,
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
