import React from "react";
import { colors } from "./styles";

export interface LinkButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  loadingText?: string;
}

export function LinkButton({
  children,
  disabled = false,
  onClick,
  className = "",
  style = {},
  loading = false,
  loadingText = "Loading...",
}: LinkButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        color: colors.twitter.blue,
        fontWeight: "500",
        textDecoration: "underline",
        textDecorationThickness: "2px",
        textUnderlineOffset: "2px",
        transition: "opacity 0.15s",
        background: "none",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = "0.8";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = "1";
        }
      }}
    >
      {loading ? loadingText : children}
    </button>
  );
}
