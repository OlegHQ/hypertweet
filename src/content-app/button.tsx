import React, { useState } from "react";

export interface ButtonStyle {
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: number;
  border: string;
  backgroundColor: string;
  color: string;
  transition: string;
  cursor: string;
  whiteSpace: "nowrap";
  letterSpacing: string;
  opacity: number;
}

export interface ButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: Partial<ButtonStyle>;
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  children,
  disabled = false,
  onClick,
  className = "",
  style = {},
  loading = false,
  loadingText = "Loading...",
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const baseStyle: ButtonStyle = {
    padding: "3px 8px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid rgba(83, 100, 113, 0.5)",
    backgroundColor: isActive
      ? "rgba(29, 155, 240, 0.2)"
      : isHovered
      ? "rgba(29, 155, 240, 0.1)"
      : "transparent",
    color: "rgb(29, 155, 240)",
    transition: "background-color 0.2s",
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <button
      disabled={disabled}
      style={baseStyle}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsActive(false);
      }}
      onMouseDown={() => setIsActive(true)}
      onMouseUp={() => setIsActive(false)}
      onClick={onClick}
    >
      {loading ? loadingText : children}
    </button>
  );
} 
