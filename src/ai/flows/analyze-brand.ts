'use server';

/**
 * @fileOverview Analyzes a brand's website and design examples to extract brand voice, visual style, and other key business details.
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
  visualStyle: z.string().describe('A description of the brand visual style, including colors, layouts, and image types. This should be based primarily on the design examples.'),
  writingTone: z.string().describe('A description of the brand writing tone, based on the website text.'),
  contentThemes: z.string().describe('A description of the brand content themes, based on the website text and design examples.'),
  description: z.string().describe('A concise summary of the business and what it does, extracted from the website.'),
  services: z.string().describe('A newline-separated list of the key services or products offered by the business, extracted from the website.'),
  contactInfo: z.object({
      phone: z.string().optional().describe('The main contact phone number.'),
      email: z.string().optional().describe('The main contact email address.'),
      address: z.string().optional().describe('The physical business address.'),
  }).describe('The contact information for the business, extracted from the website.'),
});
export type BrandAnalysisResult = z.infer<typeof AnalyzeBrandOutputSchema>;

export async function analyzeBrand(input: AnalyzeBrandInput): Promise<BrandAnalysisResult> {
  return analyzeBrandFlow(input);
}

const analyzeBrandPrompt = ai.definePrompt({
  name: 'analyzeBrandPrompt',
  input: {schema: AnalyzeBrandInputSchema},
  output: {schema: AnalyzeBrandOutputSchema},
  prompt: `You are an expert brand and business analyst. Your task is to perform a comprehensive analysis of a business based on its website and design examples.

  **Source Information:**
  - Website URL: {{{websiteUrl}}}
  - Design Examples: These are the primary source of truth for visual style.
  {{#each designImageUris}}
  Design Example: {{media url=this}}
  {{/each}}
  
  **Your Analysis Must Extract the Following:**
  
  1.  **Business Description:** From the website, write a concise summary of the business, its mission, and what it offers.
  2.  **Services/Products:** From the website, identify the key services or products. List them as a single string separated by newlines.
  3.  **Visual Style:** Based *primarily* on the provided design examples, describe the visual style. Analyze colors, fonts, imagery, and overall layout aesthetics.
  4.  **Writing Tone:** Based on the text from the website, describe the brand's writing tone (e.g., formal, casual, witty, professional, friendly).
  5.  **Content Themes:** Synthesizing information from both the website and designs, identify common themes and topics the brand focuses on in its content.
  6.  **Contact Information:** From the website, extract the main phone number, email address, and physical address. If a piece of information is not present, omit the corresponding field.
  
  Provide a complete analysis in the required JSON format.
  `,
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
