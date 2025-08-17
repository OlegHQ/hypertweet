import React from "react";
import { bubbleButtonStyles, colors } from "./styles";

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
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        ...bubbleButtonStyles.base,
        ...(isDark ? bubbleButtonStyles.dark : {}),
        ...(disabled ? bubbleButtonStyles.disabled : {}),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, bubbleButtonStyles.hover);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = isDark ? (bubbleButtonStyles.dark.borderColor || colors.gray[700]) : colors.gray[200];
        }
      }}
    >
      {loading ? loadingText : children}
    </button>
  );
} 