// Dark theme colors (current defaults)
export const darkColors = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryForeground: '#FFFFFF',
  background: '#09090B',
  card: '#18181B',
  cardHover: '#27272A',
  muted: '#27272A',
  mutedForeground: '#A1A1AA',
  foreground: '#FAFAFA',
  foregroundSecondary: '#A1A1AA',
  border: '#27272A',
  input: '#27272A',
  ring: '#2563EB',
  destructive: '#EF4444',
  destructiveForeground: '#FAFAFA',
  success: '#22C55E',
  overlay: 'rgba(0, 0, 0, 0.8)',
  sidebarGradientEnd: '#131316',
  hoverOverlay: 'rgba(255, 255, 255, 0.05)',
  activeOverlay: 'rgba(255, 255, 255, 0.08)',
  toggleKnob: '#FAFAFA',
} as const;

// Light theme colors
export const lightColors = {
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primaryForeground: '#FFFFFF',
  background: '#FFFFFF',
  card: '#FAFAFA',
  cardHover: '#F4F4F5',
  muted: '#F4F4F5',
  mutedForeground: '#71717A',
  foreground: '#09090B',
  foregroundSecondary: '#71717A',
  border: '#E4E4E7',
  input: '#E4E4E7',
  ring: '#2563EB',
  destructive: '#EF4444',
  destructiveForeground: '#FFFFFF',
  success: '#22C55E',
  overlay: 'rgba(0, 0, 0, 0.5)',
  sidebarGradientEnd: '#E4E4E7',
  hoverOverlay: 'rgba(0, 0, 0, 0.03)',
  activeOverlay: 'rgba(0, 0, 0, 0.05)',
  toggleKnob: '#FFFFFF',
} as const;

// CSS variable names for theming
export const cssVars = {
  primary: '--ht-primary',
  primaryHover: '--ht-primary-hover',
  primaryForeground: '--ht-primary-fg',
  background: '--ht-bg',
  card: '--ht-card',
  cardHover: '--ht-card-hover',
  muted: '--ht-muted',
  mutedForeground: '--ht-muted-fg',
  foreground: '--ht-fg',
  foregroundSecondary: '--ht-fg-secondary',
  border: '--ht-border',
  input: '--ht-input',
  ring: '--ht-ring',
  destructive: '--ht-destructive',
  destructiveForeground: '--ht-destructive-fg',
  success: '--ht-success',
  overlay: '--ht-overlay',
  sidebarGradientEnd: '--ht-sidebar-gradient-end',
  hoverOverlay: '--ht-hover-overlay',
  activeOverlay: '--ht-active-overlay',
  toggleKnob: '--ht-toggle-knob',
} as const;

// Non-color tokens
export const tokens = {
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
