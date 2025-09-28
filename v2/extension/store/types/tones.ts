import type { Tone, ToneFormData, ToneSearchCriteria } from '@/api/types';

export interface TonesState {
  readonly tones: readonly Tone[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly searchCriteria: ToneSearchCriteria;
}

export type TonesAction =
  | { type: 'FETCH_TONES_START' }
  | { type: 'FETCH_TONES_SUCCESS'; payload: readonly Tone[] }
  | { type: 'FETCH_TONES_FAILURE'; payload: string }
  | { type: 'CREATE_TONE_SUCCESS'; payload: Tone }
  | { type: 'UPDATE_TONE_SUCCESS'; payload: Tone }
  | { type: 'DELETE_TONE_SUCCESS'; payload: string }
  | { type: 'SET_SEARCH_CRITERIA'; payload: ToneSearchCriteria };

export interface TonesContextType {
  readonly tonesState: TonesState;
  readonly getTones: (criteria?: ToneSearchCriteria) => Promise<void>;
  readonly createTone: (data: ToneFormData) => Promise<void>;
  readonly updateTone: (
    id: string,
    data: Partial<ToneFormData>
  ) => Promise<void>;
  readonly deleteTone: (id: string) => Promise<void>;
  readonly favoriteTone: (id: string, isFavorite: boolean) => Promise<void>;
  readonly setSearchCriteria: (criteria: ToneSearchCriteria) => void;
}
