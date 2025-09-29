/**
 * Type definitions for the KeyboardUI component system
 *
 * Provides comprehensive typing for platform detection, keyboard states,
 * tone actions, and configuration options for cross-platform injection.
 */

/**
 * Supported social media platforms for keyboard injection
 */
export type Platform = 'twitter' | 'linkedin' | 'reddit';

/**
 * Keyboard visibility and interaction states
 */
export type KeyboardState = 'hidden' | 'visible' | 'loading' | 'error';

/**
 * Tone generation modes for different user interaction patterns
 */
export type ToneMode = 'quick' | 'custom' | 'preset' | 'advanced';

/**
 * Animation state for smooth keyboard transitions
 */
export type AnimationState =
  | 'idle'
  | 'entering'
  | 'exiting'
  | 'collapsed'
  | 'expanded';

/**
 * Error types that can occur during keyboard operations
 */
export interface KeyboardError {
  readonly code:
    | 'INJECTION_FAILED'
    | 'API_ERROR'
    | 'PLATFORM_UNSUPPORTED'
    | 'TARGET_NOT_FOUND';
  readonly message: string;
  readonly platform?: Platform;
  readonly timestamp: number;
}

/**
 * Position configuration for keyboard placement relative to target element
 */
export interface PositionConfig {
  readonly placement: 'below' | 'above' | 'inline' | 'floating';
  readonly offset: {
    readonly x: number;
    readonly y: number;
  };
  readonly alignment: 'left' | 'center' | 'right';
}

/**
 * Platform-specific configuration for injection behavior
 */
export interface PlatformConfig {
  readonly platform: Platform;
  readonly selectors: {
    readonly textArea: readonly string[];
    readonly toolbar: readonly string[];
    readonly container: readonly string[];
  };
  readonly position: PositionConfig;
  readonly features: {
    readonly autoHide: boolean;
    readonly persistState: boolean;
    readonly characterLimit?: number;
  };
  readonly styling: {
    readonly useNativeTheme: boolean;
    readonly customClasses?: readonly string[];
    readonly zIndexOffset: number;
  };
}

/**
 * Target element reference with DOM node and platform context
 */
export interface TargetElement {
  readonly element: HTMLElement;
  readonly platform: Platform;
  readonly textArea: HTMLElement | null;
  readonly container: HTMLElement | null;
}

/**
 * Tone action handler function signature
 */
export type ToneActionHandler = (params: {
  readonly tone: string;
  readonly mode: ToneMode;
  readonly targetElement: TargetElement;
}) => Promise<void>;

/**
 * Quick action types for keyboard shortcuts and common operations
 */
export type QuickAction =
  | 'generate'
  | 'copy'
  | 'clear'
  | 'settings'
  | 'help'
  | 'toggle'
  | 'undo'
  | 'redo'
  | 'select-all';

/**
 * Quick action handler function signature
 */
export type QuickActionHandler = (params: {
  readonly action: QuickAction;
  readonly targetElement: TargetElement;
}) => Promise<void>;

/**
 * Keyboard event handlers for user interactions
 */
export interface KeyboardEventHandlers {
  readonly onToneSelect: ToneActionHandler;
  readonly onQuickAction: QuickActionHandler;
  readonly onStateChange: (state: KeyboardState) => void;
  readonly onError: (error: KeyboardError) => void;
  readonly onVisibilityChange: (visible: boolean) => void;
}

/**
 * Accessibility configuration for screen readers and keyboard navigation
 */
export interface AccessibilityConfig {
  readonly announcements: {
    readonly enabled: boolean;
    readonly verbose: boolean;
  };
  readonly keyboardNavigation: {
    readonly enabled: boolean;
    readonly focusTrap: boolean;
    readonly escapeToClose: boolean;
  };
  readonly reducedMotion: {
    readonly respectPreference: boolean;
    readonly fallbackAnimations: boolean;
  };
}

/**
 * Main configuration interface for BaseKeyboard component
 */
export interface KeyboardConfig {
  readonly platform: Platform;
  readonly targetElement: TargetElement;
  readonly state: KeyboardState;
  readonly animationState: AnimationState;
  readonly mode: ToneMode;
  readonly position: PositionConfig;
  readonly accessibility: AccessibilityConfig;
  readonly handlers: KeyboardEventHandlers;
  readonly features: {
    readonly autoCollapse: boolean;
    readonly persistPreferences: boolean;
    readonly showTooltips: boolean;
    readonly enableAnimations: boolean;
  };
}

/**
 * Props interface for BaseKeyboard component following React patterns
 */
export interface BaseKeyboardProps {
  readonly platform: Platform;
  readonly targetElement: TargetElement;
  readonly visible?: boolean;
  readonly loading?: boolean;
  readonly error?: KeyboardError | null;
  readonly mode?: ToneMode;
  readonly position?: Partial<PositionConfig>;
  readonly accessibility?: Partial<AccessibilityConfig>;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly onToneSelect: ToneActionHandler;
  readonly onQuickAction: QuickActionHandler;
  readonly onStateChange?: (state: KeyboardState) => void;
  readonly onError?: (error: KeyboardError) => void;
  readonly onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Keyboard theme variant for platform-specific styling
 */
export type KeyboardThemeVariant =
  | 'default'
  | 'compact'
  | 'minimal'
  | 'professional' // For LinkedIn
  | 'casual' // For Twitter
  | 'discussion'; // For Reddit

/**
 * Keyboard size variants for different screen sizes and contexts
 */
export type KeyboardSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Tone preset definition for quick access buttons
 */
export interface TonePreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly tone: string;
  readonly icon?: React.ReactNode;
  readonly category:
    | 'professional'
    | 'casual'
    | 'friendly'
    | 'formal'
    | 'creative';
  readonly platforms: readonly Platform[];
  readonly usage: {
    readonly count: number;
    readonly lastUsed: number;
  };
}

