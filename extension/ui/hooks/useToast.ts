import { useContext, useCallback } from 'react';
import { ToastContext } from '../toast/ToastContext';
import type { ToastOptions } from '../toast/types';

interface UseToastReturn {
  toast: (options: ToastOptions) => void;
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
}

export function useToast(): UseToastReturn {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const toast = useCallback(
    (options: ToastOptions) => {
      context.addToast(options);
    },
    [context]
  );

  const error = useCallback(
    (message: string, title?: string) => {
      const options: ToastOptions = { message, variant: 'error' };
      if (title !== undefined) options.title = title;
      context.addToast(options);
    },
    [context]
  );

  const success = useCallback(
    (message: string, title?: string) => {
      const options: ToastOptions = { message, variant: 'success' };
      if (title !== undefined) options.title = title;
      context.addToast(options);
    },
    [context]
  );

  return { toast, error, success };
}
