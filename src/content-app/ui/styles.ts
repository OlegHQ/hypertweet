// CSS-in-JS styles for content-level UI components
// This replaces Tailwind CSS to avoid conflicts with host pages

export const colors = {
  primary: {
    DEFAULT: "#0ea5e9",
    50: "#f0f9ff",
    100: "#e0f2fe",
    200: "#bae6fd",
    300: "#7dd3fc",
    400: "#38bdf8",
    500: "#0ea5e9",
    600: "#0284c7",
    700: "#0369a1",
    800: "#075985",
    900: "#0c4a6e",
    950: "#082f49",
  },
  secondary: {
    DEFAULT: "#64748b",
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
    950: "#020617",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
    950: "#030712",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  twitter: {
    blue: "#1d9bf0",
    blueDark: "#1a8cd8",
    blueLight: "rgba(29, 155, 240, 0.1)",
    blueLighter: "rgba(29, 155, 240, 0.2)",
  },
};

export const spacing = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
};

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

export const fontSize = {
  xs: { size: "0.75rem", lineHeight: "1rem" },
  sm: { size: "0.875rem", lineHeight: "1.25rem" },
  base: { size: "1rem", lineHeight: "1.5rem" },
  lg: { size: "1.125rem", lineHeight: "1.75rem" },
  xl: { size: "1.25rem", lineHeight: "1.75rem" },
  "2xl": { size: "1.5rem", lineHeight: "2rem" },
  "3xl": { size: "1.875rem", lineHeight: "2.25rem" },
  "4xl": { size: "2.25rem", lineHeight: "2.5rem" },
  "5xl": { size: "3rem", lineHeight: "1" },
  "6xl": { size: "3.75rem", lineHeight: "1" },
  "7xl": { size: "4.5rem", lineHeight: "1" },
  "8xl": { size: "6rem", lineHeight: "1" },
  "9xl": { size: "8rem", lineHeight: "1" },
};

