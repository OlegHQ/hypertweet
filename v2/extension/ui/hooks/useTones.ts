import { useQuery } from '@tanstack/react-query';
import { api } from '../../apiProxy';

interface Tone {
	Id: string;
	Title: string;
	Instruction: string;
	IsDefault: boolean;
}

export function useTones(enabled: boolean) {
	return useQuery<Tone[]>({
		queryKey: ['tones'],
		queryFn: () => api.listTones() as Promise<Tone[]>,
		enabled,
	});
}
