import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from 'firebase/auth';
import { app } from './config';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Handle redirect result on module load (for mobile redirect flow)
export const redirectResultPromise = getRedirectResult(auth).catch(
  (error: { code: string; message: string }) => {
    console.error('Redirect sign-in error:', error.code, error.message);
    return null;
  }
);

export async function signInWithGoogle(useRedirect: boolean): Promise<void> {
  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
  } else {
    await signInWithPopup(auth, googleProvider);
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