/**
 * Performance metrics for monitoring keyboard operations
 */
export interface KeyboardMetrics {
  readonly injectionTime: number;
  readonly renderTime: number;
  readonly interactionCount: number;
  readonly errorCount: number;
  readonly sessionDuration: number;
}

/**
 * Namespace for keyboard configuration defaults and utilities
 */
export namespace KeyboardDefaults {
  export const POSITION: PositionConfig = {
    placement: 'below',
    offset: { x: 0, y: 8 },
    alignment: 'left',
  } as const;

  export const ACCESSIBILITY: AccessibilityConfig = {
    announcements: {
      enabled: true,
      verbose: false,
    },
    keyboardNavigation: {
      enabled: true,
      focusTrap: true,
      escapeToClose: true,
    },
    reducedMotion: {
      respectPreference: true,
      fallbackAnimations: true,
    },
  } as const;

  export const FEATURES = {
    autoCollapse: true,
    persistPreferences: true,
    showTooltips: true,
    enableAnimations: true,
  } as const;

  export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
    twitter: {
      platform: 'twitter',
      selectors: {
        textArea: [
          '[data-testid="tweetTextarea_0"]',
          '[contenteditable="true"]',
        ],
        toolbar: [
          '[data-testid="toolBar"]',
          '.css-175oi2r.r-136c7rf.r-16y2uox',
        ],
        container: ['[data-testid="tweetComposer"]', '.DraftEditor-root'],
      },
      position: {
        ...POSITION,
        placement: 'below',
        offset: { x: 0, y: 4 },
      },
      features: {
        autoHide: true,
        persistState: true,
        characterLimit: 280,
      },
      styling: {
        useNativeTheme: true,
        customClasses: ['twitter-keyboard'],
        zIndexOffset: 10,
      },
    },
    linkedin: {
      platform: 'linkedin',
      selectors: {
        textArea: ['.ql-editor', '[contenteditable="true"]'],
        toolbar: ['.share-creation-state__bottom', '.ql-toolbar'],
        container: ['.share-creation-state', '.ql-container'],
      },
      position: {
        ...POSITION,
        placement: 'below',
        offset: { x: 0, y: 12 },
        alignment: 'left',
      },
      features: {
        autoHide: false,
        persistState: true,
      },
      styling: {
        useNativeTheme: true,
        customClasses: ['linkedin-keyboard'],
        zIndexOffset: 5,
      },
    },
    reddit: {
      platform: 'reddit',
      selectors: {
        textArea: ['.DraftEditor-root', '.public-DraftEditor-content'],
        toolbar: ['.s172n2p-1.eXwvgH', '.RichTextJSON-root'],
        container: ['shreddit-composer', '.Comment'],
      },
      position: {
        ...POSITION,
        placement: 'below',
        offset: { x: 0, y: 8 },
      },
      features: {
        autoHide: true,
        persistState: false,
      },
      styling: {
        useNativeTheme: true,
        customClasses: ['reddit-keyboard'],
        zIndexOffset: 15,
      },
    },
  } as const;
}

/**
 * Type guard to check if a value is a valid Platform
 */
export const isPlatform = (value: unknown): value is Platform => {
  return (
    typeof value === 'string' &&
    (['twitter', 'linkedin', 'reddit'] as const).includes(value as Platform)
  );
};

/**
 * Type guard to check if a value is a valid KeyboardState
 */
export const isKeyboardState = (value: unknown): value is KeyboardState => {
  return (
    typeof value === 'string' &&
    (['hidden', 'visible', 'loading', 'error'] as const).includes(
      value as KeyboardState
    )
  );
};

/**
 * Type guard to check if a value is a valid ToneMode
 */
export const isToneMode = (value: unknown): value is ToneMode => {
  return (
    typeof value === 'string' &&
    (['quick', 'custom', 'preset', 'advanced'] as const).includes(
      value as ToneMode
    )
  );
};

/**
 * Utility to create a KeyboardError with timestamp
 */
export const createKeyboardError = (
  code: KeyboardError['code'],
  message: string,
  platform?: Platform
): KeyboardError => ({
  code,
  message,
  platform,
  timestamp: Date.now(),
});

/**
 * Utility to merge partial accessibility config with defaults
 */
export const mergeAccessibilityConfig = (
  partial?: Partial<AccessibilityConfig>
): AccessibilityConfig => ({
  announcements: {
    ...KeyboardDefaults.ACCESSIBILITY.announcements,
    ...partial?.announcements,
  },
  keyboardNavigation: {
    ...KeyboardDefaults.ACCESSIBILITY.keyboardNavigation,
    ...partial?.keyboardNavigation,
  },
  reducedMotion: {
    ...KeyboardDefaults.ACCESSIBILITY.reducedMotion,
    ...partial?.reducedMotion,
  },
});

/**
 * Utility to merge partial position config with defaults
 */
export const mergePositionConfig = (
  partial?: Partial<PositionConfig>
): PositionConfig => ({
  ...KeyboardDefaults.POSITION,
  ...partial,
  offset: {
    ...KeyboardDefaults.POSITION.offset,
    ...partial?.offset,
  },
});
