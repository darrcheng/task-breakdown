import { useState } from 'react';
import { X, Bot, Check, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { useAIProvider } from '../../hooks/useAIProvider';
import type { AIProviderName } from '../../types';

interface ProviderSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured: () => void;
}

type SetupStep = 'choose' | 'key' | 'done';

export function ProviderSetupModal({
  isOpen,
  onClose,
  onConfigured,
}: ProviderSetupModalProps) {
  const { configureProvider, isLoading, error } = useAIProvider();

  const [step, setStep] = useState<SetupStep>('choose');
  const [selectedProvider, setSelectedProvider] = useState<AIProviderName | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSelectProvider = (provider: AIProviderName) => {
    setSelectedProvider(provider);
    setStep('key');
  };

  const handleSaveKey = async () => {
    if (!selectedProvider || !apiKey.trim()) return;

    const success = await configureProvider(selectedProvider, apiKey.trim());
    if (success) {
      setStep('done');
    }
  };

  const handleComplete = () => {
    setStep('choose');
    setSelectedProvider(null);
    setApiKey('');
    onConfigured();
    onClose();
  };

  const handleClose = () => {
    setStep('choose');
    setSelectedProvider(null);
    setApiKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Set Up AI Provider
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {/* Step 1: Choose provider */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Choose an AI provider to power task breakdown. You can change
                this later in Settings.
              </p>

              <button
                onClick={() => handleSelectProvider('anthropic')}
                className="w-full text-left p-4 rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 group-hover:text-blue-700">
                      Claude{' '}
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded ml-1">
                        Recommended
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Direct browser connection. No proxy needed.
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                </div>
              </button>

              <button
                onClick={() => handleSelectProvider('gemini')}
                className="w-full text-left p-4 rounded-lg border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 group-hover:text-blue-700">
                      Gemini
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      May require a CORS proxy for browser usage.
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Enter API key */}
          {step === 'key' && selectedProvider && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">
                  Enter your{' '}
                  {selectedProvider === 'anthropic' ? 'Claude' : 'Gemini'} API
                  key.
                </p>
                <p className="text-xs text-slate-500">
                  Get it from{' '}
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
                  . Your key is encrypted before storage.
                </p>
              </div>

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
                  className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStep('choose');
                    setApiKey('');
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveKey}
                  disabled={!apiKey.trim() || isLoading}
                  className={clsx(
                    'flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    apiKey.trim() && !isLoading
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed',
                  )}
                >
                  {isLoading ? 'Testing connection...' : 'Test & Save'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-slate-800">Connected!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Your{' '}
                  {selectedProvider === 'anthropic' ? 'Claude' : 'Gemini'}{' '}
                  provider is ready.
                </p>
              </div>
              <button
                onClick={handleComplete}
                className="w-full px-4 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Breaking Down Tasks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
