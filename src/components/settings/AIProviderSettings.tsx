import { useState, useEffect } from 'react';
import { Bot, Check, AlertCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useAIProvider } from '../../hooks/useAIProvider';
import type { AIProviderName } from '../../types';
import { GEMINI_MODELS } from '../../types';

const PROVIDERS: { name: AIProviderName; label: string; description: string }[] = [
  {
    name: 'anthropic',
    label: 'Claude',
    description: 'Direct browser connection (no proxy needed)',
  },
  {
    name: 'gemini',
    label: 'Gemini',
    description: 'May require CORS proxy for browser usage',
  },
];

export function AIProviderSettings() {
  const {
    provider: currentProvider,
    hasKey,
    isLoading,
    error,
    configureProvider,
    clearProvider,
    getKeyLastChars,
    geminiModel,
    setGeminiModel,
  } = useAIProvider();

  const [selectedProvider, setSelectedProvider] = useState<AIProviderName | null>(
    currentProvider,
  );
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyHint, setKeyHint] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>(
    'idle',
  );

  // Sync selected provider when current provider changes
  useEffect(() => {
    if (currentProvider) {
      setSelectedProvider(currentProvider);
    }
  }, [currentProvider]);

  // Load key hint on mount
  useEffect(() => {
    getKeyLastChars().then(setKeyHint);
  }, [getKeyLastChars]);

  const handleSaveKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;

    setTestStatus('testing');
    const success = await configureProvider(selectedProvider, apiKey.trim());
    setTestStatus(success ? 'success' : 'failed');

    if (success) {
      setApiKey('');
      setShowKeyInput(false);
      const hint = await getKeyLastChars();
      setKeyHint(hint);
    }
  };

  const handleClear = () => {
    clearProvider();
    setSelectedProvider(null);
    setApiKey('');
    setShowKeyInput(false);
    setKeyHint(null);
    setTestStatus('idle');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-medium text-slate-700">AI Provider</h3>
      </div>

      {/* Provider selection */}
      <div className="space-y-2 mb-4">
        {PROVIDERS.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              setSelectedProvider(p.name);
              if (p.name !== currentProvider) {
                setShowKeyInput(true);
                setTestStatus('idle');
              }
            }}
            className={clsx(
              'w-full text-left px-3 py-2.5 rounded-lg border-2 transition-colors',
              selectedProvider === p.name
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            <div className="text-sm font-medium">{p.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{p.description}</div>
          </button>
        ))}
      </div>

      {/* API key status */}
      {currentProvider && hasKey && !showKeyInput && (
        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 mb-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-slate-600">
              API key saved {keyHint ? `(****${keyHint})` : ''}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setShowKeyInput(true);
                setTestStatus('idle');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
            >
              Change
            </button>
            <button
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-600 p-1"
              title="Remove API key"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* API key input */}
      {(showKeyInput || (!hasKey && selectedProvider)) && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                selectedProvider === 'anthropic'
                  ? 'sk-ant-...'
                  : 'AIzaSy...'
              }
              className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Get your key from{' '}
            {selectedProvider === 'anthropic' ? (
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                console.anthropic.com
              </a>
            ) : (
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                aistudio.google.com
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim() || isLoading}
              className={clsx(
                'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                apiKey.trim() && !isLoading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed',
              )}
            >
              {isLoading ? 'Testing...' : 'Test & Save'}
            </button>
            {showKeyInput && hasKey && (
              <button
                onClick={() => {
                  setShowKeyInput(false);
                  setApiKey('');
                  setTestStatus('idle');
                }}
                className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status messages */}
      {testStatus === 'success' && (
        <div className="flex items-center gap-2 mt-2 text-sm text-emerald-600">
          <Check className="w-4 h-4" />
          Connected successfully!
        </div>
      )}

      {(testStatus === 'failed' || error) && (
        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          {error || 'Connection failed. Check your API key.'}
        </div>
      )}

      {/* Gemini model selector */}
      {currentProvider === 'gemini' && hasKey && !showKeyInput && (
        <div className="mt-3">
          <h4 className="text-xs font-medium text-slate-500 mb-2">Model</h4>
          <div className="space-y-1.5">
            {GEMINI_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setGeminiModel(m.id)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg border-2 transition-colors',
                  geminiModel === m.id
                    ? 'border-blue-400 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                <div className="text-xs font-medium">{m.label}</div>
                <div className="text-[11px] text-slate-400">{m.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
