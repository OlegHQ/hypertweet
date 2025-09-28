import { useState, useCallback } from 'react';
import { RetryStrategy } from '@/api/errors';
import type { RetryConfig } from '@/api/types';

export const useRetry = <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attempts, setAttempts] = useState(0);

  const retry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    setAttempts(0);

    const retryConfig = { ...RetryStrategy.createDefault(), ...config };

    try {
      const result = await RetryStrategy.executeWithRetry(async () => {
        setAttempts(prev => prev + 1);
        return await operation();
      }, retryConfig);
      setIsRetrying(false);
      return result;
    } catch (e) {
      setError(e as Error);
      setIsRetrying(false);
      throw e;
    }
  }, [operation, config]);

  return { isRetrying, error, attempts, retry };
};
