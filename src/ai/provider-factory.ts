import type { AIProviderName } from '../types';
import type { AIProvider } from './providers/types';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';

export function createProvider(
  name: AIProviderName,
  apiKey: string,
  model?: string,
): AIProvider {
  switch (name) {
    case 'anthropic':
      return new AnthropicProvider(apiKey);
    case 'gemini':
      return new GeminiProvider(apiKey, model);
    default:
      throw new Error(
        `Unknown AI provider: "${name}". Supported providers: anthropic, gemini`,
      );
  }
}
