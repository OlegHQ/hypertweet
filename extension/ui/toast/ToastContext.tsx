import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { ToastContainer } from './ToastContainer';
import { setToastHandler } from '../query';
import type { Toast, ToastOptions, ToastContextValue } from './types';

const MAX_TOASTS = 5;
const DEFAULT_DURATION = 5000;

export const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: React.ReactNode;
}

let toastIdCounter = 0;

export function ToastProvider({
  children,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: ToastOptions) => {
      const id = `toast-${++toastIdCounter}`;
      const duration = options.duration ?? DEFAULT_DURATION;
      const toast: Toast = {
        id,
        message: options.message,
        variant: options.variant ?? 'default',
        duration,
      };
      if (options.title !== undefined) toast.title = options.title;

      setToasts(prev => {
        const next = [...prev, toast];
        // Remove oldest if exceeding max
        if (next.length > MAX_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              window.clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      // Auto-remove after duration
      if (duration > 0) {
        const timer = window.setTimeout(() => {
          removeToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [removeToast]
  );

  // Register toast handler for global error handling
  useEffect(() => {
    setToastHandler(addToast);
    return () => setToastHandler(null);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
