import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Get API key from environment variables - Use Revo 2.0 key for genkit (since Quick Content uses Genkit flows)
const apiKey = process.env.GEMINI_API_KEY_REVO_2_0 || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
  console.error('❌ [Genkit] No API key found. Please set GEMINI_API_KEY_REVO_2_0 or GEMINI_API_KEY environment variable.');
  throw new Error('Genkit: Gemini API key is required');
}

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash', // Using Gemini 2.5 Flash (supports JSON mode)
});
