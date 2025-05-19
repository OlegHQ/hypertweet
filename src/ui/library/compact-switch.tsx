import * as React from "react";
import { cn } from "./utils";

interface CompactSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function CompactSwitch({
  checked,
  onCheckedChange,
  label,
  className,
}: CompactSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        checked
          ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
          : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800",
        className
      )}
    >
      <div
        className={cn(
          "h-4 w-7 rounded-full transition-colors",
          checked
            ? "bg-primary-500 dark:bg-primary-600"
            : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-3" : "translate-x-0"
          )}
        />
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );
} 