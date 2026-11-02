import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'auth-demo';

interface AuthState {
  email: string | null;
}

const DEFAULT_STATE: AuthState = { email: null };

function readAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

// Demo-only: there's no real backend yet, so "signing in" just remembers an
// email locally - it doesn't verify anything, send a magic link, or create
// a real account. Swap for Supabase Auth (or similar) once a backend
// exists; every other screen in the app works fine without ever calling
// login(), by design - this is opt-in, not required to use the app.
export function useAuth() {
  const [state, setState] = useState<AuthState>(readAuth);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const login = useCallback((email: string) => {
    setState({ email });
  }, []);

  const logout = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  return { email: state.email, isLoggedIn: state.email !== null, login, logout };
}
