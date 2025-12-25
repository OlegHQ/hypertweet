import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { tokens } from '../tokens';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}

const MODAL_CONTAINER_ID = 'hypertweet-modal-root';
const MODAL_STYLES_ID = 'hypertweet-modal-styles';

// Inject global styles for modal with !important
function injectModalStyles(): void {
  if (document.getElementById(MODAL_STYLES_ID)) return;

  const style = document.createElement('style');
  style.id = MODAL_STYLES_ID;
  style.textContent = `
    #${MODAL_CONTAINER_ID} {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    }
    #${MODAL_CONTAINER_ID}[data-open="true"] {
      pointer-events: auto !important;
    }
    .ht-modal-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: ${tokens.colors.overlay} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 2147483647 !important;
      pointer-events: auto !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .ht-modal-content {
      background: ${tokens.colors.card} !important;
      border-radius: ${tokens.radius.lg} !important;
      border: 1px solid ${tokens.colors.border} !important;
      box-shadow: ${tokens.shadow.xl} !important;
      padding: ${tokens.spacing[6]} !important;
      width: 100% !important;
      max-width: 400px !important;
      margin: ${tokens.spacing[4]} !important;
      box-sizing: border-box !important;
      color: ${tokens.colors.foreground} !important;
      font-family: ${tokens.font.sans} !important;
    }
    .ht-modal-content-wide {
      max-width: 500px !important;
    }
  `;
  document.head.appendChild(style);
}

function getOrCreateContainer(): HTMLDivElement {
  injectModalStyles();
  let container = document.getElementById(
    MODAL_CONTAINER_ID
  ) as HTMLDivElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = MODAL_CONTAINER_ID;
    container.setAttribute('data-open', 'false');
    document.body.appendChild(container);
  }
  return container;
}

export function Modal({
  isOpen,
  onClose,
  children,
  wide = false,
}: ModalProps): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    containerRef.current = getOrCreateContainer();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-open', isOpen ? 'true' : 'false');
    }
  }, [isOpen]);

  if (!mounted) {
    containerRef.current = getOrCreateContainer();
  }

  if (!containerRef.current) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="ht-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className={`ht-modal-content ${wide ? 'ht-modal-content-wide' : ''}`}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    containerRef.current
  );
}
