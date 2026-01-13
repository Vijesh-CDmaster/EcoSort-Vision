import {genkit} from 'genkit';
import {createRequire} from 'module';

const hasGoogleAiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

let plugins: unknown[] = [];
let model: string | undefined;

if (hasGoogleAiKey) {
  try {
    const require = createRequire(import.meta.url);
    // Use require to avoid module-load side effects when no API key is set.
    const {googleAI} = require('@genkit-ai/google-genai') as {googleAI: () => unknown};
    plugins = [googleAI()];
    model = 'googleai/gemini-2.5-flash';
  } catch {
    // If the plugin can't be loaded for any reason, keep the app bootable.
  }
}

export const ai = genkit(
  plugins.length > 0 && model
    ? {plugins: plugins as any[], model}
    : {
        // Allow the app to boot without Genkit credentials (e.g., YOLO-only mode).
        // Genkit flows that rely on Google AI will fail at call-time until a key is configured.
      }
);
