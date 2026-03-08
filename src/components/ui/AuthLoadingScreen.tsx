import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingScreenProps {
  message?: string;
}

export function AuthLoadingScreen({ message }: AuthLoadingScreenProps) {
  const [showSpinner, setShowSpinner] = useState(!!message);

  useEffect(() => {
    if (message) {
      setShowSpinner(true);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), 2000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="text-2xl font-semibold text-slate-800">taskpad</span>
        <div
          className={`transition-opacity duration-300 ${showSpinner ? 'opacity-100' : 'opacity-0'}`}
        >
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
        {message && (
          <p className="text-sm text-slate-500">{message}</p>
        )}
      </div>
    </div>
  );
}
