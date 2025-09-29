import { useState, useCallback, useRef } from 'react';
import { KeyboardAPI } from '@/api/keyboardAPI';
import type { APIResponse } from '@/api/types';

interface GenerationState {
  readonly isGenerating: boolean;
  readonly generatedText: string | null;
  readonly error: string | null;
  readonly lastToneId: string | null;
}

interface GenerationContext {
  readonly platform?: 'twitter' | 'linkedin' | 'reddit';
  readonly replyTo?: string;
  readonly parentPost?: string;
}

interface UseGenerationResult {
  readonly state: GenerationState;
  readonly generateText: (
    content: string,
    toneId: string,
    context?: GenerationContext
  ) => Promise<void>;
  readonly clearGeneration: () => void;
  readonly retry: () => Promise<void>;
  readonly isAvailable: boolean;
}

export const useGeneration = (): UseGenerationResult => {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    generatedText: null,
    error: null,
    lastToneId: null,
  });

  const lastRequestRef = useRef<{
    readonly content: string;
    readonly toneId: string;
    readonly context?: GenerationContext;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateText = useCallback(
    async (
      content: string,
      toneId: string,
      context?: GenerationContext
    ): Promise<void> => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Store request parameters for retry functionality
      lastRequestRef.current = { content, toneId, context };

      setState(prev => ({
        ...prev,
        isGenerating: true,
        error: null,
        lastToneId: toneId,
      }));

      try {
        const response: APIResponse<{ readonly generatedText: string }> =
          await KeyboardAPI.generateTone(content, toneId, context);

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (response.success && response.data?.generatedText) {
          const { generatedText } = response.data;
          setState(prev => ({
            ...prev,
            isGenerating: false,
            generatedText,
            error: null,
          }));

          // Mark tone as used for tracking
          void KeyboardAPI.markToneUsed(toneId).catch(error => {
            console.warn('Failed to mark tone as used:', error);
          });
        } else {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: response.error ?? 'Failed to generate text',
          }));
        }
      } catch (error) {
        // Only update state if request wasn't aborted
        if (!abortControllerRef.current?.signal.aborted) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: error instanceof Error ? error.message : 'Generation failed',
          }));
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    []
  );

  const clearGeneration = useCallback((): void => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      isGenerating: false,
      generatedText: null,
      error: null,
      lastToneId: null,
    });

    lastRequestRef.current = null;
  }, []);

  const retry = useCallback(async (): Promise<void> => {
    const lastRequest = lastRequestRef.current;
    if (!lastRequest) {
      setState(prev => ({
        ...prev,
        error: 'No previous request to retry',
      }));
      return;
    }

    await generateText(
      lastRequest.content,
      lastRequest.toneId,
      lastRequest.context
    );
  }, [generateText]);

  // Check if generation service is available
  const isAvailable = !state.isGenerating;

  return {
    state,
    generateText,
    clearGeneration,
    retry,
    isAvailable,
  };
};
