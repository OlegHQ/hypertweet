import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  token: string | null;
  isLoading: boolean;
}

interface UseAuthReturn extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = 'hypertweet.token';

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    void chrome.storage.local
      .get(STORAGE_KEY)
      .then((result: Record<string, unknown>) => {
        const token = result[STORAGE_KEY] as string | undefined;
        setState({ token: token ?? null, isLoading: false });
      });

    const listener = (
      changes: Record<string, chrome.storage.StorageChange>
    ) => {
      if (STORAGE_KEY in changes) {
        const newToken = changes[STORAGE_KEY]?.newValue as string | undefined;
        setState(prev => ({ ...prev, token: newToken ?? null }));
      }
    };

    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  const login = useCallback(async (token: string): Promise<void> => {
    await chrome.storage.local.set({ [STORAGE_KEY]: token });
    setState(prev => ({ ...prev, token }));
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await chrome.storage.local.remove(STORAGE_KEY);
    setState(prev => ({ ...prev, token: null }));
  }, []);

  return { ...state, login, logout };
}
