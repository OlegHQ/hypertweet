import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';
import type { ApiToken, ListApiTokensRes } from '../../api';

export function useApiTokens(enabled: boolean) {
  return useQuery<ApiToken[]>({
    queryKey: ['apiTokens'],
    queryFn: async () => {
      const res = (await api.listApiTokens()) as ListApiTokensRes;
      const tokens = res.tokens;
      return Array.isArray(tokens) ? tokens : [];
    },
    enabled,
  });
}
