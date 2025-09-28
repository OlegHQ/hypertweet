import { useEffect, useCallback } from 'react';

type KeyHandler = (event: KeyboardEvent) => void;

interface KeyHandlerMap {
  [key: string]: KeyHandler;
}

export const useKeyboard = (
  keyHandlers: KeyHandlerMap,
  target: HTMLElement | null = document.body
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const handler = keyHandlers[event.key];
      if (handler) {
        handler(event);
      }
    },
    [keyHandlers]
  );

  useEffect(() => {
    if (!target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [target, handleKeyDown]);
};
