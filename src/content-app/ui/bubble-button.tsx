import React from "react";
import { cn } from "src/ui/library/utils";

export interface BubbleButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  loadingText?: string;
}

export function BubbleButton({
  children,
  disabled = false,
  onClick,
  className = "",
  loading = false,
  loadingText = "Loading...",
}: BubbleButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full px-2 py-1",
        "border border-gray-200 dark:border-gray-700",
        "bg-transparent hover:bg-[#1d9bf0]/10",
        "text-[#1d9bf0] dark:text-[#1d9bf0]",
        "font-medium transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "hover:border-[#1d9bf0]/20",
        className
      )}
    >
      {loading ? loadingText : children}
    </button>
  );
} 