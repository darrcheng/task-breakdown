import { useState, useEffect, useCallback } from 'react';
import type { AIProviderName, GeminiModelId } from '../types';
import { GEMINI_DEFAULT_MODEL } from '../types';
import type { AIProvider } from '../ai/providers/types';
import { createProvider } from '../ai/provider-factory';
import { saveApiKey, loadApiKey, hasApiKey, deleteApiKey } from '../ai/key-storage';

const PROVIDER_STORAGE_KEY = 'taskbreaker-ai-provider';
const GEMINI_MODEL_KEY = 'taskbreaker-gemini-model';

function saveGeminiModel(model: GeminiModelId): void {
  localStorage.setItem(GEMINI_MODEL_KEY, model);
}

function loadGeminiModel(): GeminiModelId {
  const saved = localStorage.getItem(GEMINI_MODEL_KEY);
  const validIds: string[] = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash-preview',
    'gemma-3-12b-it',
    'gemma-3-27b-it',
  ];
  if (saved && validIds.includes(saved)) {
    return saved as GeminiModelId;
  }
  return GEMINI_DEFAULT_MODEL;
}

interface AIProviderState {
  provider: AIProviderName | null;
  hasKey: boolean;
  isLoading: boolean;
  error: string | null;
  geminiModel: GeminiModelId;
}

export function useAIProvider() {
  const [state, setState] = useState<AIProviderState>({
    provider: null,
    hasKey: false,
    isLoading: true,
    error: null,
    geminiModel: GEMINI_DEFAULT_MODEL,
  });

  // Load provider config on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProviderName | null;
    const savedModel = loadGeminiModel();
    if (savedProvider && (savedProvider === 'anthropic' || savedProvider === 'gemini')) {
      const keyExists = hasApiKey(savedProvider);
      setState({
        provider: savedProvider,
        hasKey: keyExists,
        isLoading: false,
        error: null,
        geminiModel: savedModel,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false, geminiModel: savedModel }));
    }
  }, []);

  const isConfigured = state.provider !== null && state.hasKey;

  const configureProvider = useCallback(
    async (provider: AIProviderName, apiKey: string): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Test connection first
        const instance = createProvider(provider, apiKey);
        const connected = await instance.testConnection();

        if (!connected) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Connection test failed. Please check your API key.',
          }));
          return false;
        }

        // Save provider preference and encrypted key
        localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
        await saveApiKey(provider, apiKey);

        setState((prev) => ({
          ...prev,
          provider,
          hasKey: true,
          isLoading: false,
          error: null,
        }));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Configuration failed: ${message}`,
        }));
        return false;
      }
    },
    [],
  );

  const getProvider = useCallback(async (): Promise<AIProvider | null> => {
    if (!state.provider) return null;

    const apiKey = await loadApiKey(state.provider);
    if (!apiKey) return null;

    const model = state.provider === 'gemini' ? state.geminiModel : undefined;
    return createProvider(state.provider, apiKey, model);
  }, [state.provider, state.geminiModel]);

  const clearProvider = useCallback(() => {
    if (state.provider) {
      deleteApiKey(state.provider);
    }
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    localStorage.removeItem(GEMINI_MODEL_KEY);
    setState({
      provider: null,
      hasKey: false,
      isLoading: false,
      error: null,
      geminiModel: GEMINI_DEFAULT_MODEL,
    });
  }, [state.provider]);

  const getKeyLastChars = useCallback(async (): Promise<string | null> => {
    if (!state.provider || !state.hasKey) return null;
    const key = await loadApiKey(state.provider);
    if (!key) return null;
    return key.slice(-4);
  }, [state.provider, state.hasKey]);

  const setGeminiModel = useCallback((model: GeminiModelId) => {
    saveGeminiModel(model);
    setState((prev) => ({ ...prev, geminiModel: model }));
  }, []);

  return {
    ...state,
    isConfigured,
    configureProvider,
    getProvider,
    clearProvider,
    getKeyLastChars,
    setGeminiModel,
  };
}
