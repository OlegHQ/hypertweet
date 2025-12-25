import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';
import type { AvailableModelsRes } from '../../api';

export function useModels(enabled: boolean) {
  return useQuery<AvailableModelsRes>({
    queryKey: ['models'],
    queryFn: () => api.getAvailableModels() as Promise<AvailableModelsRes>,
    enabled,
  });
}
