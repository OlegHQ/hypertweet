import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../apiProxy';

const TOKEN_KEY = 'hypertweet.token';

export function useAuth() {
	const queryClient = useQueryClient();
	const [token, setToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		void chrome.storage.local.get(TOKEN_KEY).then((r: Record<string, unknown>) => {
			setToken((r[TOKEN_KEY] as string) || null);
			setIsLoading(false);
		});

		const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
			if (TOKEN_KEY in changes) {
				setToken((changes[TOKEN_KEY]?.newValue as string) || null);
			}
		};
		chrome.storage.local.onChanged.addListener(listener);
		return () => chrome.storage.local.onChanged.removeListener(listener);
	}, []);

	const login = useCallback((newToken: string) => setToken(newToken), []);

	const logoutMutation = useMutation({
		mutationFn: () => api.clearTokens() as Promise<void>,
		onSuccess: () => {
			setToken(null);
			queryClient.clear();
		},
	});

	return { token, isLoading, login, logout: logoutMutation.mutate };
}
