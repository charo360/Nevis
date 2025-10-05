import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Runtime guard to ensure no paid search/grounding tools are enabled
function assertNoSearchToolsEnabled(options: any) {
  if (!options) return;
  const tools = (options.tools || options.tool || []).map((t: any) => (typeof t === 'string' ? t : t?.name)).join(',');
  const model = options.model || options?.generate?.model || options?.modelId;
  if (/search|ground/i.test(tools)) {
    const message = `Guard: Attempted to enable Gemini search/grounding tools (tools=[${tools}]) on model ${model}. This is blocked to prevent per-query search charges.`;
    console.error('❌', message);
    throw new Error(message);
  }
}

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

  const instance = genkit({
    plugins: [googleAI({ 
      apiKey,
      // FORCE Flash model to prevent Pro charges
      defaultModel: 'gemini-2.5-flash'
    })],
    model: 'googleai/gemini-2.5-flash', // Using Gemini 2.5 Flash (supports JSON mode)
  });

  // Wrap generate to enforce guard centrally
  const originalGenerate = (instance as any).generate?.bind(instance);
  if (originalGenerate) {
    (instance as any).generate = async (opts: any) => {
      assertNoSearchToolsEnabled(opts);
      return originalGenerate(opts);
    };
  }

  return instance;
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
