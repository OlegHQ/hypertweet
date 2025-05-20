import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";
import Draggable, { DraggableTrigger } from "./draggable";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showBackdrop?: boolean;
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  showBackdrop = true,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-lg", className)}>
      <DraggableTrigger>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
          <h3 className="text-lg font-medium">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </DraggableTrigger>
      <div className="p-4 bg-white dark:bg-gray-800 rounded-b-lg">
        {children}
      </div>
    </div>
  );

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50",
        !showBackdrop && "pointer-events-none"
      )}
    >
      {showBackdrop && (
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      )}
      <div className={cn(
        "relative",
        !showBackdrop ? "pointer-events-auto" : ""
      )}>
        <Draggable
          initialPosition={{
            x: window.innerWidth / 2 - 160,
            y: window.innerHeight / 2 - 100,
          }}
        >
          {modalContent}
        </Draggable>
      </div>
    </div>,
    document.body
  );
} 