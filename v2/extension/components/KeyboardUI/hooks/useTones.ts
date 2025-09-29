import { useState, useCallback, useEffect, useRef } from 'react';
import { KeyboardAPI } from '@/api/keyboardAPI';
import type {
  Tone,
  ToneSearchCriteria,
  PaginatedAPIResponse,
} from '@/api/types';

interface TonesState {
  readonly tones: readonly Tone[];
  readonly recentTones: readonly Tone[];
  readonly suggestedTones: readonly Tone[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly searchQuery: string;
  readonly selectedTone: Tone | null;
  readonly hasMore: boolean;
}

interface UseTonesToneResult {
  readonly state: TonesState;
  readonly searchTones: (criteria: ToneSearchCriteria) => Promise<void>;
  readonly loadRecentTones: () => Promise<void>;
  readonly getSuggestions: (
    content: string,
    context?: {
      readonly platform?: 'twitter' | 'linkedin' | 'reddit';
      readonly sentiment?: 'positive' | 'negative' | 'neutral';
    }
  ) => Promise<void>;
  readonly selectTone: (tone: Tone) => void;
  readonly clearSelection: () => void;
  readonly clearSearch: () => void;
  readonly refreshTones: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RECENT_TONES_LIMIT = 10;

interface CacheEntry<T> {
  readonly data: T;
  readonly timestamp: number;
}

export const useKeyboardTones = (): UseTonesToneResult => {
  const [state, setState] = useState<TonesState>({
    tones: [],
    recentTones: [],
    suggestedTones: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    selectedTone: null,
    hasMore: false,
  });

  const cacheRef = useRef<Map<string, CacheEntry<readonly Tone[]>>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback((criteria: ToneSearchCriteria): string => {
    return JSON.stringify({
      query: criteria.query ?? '',
      category: criteria.category ?? '',
      sortBy: criteria.sortBy ?? 'name',
      sortOrder: criteria.sortOrder ?? 'asc',
    });
  }, []);

  const isCacheValid = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  const searchTones = useCallback(
    async (criteria: ToneSearchCriteria): Promise<void> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const cacheKey = getCacheKey(criteria);
      const cachedEntry = cacheRef.current.get(cacheKey);

      // Return cached data if valid
      if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
        setState(prev => ({
          ...prev,
          tones: cachedEntry.data,
          searchQuery: criteria.query ?? '',
          error: null,
          hasMore: cachedEntry.data.length >= 10, // Assume more if we got full page
        }));
        return;
      }

      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        searchQuery: criteria.query ?? '',
      }));

      try {
        const response: PaginatedAPIResponse<Tone> =
          await KeyboardAPI.searchTones({
            ...criteria,
            limit: 20, // Reasonable limit for keyboard UI
          });

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.success && response.data && Array.isArray(response.data)) {
          // Cache the results
          cacheRef.current.set(cacheKey, {
            data: response.data,
            timestamp: Date.now(),
          });

          setState(prev => ({
            ...prev,
            tones: response.data as readonly Tone[],
            isLoading: false,
            error: null,
            hasMore: response.pagination?.hasNext ?? false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: response.error ?? 'Failed to search tones',
          }));
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Search failed',
          }));
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [getCacheKey, isCacheValid]
  );

  const loadRecentTones = useCallback(async (): Promise<void> => {
    const cacheKey = 'recent_tones';
    const cachedEntry = cacheRef.current.get(cacheKey);

    // Return cached recent tones if valid
    if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
      setState(prev => ({
        ...prev,
        recentTones: cachedEntry.data,
      }));
      return;
    }

    try {
      const response = await KeyboardAPI.getRecentTones(RECENT_TONES_LIMIT);

      if (response.success && response.data && Array.isArray(response.data)) {
        // Cache recent tones with shorter duration (1 minute)
        cacheRef.current.set(cacheKey, {
          data: response.data,
          timestamp: Date.now(),
        });

        setState(prev => ({
          ...prev,
          recentTones: response.data as readonly Tone[],
        }));
      }
    } catch (error) {
      console.warn('Failed to load recent tones:', error);
    }
  }, [isCacheValid]);

  const getSuggestions = useCallback(
    async (
      content: string,
      context?: {
        readonly platform?: 'twitter' | 'linkedin' | 'reddit';
        readonly sentiment?: 'positive' | 'negative' | 'neutral';
      }
    ): Promise<void> => {
      if (!content.trim()) {
        setState(prev => ({
          ...prev,
          suggestedTones: [],
        }));
        return;
      }

      try {
        const response = await KeyboardAPI.getToneSuggestions(content, context);

        if (response.success && response.data && Array.isArray(response.data)) {
          setState(prev => ({
            ...prev,
            suggestedTones: response.data as readonly Tone[],
          }));
        }
      } catch (error) {
        console.warn('Failed to get tone suggestions:', error);
        setState(prev => ({
          ...prev,
          suggestedTones: [],
        }));
      }
    },
    []
  );

  const selectTone = useCallback((tone: Tone): void => {
    setState(prev => ({
      ...prev,
      selectedTone: tone,
    }));

    // Mark tone as used in the background
    void KeyboardAPI.markToneUsed(tone.id).catch(error => {
      console.warn('Failed to mark tone as used:', error);
    });
  }, []);

  const clearSelection = useCallback((): void => {
    setState(prev => ({
      ...prev,
      selectedTone: null,
    }));
  }, []);

  const clearSearch = useCallback((): void => {
    setState(prev => ({
      ...prev,
      tones: [],
      searchQuery: '',
      error: null,
      hasMore: false,
    }));

    // Clear search cache
    cacheRef.current.forEach((_, key) => {
      if (key !== 'recent_tones') {
        cacheRef.current.delete(key);
      }
    });
  }, []);

  const refreshTones = useCallback(async (): Promise<void> => {
    // Clear all caches
    cacheRef.current.clear();

    // Reload recent tones and current search if any
    await loadRecentTones();

    if (state.searchQuery) {
      await searchTones({ query: state.searchQuery });
    }
  }, [loadRecentTones, searchTones, state.searchQuery]);

  // Load recent tones on mount
  useEffect(() => {
    void loadRecentTones();
  }, [loadRecentTones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    state,
    searchTones,
    loadRecentTones,
    getSuggestions,
    selectTone,
    clearSelection,
    clearSearch,
    refreshTones,
  };
};
