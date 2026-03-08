import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase/auth';
import { startSync, stopSync, migrateLocalData } from '../firebase/sync';

interface AuthState {
  user: User | null;
  loading: boolean;
  syncing: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, syncing: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, syncing: false });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ user, loading: true, syncing: true });
        migrateLocalData(user.uid)
          .then(() => {
            startSync(user.uid);
            setState({ user, loading: false, syncing: false });
          })
          .catch((err) => {
            console.error('Sync setup failed:', err);
            setState({ user, loading: false, syncing: false });
            // App still works -- just without sync
          });
      } else {
        setState({ user: null, loading: false, syncing: false });
      }
    });
    return () => {
      stopSync();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
