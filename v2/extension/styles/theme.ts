/**
 * Complete design system and theme configuration for Chrome extension
 */

/**
 * Color palette with semantic naming and accessibility considerations
 */
export const colors = {
  // Primary Chrome blue palette
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#4285F4', // Main Chrome blue
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Neutral gray palette for secondary elements
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280', // Secondary gray
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic colors for states and feedback
  semantic: {
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171',
      500: '#EF4444', // Main error red
      600: '#DC2626',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981', // Main success green
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B', // Main warning amber
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
    },
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Info blue
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
  },
} as const;

/**
 * Typography system with modular scale and system font stack
 */
export const typography = {
  // Font families optimized for cross-platform compatibility
  fontFamily: {
    sans: [
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ].join(', '),
    mono: [
      '"SF Mono"',
      'Monaco',
      '"Cascadia Code"',
      '"Roboto Mono"',
      'Consolas',
      '"Liberation Mono"',
      '"Menlo"',
      'monospace',
    ].join(', '),
  },

  // Modular scale for consistent typography sizing
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  // Font weights for hierarchy and emphasis
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights for optimal readability
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing for different text styles
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Spacing system based on 4px grid for consistent layout
 */
export const spacing = {
  0: '0px',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
  40: '10rem', // 160px
  48: '12rem', // 192px
  56: '14rem', // 224px
  64: '16rem', // 256px
} as const;

/**
 * Border radius system for consistent component styling
 */
export const borderRadius = {
  none: '0px',
  xs: '0.125rem', // 2px
  sm: '0.25rem', // 4px
  base: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

/**
 * Shadow system for depth and elevation
 */
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

/**
 * Breakpoint system for responsive design
 */
export const breakpoints = {
  sm: '640px', // Small screens
  md: '768px', // Medium screens (tablets)
  lg: '1024px', // Large screens (laptops)
  xl: '1280px', // Extra large screens (desktops)
  '2xl': '1536px', // 2XL screens (large desktops)
} as const;

/**
 * Z-index scale for consistent layering
 */
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

/**
 * Component size variants for consistent sizing
 */
export const componentSizes = {
  xs: {
    height: spacing[6], // 24px
    padding: `${spacing[1]} ${spacing[2]}`, // 4px 8px
    fontSize: typography.fontSize.xs,
  },
  sm: {
    height: spacing[8], // 32px
    padding: `${spacing[2]} ${spacing[3]}`, // 8px 12px
    fontSize: typography.fontSize.sm,
  },
  md: {
    height: spacing[10], // 40px
    padding: `${spacing[2]} ${spacing[4]}`, // 8px 16px
    fontSize: typography.fontSize.base,
  },
  lg: {
    height: spacing[12], // 48px
    padding: `${spacing[3]} ${spacing[6]}`, // 12px 24px
    fontSize: typography.fontSize.lg,
  },
  xl: {
    height: spacing[16], // 64px
    padding: `${spacing[4]} ${spacing[8]}`, // 16px 32px
    fontSize: typography.fontSize.xl,
  },
} as const;

/**
 * Animation and transition presets
 */
export const transitions = {
  duration: {
    fastest: '75ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slowest: '500ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Complete theme object with light and dark variants
 */
export interface Theme {
  readonly name: string;
  readonly colors: {
    readonly background: {
      readonly primary: string;
      readonly secondary: string;
      readonly tertiary: string;
    };
    readonly text: {
      readonly primary: string;
      readonly secondary: string;
      readonly tertiary: string;
      readonly inverse: string;
    };
    readonly border: {
      readonly primary: string;
      readonly secondary: string;
      readonly focus: string;
    };
    readonly interactive: {
      readonly primary: string;
      readonly primaryHover: string;
      readonly primaryActive: string;
      readonly primaryDisabled: string;
      readonly secondary: string;
      readonly secondaryHover: string;
      readonly danger: string;
      readonly dangerHover: string;
    };
    readonly status: {
      readonly error: string;
      readonly errorBackground: string;
      readonly success: string;
      readonly successBackground: string;
      readonly warning: string;
      readonly warningBackground: string;
      readonly info: string;
      readonly infoBackground: string;
    };
  };
  readonly typography: typeof typography;
  readonly spacing: typeof spacing;
  readonly borderRadius: typeof borderRadius;
  readonly shadows: typeof shadows;
  readonly breakpoints: typeof breakpoints;
  readonly zIndex: typeof zIndex;
  readonly componentSizes: typeof componentSizes;
  readonly transitions: typeof transitions;
}

/**
 * Light theme configuration (default)
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: {
      primary: colors.neutral[0],
      secondary: colors.neutral[50],
      tertiary: colors.neutral[100],
    },
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      inverse: colors.neutral[0],
    },
    border: {
      primary: colors.neutral[200],
      secondary: colors.neutral[300],
      focus: colors.primary[500],
    },
    interactive: {
      primary: colors.primary[500],
      primaryHover: colors.primary[600],
      primaryActive: colors.primary[700],
      primaryDisabled: colors.neutral[300],
      secondary: colors.neutral[100],
      secondaryHover: colors.neutral[200],
      danger: colors.semantic.error[500],
      dangerHover: colors.semantic.error[600],
    },
    status: {
      error: colors.semantic.error[500],
      errorBackground: colors.semantic.error[50],
      success: colors.semantic.success[500],
      successBackground: colors.semantic.success[50],
      warning: colors.semantic.warning[500],
      warningBackground: colors.semantic.warning[50],
      info: colors.semantic.info[500],
      infoBackground: colors.semantic.info[50],
    },
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  componentSizes,
  transitions,
} as const;

/**
 * Dark theme configuration (future enhancement)
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: {
      primary: colors.neutral[900],
      secondary: colors.neutral[800],
      tertiary: colors.neutral[700],
    },
    text: {
      primary: colors.neutral[0],
      secondary: colors.neutral[200],
      tertiary: colors.neutral[400],
      inverse: colors.neutral[900],
    },
    border: {
      primary: colors.neutral[700],
      secondary: colors.neutral[600],
      focus: colors.primary[400],
    },
    interactive: {
      primary: colors.primary[400],
      primaryHover: colors.primary[300],
      primaryActive: colors.primary[200],
      primaryDisabled: colors.neutral[600],
      secondary: colors.neutral[800],
      secondaryHover: colors.neutral[700],
      danger: colors.semantic.error[400],
      dangerHover: colors.semantic.error[300],
    },
    status: {
      error: colors.semantic.error[400],
      errorBackground: colors.semantic.error[900],
      success: colors.semantic.success[400],
      successBackground: colors.semantic.success[900],
      warning: colors.semantic.warning[400],
      warningBackground: colors.semantic.warning[900],
      info: colors.semantic.info[400],
      infoBackground: colors.semantic.info[900],
    },
  },
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  componentSizes,
  transitions,
} as const;

/**
 * Default theme (light theme)
 */
export const defaultTheme = lightTheme;

/**
 * Theme type for TypeScript inference
 */
export type ThemeType = typeof lightTheme;
