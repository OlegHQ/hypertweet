import React from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  const baseStyle: ButtonStyle = {
    padding: "3px 8px",
    borderRadius: "9999px",
    fontSize: "13px",
    fontWeight: 500,
    border: "1px solid rgba(83, 100, 113, 0.5)",
    backgroundColor: "transparent",
    color: "rgb(29, 155, 240)",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  return (
    <motion.button
      disabled={disabled}
      style={baseStyle}
      className={className}
      onClick={onClick}
      initial={false}
      animate={{
        scale: disabled ? 0.98 : 1,
        backgroundColor: disabled ? "rgba(29, 155, 240, 0.05)" : "transparent",
      }}
      whileHover={
        !disabled
          ? {
              scale: 1.02,
              backgroundColor: "rgba(29, 155, 240, 0.1)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
              },
            }
          : {}
      }
      whileTap={
        !disabled
          ? {
              scale: 0.96,
              backgroundColor: "rgba(29, 155, 240, 0.2)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 20,
              },
            }
          : {}
      }
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={loading ? "loading" : "content"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 0.5,
          }}
        >
          {loading ? loadingText : children}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
