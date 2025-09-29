/**
 * Platform-Specific Theming System for KeyboardUI Components
 * 
 * Provides comprehensive theming support that adapts to each platform's
 * design language while maintaining visual consistency and accessibility.
 */

import type { Platform } from '../../injection/types.js';

/**
 * Color palette interface
 */
export interface ColorPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly border: string;
  readonly borderSecondary: string;
  readonly error: string;
  readonly warning: string;
  readonly success: string;
  readonly info: string;
  readonly focus: string;
  readonly hover: string;
  readonly active: string;
  readonly disabled: string;
}

/**
 * Typography configuration
 */
export interface Typography {
  readonly fontFamily: string;
  readonly fontSize: {
    readonly xs: string;
    readonly sm: string;
    readonly base: string;
    readonly lg: string;
    readonly xl: string;
  };
  readonly fontWeight: {
    readonly light: number;
    readonly normal: number;
    readonly medium: number;
    readonly semibold: number;
    readonly bold: number;
  };
  readonly lineHeight: {
    readonly tight: number;
    readonly normal: number;
    readonly relaxed: number;
  };
  readonly letterSpacing: {
    readonly tight: string;
    readonly normal: string;
    readonly wide: string;
  };
}

/**
 * Spacing configuration
 */
export interface Spacing {
  readonly xs: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly xxl: string;
}

/**
 * Border radius configuration
 */
export interface BorderRadius {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly full: string;
}

/**
 * Shadow configuration
 */
export interface Shadows {
  readonly none: string;
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly inner: string;
}

/**
 * Z-index configuration
 */
export interface ZIndex {
  readonly base: number;
  readonly dropdown: number;
  readonly overlay: number;
  readonly modal: number;
  readonly tooltip: number;
  readonly keyboard: number;
}

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Component theme variants
 */
export interface ComponentTheme {
  readonly keyboard: {
    readonly background: string;
    readonly border: string;
    readonly shadow: string;
    readonly borderRadius: string;
  };
  readonly button: {
    readonly primary: {
      readonly background: string;
      readonly color: string;
      readonly border: string;
    };
    readonly secondary: {
      readonly background: string;
      readonly color: string;
      readonly border: string;
    };
    readonly ghost: {
      readonly background: string;
      readonly color: string;
      readonly border: string;
    };
  };
  readonly input: {
    readonly background: string;
    readonly color: string;
    readonly border: string;
    readonly placeholder: string;
  };
  readonly dropdown: {
    readonly background: string;
    readonly border: string;
    readonly shadow: string;
    readonly item: {
      readonly background: string;
      readonly color: string;
      readonly hover: string;
      readonly selected: string;
    };
  };
}

/**
 * Complete theme configuration
 */
export interface Theme {
  readonly name: string;
  readonly platform: Platform;
  readonly mode: ThemeMode;
  readonly colors: ColorPalette;
  readonly typography: Typography;
  readonly spacing: Spacing;
  readonly borderRadius: BorderRadius;
  readonly shadows: Shadows;
  readonly zIndex: ZIndex;
  readonly components: ComponentTheme;
  readonly animations: {
    readonly duration: {
      readonly fast: number;
      readonly normal: number;
      readonly slow: number;
    };
    readonly easing: {
      readonly easeIn: string;
      readonly easeOut: string;
      readonly easeInOut: string;
    };
  };
}

/**
 * Twitter theme configuration
 */
