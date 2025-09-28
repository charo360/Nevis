import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Lazy initialization helper so missing env doesn't throw during module import.
function createGenkitInstance() {
  const apiKey =
    process.env.GEMINI_API_KEY_REVO_1_0?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENAI_API_KEY?.trim();

  if (!apiKey) {
    // Defer throwing until consumer actually tries to use `ai` so the app can boot in dev
    console.error('❌ [Genkit] No API key found. Please set GEMINI_API_KEY_REVO_1_0 or GEMINI_API_KEY environment variable.');
    return null;
  }

  return genkit({
    plugins: [googleAI({ apiKey })],
    model: 'googleai/gemini-2.5-flash', // Using Gemini 2.5 Flash (supports JSON mode)
  });
}

let _instance: any = null;
const ensureInstance = () => {
  if (_instance === null) {
    _instance = createGenkitInstance();
  }
  return _instance;
};

// Export a Proxy that lazily initializes genkit. This keeps the `ai` export shape
// stable for existing imports, but throws a clear error only when code actually
// tries to use the AI functionality.
export const ai: any = new Proxy(
  {},
  {
    get(_target, prop) {
      const inst = ensureInstance();
      if (!inst) {
        throw new Error(
          'Genkit: Gemini API key is required. Set GEMINI_API_KEY_REVO_1_0 or GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY).'
        );
      }
      const value = inst[prop as keyof typeof inst];
      if (typeof value === 'function') return value.bind(inst);
      return value;
    },
    apply(_target, thisArg, args) {
      const inst = ensureInstance();
      if (!inst) {
        throw new Error(
          'Genkit: Gemini API key is required. Set GEMINI_API_KEY_REVO_1_0 or GEMINI_API_KEY (or GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY).'
        );
      }
      return (inst as any).apply(thisArg, args);
    },
  }
);
