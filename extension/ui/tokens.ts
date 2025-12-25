// shadcn-inspired design tokens
export const tokens = {
  colors: {
    // Primary - clean blue like shadcn
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryForeground: '#FFFFFF',

    // Backgrounds - proper dark theme
    background: '#09090B',
    card: '#18181B',
    cardHover: '#27272A',

    // Muted
    muted: '#27272A',
    mutedForeground: '#A1A1AA',

    // Text
    foreground: '#FAFAFA',
    foregroundSecondary: '#A1A1AA',

    // Borders
    border: '#27272A',
    input: '#27272A',
    ring: '#2563EB',

    // Semantic
    destructive: '#EF4444',
    destructiveForeground: '#FAFAFA',
    success: '#22C55E',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
  },

  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
  },

  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    size: {
      xs: '12px',
      sm: '14px',
      base: '14px',
      lg: '16px',
      xl: '18px',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
    },
  },

  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },

  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
