import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';
import type { ProfileRes } from '../../api';

export function useProfile(enabled: boolean) {
  return useQuery<ProfileRes>({
    queryKey: ['profile'],
    queryFn: () => api.getProfile() as Promise<ProfileRes>,
    enabled,
  });
}