export const TWITTER_THEME: Theme = {
  name: 'Twitter',
  platform: 'twitter',
  mode: 'dark',
  colors: {
    primary: '#1d9bf0',
    secondary: '#8b98a5',
    accent: '#1d9bf0',
    background: '#000000',
    surface: '#16181c',
    text: '#e7e9ea',
    textSecondary: '#71767b',
    border: '#2f3336',
    borderSecondary: '#3e4144',
    error: '#f4212e',
    warning: '#ffad1f',
    success: '#00ba7c',
    info: '#1d9bf0',
    focus: '#1d9bf0',
    hover: 'rgba(29, 155, 240, 0.1)',
    active: 'rgba(29, 155, 240, 0.2)',
    disabled: '#2f3336',
  },
  typography: {
    fontFamily: 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '15px',
      lg: '17px',
      xl: '20px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    overlay: 1100,
    modal: 1200,
    tooltip: 1300,
    keyboard: 1050,
  },
  components: {
    keyboard: {
      background: '#16181c',
      border: '#2f3336',
      shadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
    },
    button: {
      primary: {
        background: '#1d9bf0',
        color: '#ffffff',
        border: '#1d9bf0',
      },
      secondary: {
        background: 'transparent',
        color: '#e7e9ea',
        border: '#2f3336',
      },
      ghost: {
        background: 'transparent',
        color: '#e7e9ea',
        border: 'transparent',
      },
    },
    input: {
      background: '#16181c',
      color: '#e7e9ea',
      border: '#2f3336',
      placeholder: '#71767b',
    },
    dropdown: {
      background: '#000000',
      border: '#2f3336',
      shadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      item: {
        background: 'transparent',
        color: '#e7e9ea',
        hover: 'rgba(29, 155, 240, 0.1)',
        selected: 'rgba(29, 155, 240, 0.2)',
      },
    },
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

/**
 * LinkedIn theme configuration
 */
export const LINKEDIN_THEME: Theme = {
  name: 'LinkedIn',
  platform: 'linkedin',
  mode: 'light',
  colors: {
    primary: '#0a66c2',
    secondary: '#666666',
    accent: '#0a66c2',
    background: '#ffffff',
    surface: '#f3f2ef',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e6e6e6',
    borderSecondary: '#d0d0d0',
    error: '#cc1016',
    warning: '#f5c75d',
    success: '#057642',
    info: '#0a66c2',
    focus: '#0a66c2',
    hover: 'rgba(10, 102, 194, 0.08)',
    active: 'rgba(10, 102, 194, 0.16)',
    disabled: '#e6e6e6',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '50%',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
    md: '0 2px 4px rgba(0, 0, 0, 0.1)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    overlay: 1100,
    modal: 1200,
    tooltip: 1300,
    keyboard: 1050,
  },
  components: {
    keyboard: {
      background: '#ffffff',
      border: '#e6e6e6',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
    },
    button: {
      primary: {
        background: '#0a66c2',
        color: '#ffffff',
        border: '#0a66c2',
      },
      secondary: {
        background: '#ffffff',
        color: '#0a66c2',
        border: '#0a66c2',
      },
      ghost: {
        background: 'transparent',
        color: '#666666',
        border: 'transparent',
      },
    },
    input: {
      background: '#ffffff',
      color: '#000000',
      border: '#e6e6e6',
      placeholder: '#666666',
    },
    dropdown: {
      background: '#ffffff',
      border: '#e6e6e6',
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      item: {
        background: 'transparent',
        color: '#000000',
        hover: 'rgba(10, 102, 194, 0.08)',
        selected: 'rgba(10, 102, 194, 0.16)',
      },
    },
  },
  animations: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 400,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

/**
 * Reddit theme configuration
 */
export const REDDIT_THEME: Theme = {
  name: 'Reddit',
  platform: 'reddit',
  mode: 'dark',
  colors: {
    primary: '#ff4500',
    secondary: '#878a8c',
    accent: '#ff4500',
    background: '#1a1a1b',
    surface: '#272729',
    text: '#d7dadc',
    textSecondary: '#818384',
    border: '#343536',
    borderSecondary: '#474748',
    error: '#ea0027',
    warning: '#ffb000',
    success: '#46d160',
    info: '#0079d3',
    focus: '#ff4500',
    hover: 'rgba(255, 69, 0, 0.1)',
    active: 'rgba(255, 69, 0, 0.2)',
    disabled: '#343536',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.5,
      relaxed: 1.7,
    },
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.01em',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '50%',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
    md: '0 2px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 4px 12px rgba(0, 0, 0, 0.4)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.4)',
    inner: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    overlay: 1100,
    modal: 1200,
    tooltip: 1300,
    keyboard: 1050,
  },
  components: {
    keyboard: {
      background: '#272729',
      border: '#343536',
      shadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
      borderRadius: '4px',
    },
    button: {
      primary: {
        background: '#ff4500',
        color: '#ffffff',
        border: '#ff4500',
      },
      secondary: {
        background: 'transparent',
        color: '#d7dadc',
        border: '#343536',
      },
      ghost: {
        background: 'transparent',
        color: '#d7dadc',
        border: 'transparent',
      },
    },
    input: {
      background: '#272729',
      color: '#d7dadc',
      border: '#343536',
      placeholder: '#818384',
    },
    dropdown: {
      background: '#1a1a1b',
      border: '#343536',
      shadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
      item: {
        background: 'transparent',
        color: '#d7dadc',
        hover: 'rgba(255, 69, 0, 0.1)',
        selected: 'rgba(255, 69, 0, 0.2)',
      },
    },
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

/**
 * Theme registry
 */
export const THEMES: Record<Platform, Theme> = {
  twitter: TWITTER_THEME,
  linkedin: LINKEDIN_THEME,
  reddit: REDDIT_THEME,
};

/**
 * Theme utility functions
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: Theme = TWITTER_THEME;
  private readonly listeners = new Set<(theme: Theme) => void>();
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }
  
  /**
   * Get current theme
   */
  public getCurrentTheme(): Theme {
    return this.currentTheme;
  }
  
  /**
   * Set theme by platform
   */
  public setTheme(platform: Platform): void {
    const theme = THEMES[platform];
    if (theme && theme !== this.currentTheme) {
      this.currentTheme = theme;
      this.notifyListeners(theme);
      this.applyThemeToDocument(theme);
    }
  }
  
  /**
   * Get theme for platform
   */
  public getTheme(platform: Platform): Theme {
    return THEMES[platform];
  }
  
  /**
   * Add theme change listener
   */
  public addListener(listener: (theme: Theme) => void): void {
    this.listeners.add(listener);
  }
  
  /**
   * Remove theme change listener
   */
  public removeListener(listener: (theme: Theme) => void): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Generate CSS custom properties for theme
   */
  public generateCSSVariables(theme: Theme): string {
    return `
      :root {
        /* Colors */
        --primary: ${theme.colors.primary};
        --secondary: ${theme.colors.secondary};
        --accent: ${theme.colors.accent};
        --background: ${theme.colors.background};
        --surface: ${theme.colors.surface};
        --text: ${theme.colors.text};
        --text-secondary: ${theme.colors.textSecondary};
        --border: ${theme.colors.border};
        --border-secondary: ${theme.colors.borderSecondary};
        --error: ${theme.colors.error};
        --warning: ${theme.colors.warning};
        --success: ${theme.colors.success};
        --info: ${theme.colors.info};
        --focus: ${theme.colors.focus};
        --hover: ${theme.colors.hover};
        --active: ${theme.colors.active};
        --disabled: ${theme.colors.disabled};
        
        /* Typography */
        --font-family: ${theme.typography.fontFamily};
        --font-size-xs: ${theme.typography.fontSize.xs};
        --font-size-sm: ${theme.typography.fontSize.sm};
        --font-size-base: ${theme.typography.fontSize.base};
        --font-size-lg: ${theme.typography.fontSize.lg};
        --font-size-xl: ${theme.typography.fontSize.xl};
        
        /* Spacing */
        --spacing-xs: ${theme.spacing.xs};
        --spacing-sm: ${theme.spacing.sm};
        --spacing-md: ${theme.spacing.md};
        --spacing-lg: ${theme.spacing.lg};
        --spacing-xl: ${theme.spacing.xl};
        --spacing-xxl: ${theme.spacing.xxl};
        
        /* Border Radius */
        --radius-none: ${theme.borderRadius.none};
        --radius-sm: ${theme.borderRadius.sm};
        --radius-md: ${theme.borderRadius.md};
        --radius-lg: ${theme.borderRadius.lg};
        --radius-xl: ${theme.borderRadius.xl};
        --radius-full: ${theme.borderRadius.full};
        
        /* Shadows */
        --shadow-none: ${theme.shadows.none};
        --shadow-sm: ${theme.shadows.sm};
        --shadow-md: ${theme.shadows.md};
        --shadow-lg: ${theme.shadows.lg};
        --shadow-xl: ${theme.shadows.xl};
        --shadow-inner: ${theme.shadows.inner};
        
        /* Z-Index */
        --z-base: ${theme.zIndex.base};
        --z-dropdown: ${theme.zIndex.dropdown};
        --z-overlay: ${theme.zIndex.overlay};
        --z-modal: ${theme.zIndex.modal};
        --z-tooltip: ${theme.zIndex.tooltip};
        --z-keyboard: ${theme.zIndex.keyboard};
        
        /* Animation */
        --duration-fast: ${theme.animations.duration.fast}ms;
        --duration-normal: ${theme.animations.duration.normal}ms;
        --duration-slow: ${theme.animations.duration.slow}ms;
        --easing-in: ${theme.animations.easing.easeIn};
        --easing-out: ${theme.animations.easing.easeOut};
        --easing-in-out: ${theme.animations.easing.easeInOut};
        
        /* Component-specific */
        --keyboard-bg: ${theme.components.keyboard.background};
        --keyboard-border: ${theme.components.keyboard.border};
        --keyboard-shadow: ${theme.components.keyboard.shadow};
        --keyboard-radius: ${theme.components.keyboard.borderRadius};
        
        --button-primary-bg: ${theme.components.button.primary.background};
        --button-primary-color: ${theme.components.button.primary.color};
        --button-primary-border: ${theme.components.button.primary.border};
        
        --button-secondary-bg: ${theme.components.button.secondary.background};
        --button-secondary-color: ${theme.components.button.secondary.color};
        --button-secondary-border: ${theme.components.button.secondary.border};
        
        --input-bg: ${theme.components.input.background};
        --input-color: ${theme.components.input.color};
        --input-border: ${theme.components.input.border};
        --input-placeholder: ${theme.components.input.placeholder};
        
        --dropdown-bg: ${theme.components.dropdown.background};
        --dropdown-border: ${theme.components.dropdown.border};
        --dropdown-shadow: ${theme.components.dropdown.shadow};
        --dropdown-item-hover: ${theme.components.dropdown.item.hover};
        --dropdown-item-selected: ${theme.components.dropdown.item.selected};
      }
    `;
  }
  
  /**
   * Apply theme to document
   */
  private applyThemeToDocument(theme: Theme): void {
    // Create or update style element
    let styleElement = document.getElementById('hypertweet-theme');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'hypertweet-theme';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = this.generateCSSVariables(theme);
  }
  
  /**
   * Notify theme change listeners
   */
  private notifyListeners(theme: Theme): void {
    for (const listener of this.listeners) {
      try {
        listener(theme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    }
  }
}

/**
 * Theme detection utilities
 */
export const ThemeDetection = {
  /**
   * Detect platform from current URL
   */
  detectPlatform(): Platform {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter';
    }
    if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }
    if (hostname.includes('reddit.com')) {
      return 'reddit';
    }
    
    // Default fallback
    return 'twitter';
  },
  
  /**
   * Detect dark mode preference
   */
  detectDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  /**
   * Get platform-specific theme with mode preference
   */
  getAdaptiveTheme(platform: Platform): Theme {
    const baseTheme = THEMES[platform];
    const prefersDark = this.detectDarkMode();
    
    // For platforms that support both modes, adapt accordingly
    if (platform === 'linkedin' && prefersDark) {
      return {
        ...baseTheme,
        mode: 'dark',
        colors: {
          ...baseTheme.colors,
          background: '#1b1f23',
          surface: '#282e33',
          text: '#ffffff',
          textSecondary: '#b0b3b8',
          border: '#3e4144',
          borderSecondary: '#4a4e52',
        },
        components: {
          ...baseTheme.components,
          keyboard: {
            ...baseTheme.components.keyboard,
            background: '#282e33',
            border: '#3e4144',
          },
          button: {
            ...baseTheme.components.button,
            secondary: {
              ...baseTheme.components.button.secondary,
              background: 'transparent',
              color: '#ffffff',
            },
          },
          input: {
            ...baseTheme.components.input,
            background: '#1b1f23',
            color: '#ffffff',
            placeholder: '#b0b3b8',
          },
          dropdown: {
            ...baseTheme.components.dropdown,
            background: '#282e33',
            border: '#3e4144',
          },
        },
      };
    }
    
    return baseTheme;
  },
} as const;

/**
 * Create theme-aware component styles
 */
export function createComponentStyles(theme: Theme, component: keyof ComponentTheme): Record<string, string> {
  const componentTheme = theme.components[component];
  
  switch (component) {
    case 'keyboard': {
      const keyboardTheme = componentTheme as ComponentTheme['keyboard'];
      return {
        backgroundColor: keyboardTheme.background,
        border: `1px solid ${keyboardTheme.border}`,
        boxShadow: keyboardTheme.shadow,
        borderRadius: keyboardTheme.borderRadius,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.base,
      };
    }
      
    case 'button':
      return {
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium.toString(),
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        transition: `all ${theme.animations.duration.fast}ms ${theme.animations.easing.easeOut}`,
      };
      
    case 'input': {
      const inputTheme = componentTheme as ComponentTheme['input'];
      return {
        backgroundColor: inputTheme.background,
        color: inputTheme.color,
        border: `1px solid ${inputTheme.border}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.base,
      };
    }
      
    case 'dropdown': {
      const dropdownTheme = componentTheme as ComponentTheme['dropdown'];
      return {
        backgroundColor: dropdownTheme.background,
        border: `1px solid ${dropdownTheme.border}`,
        boxShadow: dropdownTheme.shadow,
        borderRadius: theme.borderRadius.md,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize.sm,
      };
    }
      
    default:
      return {};
  }
}

/**
 * Export theme manager instance
 */
export const themeManager = ThemeManager.getInstance();