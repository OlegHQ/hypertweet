import React from "react";
import { cn } from "src/ui/library/utils";

export interface ButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  children,
  disabled = false,
  onClick,
  className = "",
  loading = false,
  loadingText = "Loading...",
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-[#1d9bf0] font-medium underline decoration-2 underline-offset-2",
        "hover:opacity-80 transition-opacity",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
        >
          {loading ? loadingText : children}
    </button>
  );
}
