import { useState } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { signInWithGoogle } from '../../firebase/auth';

export function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const isMobile = useIsMobile();

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle(isMobile);
    } catch (err: unknown) {
      setSigningIn(false);
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        // User cancelled — not an error
        return;
      }
      if (code === 'auth/popup-blocked') {
        setError(
          'Popup was blocked by your browser. Please allow popups for this site and try again.'
        );
        return;
      }
      setError('Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-slate-800 mb-8">taskpad</h1>
        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className={`flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-lg shadow-sm hover:shadow-md hover:bg-slate-50 transition-all text-sm font-medium text-slate-700 ${
            signingIn ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {/* Google "G" logo SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          Sign in with Google
        </button>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
