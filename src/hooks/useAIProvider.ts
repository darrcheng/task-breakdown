import { useState, useEffect, useCallback } from 'react';
import type { AIProviderName } from '../types';
import type { AIProvider } from '../ai/providers/types';
import { createProvider } from '../ai/provider-factory';
import { saveApiKey, loadApiKey, hasApiKey, deleteApiKey } from '../ai/key-storage';

const PROVIDER_STORAGE_KEY = 'taskbreaker-ai-provider';

interface AIProviderState {
  provider: AIProviderName | null;
  hasKey: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAIProvider() {
  const [state, setState] = useState<AIProviderState>({
    provider: null,
    hasKey: false,
    isLoading: true,
    error: null,
  });

  // Load provider config on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) as AIProviderName | null;
    if (savedProvider && (savedProvider === 'anthropic' || savedProvider === 'gemini')) {
      const keyExists = hasApiKey(savedProvider);
      setState({
        provider: savedProvider,
        hasKey: keyExists,
        isLoading: false,
        error: null,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
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

        setState({
          provider,
          hasKey: true,
          isLoading: false,
          error: null,
        });
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

    return createProvider(state.provider, apiKey);
  }, [state.provider]);

  const clearProvider = useCallback(() => {
    if (state.provider) {
      deleteApiKey(state.provider);
    }
    localStorage.removeItem(PROVIDER_STORAGE_KEY);
    setState({
      provider: null,
      hasKey: false,
      isLoading: false,
      error: null,
    });
  }, [state.provider]);

  const getKeyLastChars = useCallback(async (): Promise<string | null> => {
    if (!state.provider || !state.hasKey) return null;
    const key = await loadApiKey(state.provider);
    if (!key) return null;
    return key.slice(-4);
  }, [state.provider, state.hasKey]);

  return {
    ...state,
    isConfigured,
    configureProvider,
    getProvider,
    clearProvider,
    getKeyLastChars,
  };
}
