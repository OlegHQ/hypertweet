import { QueryClient, MutationCache } from '@tanstack/react-query';
import type { ToastOptions } from './toast/types';

// Toast ref for global error handling (set by ToastProvider)
type ToastAddFn = (options: ToastOptions) => void;
let toastAddFn: ToastAddFn | null = null;

export function setToastHandler(fn: ToastAddFn | null): void {
  toastAddFn = fn;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    onError: (error: Error) => {
      if (toastAddFn) {
        toastAddFn({
          message: error.message || 'Something went wrong',
          variant: 'error',
        });
      }
    },
  }),
});
