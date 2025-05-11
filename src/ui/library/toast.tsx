import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const variantStyles = {
  success: {
    container:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    text: "text-green-700 dark:text-green-300",
    icon: "text-green-600 dark:text-green-400",
    Icon: CheckCircle2,
  },
  error: {
    container:
      "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
    Icon: XCircle,
  },
};

export function Toast({ message, variant = "success", onClose }: ToastProps) {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`absolute -top-2 right-0 ${styles.container} rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg`}
      >
        <Icon className={`h-4 w-4 ${styles.icon}`} />
        <span className={`text-sm ${styles.text}`}>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
