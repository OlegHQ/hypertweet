import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { Toast } from './Toast';
import { tokens, cssVars } from '../tokens';
import type { Toast as ToastType } from './types';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const TOAST_CONTAINER_ID = 'hypertweet-toast-root';
const TOAST_STYLES_ID = 'hypertweet-toast-styles';

function injectToastStyles(): void {
  if (document.getElementById(TOAST_STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = TOAST_STYLES_ID;
  style.textContent = `
    #${TOAST_CONTAINER_ID} {
      position: fixed !important;
      bottom: 16px !important;
      right: 16px !important;
      z-index: 2147483646 !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 8px !important;
      pointer-events: none !important;
      font-family: ${tokens.font.sans} !important;
    }
    .ht-toast {
      pointer-events: auto !important;
      display: flex !important;
      align-items: flex-start !important;
      gap: 12px !important;
      padding: 12px 16px !important;
      background: var(${cssVars.card}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.lg} !important;
      box-shadow: ${tokens.shadow.lg} !important;
      min-width: 300px !important;
      max-width: 400px !important;
      color: var(${cssVars.foreground}) !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      line-height: ${tokens.font.lineHeight.normal} !important;
    }
    .ht-toast-default {
      border-color: var(${cssVars.border}) !important;
    }
    .ht-toast-error {
      border-color: var(${cssVars.destructive}) !important;
      background: rgba(239, 68, 68, 0.1) !important;
    }
    .ht-toast-success {
      border-color: var(${cssVars.success}) !important;
      background: rgba(34, 197, 94, 0.1) !important;
    }
    .ht-toast-icon {
      flex-shrink: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 2px !important;
    }
    .ht-toast-icon-default {
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-toast-icon-error {
      color: var(${cssVars.destructive}) !important;
    }
    .ht-toast-icon-success {
      color: var(${cssVars.success}) !important;
    }
    .ht-toast-content {
      flex: 1 !important;
      min-width: 0 !important;
    }
    .ht-toast-title {
      font-weight: ${tokens.font.weight.medium} !important;
      margin: 0 0 2px 0 !important;
      padding: 0 !important;
      color: var(${cssVars.foreground}) !important;
      font-size: ${tokens.font.size.sm} !important;
      line-height: ${tokens.font.lineHeight.tight} !important;
    }
    .ht-toast-message {
      margin: 0 !important;
      padding: 0 !important;
      color: var(${cssVars.mutedForeground}) !important;
      font-size: ${tokens.font.size.sm} !important;
      line-height: ${tokens.font.lineHeight.normal} !important;
    }
    .ht-toast-close {
      flex-shrink: 0 !important;
      background: transparent !important;
      border: none !important;
      padding: 4px !important;
      margin: -4px -4px -4px 0 !important;
      cursor: pointer !important;
      color: var(${cssVars.mutedForeground}) !important;
      border-radius: ${tokens.radius.sm} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: color ${tokens.transition.fast}, background ${tokens.transition.fast} !important;
    }
    .ht-toast-close:hover {
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.muted}) !important;
    }
  `;
  document.head.appendChild(style);
}

function getOrCreateContainer(): HTMLDivElement {
  injectToastStyles();
  let container = document.getElementById(
    TOAST_CONTAINER_ID
  ) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    document.body.appendChild(container);
  }
  return container;
}

export function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    containerRef.current = getOrCreateContainer();
    setMounted(true);
  }, []);

  if (!mounted) {
    containerRef.current = getOrCreateContainer();
  }

  if (!containerRef.current) return null;

  return createPortal(
    <AnimatePresence mode="popLayout">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </AnimatePresence>,
    containerRef.current
  );
}
