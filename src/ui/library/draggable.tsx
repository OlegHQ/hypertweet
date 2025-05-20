import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import { cn } from "./utils";

interface DraggableContextType {
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent) => void;
}

const DraggableContext = createContext<DraggableContextType | null>(null);

interface DraggableProps {
  children: React.ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

interface DraggableTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const DraggableTrigger = ({ children, className }: DraggableTriggerProps) => {
  const context = useContext(DraggableContext);
  if (!context) {
    throw new Error("DraggableTrigger must be used within a Draggable component");
  }

  return (
    <div
      className={cn(
        "cursor-grab",
        context.isDragging && "cursor-grabbing",
        className
      )}
      onMouseDown={context.onDragStart}
    >
      {children}
    </div>
  );
};

export default function Draggable({
  children,
  className,
  initialPosition = { x: 0, y: 0 },
  onDragStart,
  onDragEnd,
}: DraggableProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return;

      const rect = dragRef.current.getBoundingClientRect();
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      elementStartPos.current = { x: rect.left, y: rect.top };

      setIsDragging(true);
      onDragStart?.();

      // Prevent text selection while dragging
      e.preventDefault();
    },
    [onDragStart]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;

      setPosition({
        x: elementStartPos.current.x + dx,
        y: elementStartPos.current.y + dy,
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <DraggableContext.Provider value={{ isDragging, onDragStart: handleMouseDown }}>
      <div
        ref={dragRef}
        className={cn(
          "absolute",
          className
        )}
        style={{
          left: position.x,
          top: position.y,
          userSelect: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </DraggableContext.Provider>
  );
}