// Utility function to combine styles conditionally
export function cx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Common component styles
export const buttonStyles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    fontWeight: "500",
    transition: "all 0.2s",
    cursor: "pointer",
    outline: "none",
    border: "none",
    userSelect: "none" as const,
  },
  sizes: {
    sm: {
      height: spacing[8],
      padding: `0 ${spacing[3]}`,
    },
    md: {
      height: spacing[10],
      padding: `0 ${spacing[4]}`,
    },
    lg: {
      height: spacing[11],
      padding: `0 ${spacing[8]}`,
    },
  },
  variants: {
    primary: {
      backgroundColor: colors.primary[500],
      color: "white",
      "&:hover": {
        backgroundColor: colors.primary[600],
      },
      "&:active": {
        backgroundColor: colors.primary[700],
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
    secondary: {
      backgroundColor: colors.secondary[100],
      color: colors.secondary[900],
      "&:hover": {
        backgroundColor: colors.secondary[200],
      },
      "&:active": {
        backgroundColor: colors.secondary[300],
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
    outline: {
      backgroundColor: "transparent",
      color: colors.secondary[600],
      border: `1px solid ${colors.secondary[200]}`,
      "&:hover": {
        backgroundColor: colors.secondary[50],
      },
      "&:active": {
        backgroundColor: colors.secondary[100],
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.secondary[600],
      "&:hover": {
        backgroundColor: colors.secondary[100],
      },
      "&:active": {
        backgroundColor: colors.secondary[200],
      },
      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
  },
};

// Panel styles
export const panelStyles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "white",
  },
  containerTwitter: {
    paddingLeft: "40px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing[2],
    padding: `${spacing[2]} ${spacing[4]}`,
    borderBottom: `1px solid ${colors.gray[200]}`,
  },
  content: {
    flex: 1,
    overflow: "auto",
  },
};

// Bubble button styles
export const bubbleButtonStyles = {
  base: {
    borderRadius: borderRadius.full,
    padding: `${spacing[1]} ${spacing[2]}`,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    border: `1px solid ${colors.gray[200]}`,
    backgroundColor: "transparent",
    color: colors.twitter.blue,
    fontWeight: "500",
    transition: "all 0.15s",
    cursor: "pointer",
    outline: "none",
    userSelect: "none" as const,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
  },
  hover: {
    backgroundColor: colors.twitter.blueLight,
    borderColor: `${colors.twitter.blue}33`,
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  dark: {
    borderColor: colors.gray[700],
  },
};

// Action button styles
export const actionButtonStyles = {
  base: {
    color: colors.twitter.blue,
    padding: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
  },
  hover: {
    opacity: 0.8,
    backgroundColor: colors.blue[50],
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
};

// Complex mode panel styles
export const complexPanelStyles = {
  container: {
    borderTop: `1px solid ${colors.gray[200]}`,
    maxWidth: "600px",
  },
  containerDark: {
    borderTopColor: colors.gray[800],
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: `${spacing[1.5]} ${spacing[3]}`,
  },
  buttonContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing[2],
  },
  buttonScroll: {
    position: "relative" as const,
  },
  buttonWrapper: {
    display: "flex",
    alignItems: "center",
    gap: spacing[0.5],
    overflowX: "auto" as const,
    scrollbarWidth: "thin" as const,
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: spacing[0.5],
    paddingRight: spacing[1],
    paddingBottom: spacing[5],
  },
  taskButton: {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: borderRadius.full,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    whiteSpace: "nowrap" as const,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    color: colors.secondary[700],
  },
  taskButtonHover: {
    backgroundColor: colors.gray[100],
  },
  taskButtonHoverDark: {
    backgroundColor: colors.gray[800],
  },
  taskButtonActive: {
    backgroundColor: colors.blue[50],
    color: colors.blue[700],
  },
  taskButtonActiveDark: {
    backgroundColor: colors.blue[950],
    color: colors.blue[300],
  },
  variantSelect: {
    display: "flex",
    alignItems: "center",
    gap: spacing[1],
  },
  variantsList: {
    padding: spacing[3],
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing[2],
  },
  variantItem: {
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.gray[200]}`,
    backgroundColor: colors.gray[50],
    cursor: "pointer",
    transition: "all 0.15s",
  },
  variantItemHover: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
  },
  variantItemDark: {
    borderColor: colors.gray[700],
    backgroundColor: colors.gray[800],
  },
  variantItemHoverDark: {
    backgroundColor: colors.gray[700],
    borderColor: colors.gray[600],
  },
  variantText: {
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    color: colors.secondary[700],
  },
  variantTextDark: {
    color: colors.secondary[200],
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[8],
  },
  loadingSpinner: {
    animation: "spin 1s linear infinite",
  },
};

// Reply types panel styles
export const replyTypesPanelStyles = {
  container: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: spacing[2],
    padding: spacing[3],
  },
  button: {
    ...bubbleButtonStyles.base,
  },
  buttonHover: {
    ...bubbleButtonStyles.hover,
  },
  buttonDisabled: {
    ...bubbleButtonStyles.disabled,
  },
};

// Model selector styles
export const modelSelectorStyles = {
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray[200]}`,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    padding: `${spacing[2]} ${spacing[3]}`,
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "120px",
    transition: "all 0.15s",
  },
  triggerHover: {
    backgroundColor: colors.gray[50],
  },
  triggerDark: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[700],
    color: colors.gray[100],
  },
  content: {
    backgroundColor: "white",
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.gray[200]}`,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    zIndex: 50,
  },
  contentDark: {
    backgroundColor: colors.gray[800],
    borderColor: colors.gray[700],
  },
  item: {
    display: "flex",
    alignItems: "center",
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: fontSize.sm.size,
    lineHeight: fontSize.sm.lineHeight,
    cursor: "pointer",
    outline: "none",
    userSelect: "none" as const,
    transition: "all 0.15s",
  },
  itemHover: {
    backgroundColor: colors.gray[100],
  },
  itemHoverDark: {
    backgroundColor: colors.gray[700],
  },
};

// Add CSS animation keyframes to document
export function injectGlobalStyles() {
  const styleId = "hypertweet-global-styles";
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .hypertweet-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    .hypertweet-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .hypertweet-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${colors.gray[300]};
      border-radius: ${borderRadius.full};
    }
    
    .hypertweet-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${colors.gray[400]};
    }
    
    @media (prefers-color-scheme: dark) {
      .hypertweet-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${colors.gray[600]};
      }
      
      .hypertweet-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: ${colors.gray[500]};
      }
    }
  `;
  document.head.appendChild(style);
}