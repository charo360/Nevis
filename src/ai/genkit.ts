import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
}

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.0-flash', // Back to working Gemini 2.0 Flash
});
