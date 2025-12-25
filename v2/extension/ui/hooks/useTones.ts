import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';
import type { Tone } from '../../api';

export function useTones(enabled: boolean) {
  return useQuery<Tone[]>({
    queryKey: ['tones'],
    queryFn: () => api.listTones() as Promise<Tone[]>,
    enabled,
  });
}
