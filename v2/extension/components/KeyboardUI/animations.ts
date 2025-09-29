/**
 * Animation Definitions for KeyboardUI Components
 * 
 * Provides comprehensive animation utilities for smooth, performant animations
 * with accessibility support and platform-specific optimizations.
 */

import type { Platform } from '../../injection/types.js';

/**
 * Animation timing and easing configurations
 */
export interface AnimationTiming {
  readonly duration: number;
  readonly delay: number;
  readonly easing: string;
}

/**
 * Animation direction types
 */
export type AnimationDirection = 'in' | 'out' | 'forward' | 'reverse';

/**
 * Animation state types
 */
export type AnimationState = 'idle' | 'running' | 'paused' | 'finished' | 'error';

/**
 * Keyboard animation types
 */
export type KeyboardAnimationType = 
  | 'slideIn' 
  | 'slideOut' 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'bounceIn' 
  | 'bounceOut'
  | 'scaleIn'
  | 'scaleOut';

/**
 * Button animation types
 */
export type ButtonAnimationType = 
  | 'press' 
  | 'release' 
  | 'hover' 
  | 'focus' 
  | 'success' 
  | 'error'
  | 'loading'
  | 'pulse';

/**
 * Loading animation types
 */
export type LoadingAnimationType = 'spinner' | 'dots' | 'wave' | 'pulse' | 'skeleton';

/**
 * Animation configuration for different animation types
 */
export interface AnimationConfig {
  readonly timing: AnimationTiming;
  readonly direction: AnimationDirection;
  readonly iterations: number;
  readonly fillMode: 'none' | 'forwards' | 'backwards' | 'both';
  readonly playState: 'running' | 'paused';
}

/**
 * Keyboard-specific animation configuration
 */
export interface KeyboardAnimationConfig extends AnimationConfig {
  readonly type: KeyboardAnimationType;
  readonly platform: Platform;
  readonly reduceMotion: boolean;
}

/**
 * Button-specific animation configuration
 */
export interface ButtonAnimationConfig extends AnimationConfig {
  readonly type: ButtonAnimationType;
  readonly hapticFeedback: boolean;
  readonly rippleEffect: boolean;
}

/**
 * Loading animation configuration
 */
export interface LoadingAnimationConfig extends AnimationConfig {
  readonly type: LoadingAnimationType;
  readonly size: 'small' | 'medium' | 'large';
  readonly color: string;
}

/**
 * Animation preset configurations
 */
export const ANIMATION_PRESETS = {
  // Keyboard appearance animations
  keyboard: {
    slideIn: {
      timing: { duration: 300, delay: 0, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      direction: 'in' as const,
      iterations: 1,
      fillMode: 'forwards' as const,
      playState: 'running' as const,
    },
    slideOut: {
      timing: { duration: 250, delay: 0, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
      direction: 'out' as const,
      iterations: 1,
      fillMode: 'forwards' as const,
      playState: 'running' as const,
    },
    fadeIn: {
      timing: { duration: 200, delay: 0, easing: 'ease-out' },
      direction: 'in' as const,
      iterations: 1,
      fillMode: 'forwards' as const,
      playState: 'running' as const,
    },
    fadeOut: {
      timing: { duration: 150, delay: 0, easing: 'ease-in' },
      direction: 'out' as const,
      iterations: 1,
      fillMode: 'forwards' as const,
      playState: 'running' as const,
    },
  },
  
  // Button interaction animations
  button: {
    press: {
      timing: { duration: 150, delay: 0, easing: 'cubic-bezier(0.4, 0, 1, 1)' },
      direction: 'forward' as const,
      iterations: 1,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
    hover: {
      timing: { duration: 200, delay: 0, easing: 'ease-out' },
      direction: 'forward' as const,
      iterations: 1,
      fillMode: 'forwards' as const,
      playState: 'running' as const,
    },
    success: {
      timing: { duration: 600, delay: 0, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
      direction: 'forward' as const,
      iterations: 1,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
    error: {
      timing: { duration: 400, delay: 0, easing: 'ease-out' },
      direction: 'forward' as const,
      iterations: 2,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
  },
  
  // Loading animations
  loading: {
    spinner: {
      timing: { duration: 1000, delay: 0, easing: 'linear' },
      direction: 'forward' as const,
      iterations: Infinity,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
    pulse: {
      timing: { duration: 1500, delay: 0, easing: 'ease-in-out' },
      direction: 'forward' as const,
      iterations: Infinity,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
    dots: {
      timing: { duration: 1200, delay: 0, easing: 'ease-in-out' },
      direction: 'forward' as const,
      iterations: Infinity,
      fillMode: 'none' as const,
      playState: 'running' as const,
    },
  },
} as const;

/**
 * CSS animation keyframes for keyboard animations
 */
export const KEYBOARD_KEYFRAMES = {
  slideInFromBottom: `
    @keyframes slideInFromBottom {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  slideOutToBottom: `
    @keyframes slideOutToBottom {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(100%);
        opacity: 0;
      }
    }
  `,
  
  slideInFromTop: `
    @keyframes slideInFromTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  slideOutToTop: `
    @keyframes slideOutToTop {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-100%);
        opacity: 0;
      }
    }
  `,
  
  fadeIn: `
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  
  fadeOut: `
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,
  
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0.8);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  
  scaleOut: `
    @keyframes scaleOut {
      from {
        transform: scale(1);
        opacity: 1;
      }
      to {
        transform: scale(0.8);
        opacity: 0;
      }
    }
  `,
} as const;

/**
 * CSS animation keyframes for button animations
 */
export const BUTTON_KEYFRAMES = {
  press: `
    @keyframes buttonPress {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(0.95);
      }
      100% {
        transform: scale(1);
      }
    }
  `,
  
  ripple: `
    @keyframes ripple {
      0% {
        transform: scale(0);
        opacity: 0.7;
      }
      100% {
        transform: scale(4);
        opacity: 0;
      }
    }
  `,
  
  success: `
    @keyframes buttonSuccess {
      0% {
        transform: scale(1);
        background-color: var(--button-bg);
      }
      50% {
        transform: scale(1.05);
        background-color: var(--success-color);
      }
      100% {
        transform: scale(1);
        background-color: var(--button-bg);
      }
    }
  `,
  
  error: `
    @keyframes buttonError {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-2px);
      }
      75% {
        transform: translateX(2px);
      }
    }
  `,
  
  pulse: `
    @keyframes buttonPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
  `,
} as const;

/**
 * CSS animation keyframes for loading animations
 */
export const LOADING_KEYFRAMES = {
  spinner: `
    @keyframes spinner {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `,
  
  dots: `
    @keyframes dots {
      0%, 20% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.5);
        opacity: 0.7;
      }
      80%, 100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  
  wave: `
    @keyframes wave {
      0%, 40%, 100% {
        transform: scaleY(0.4);
      }
      20% {
        transform: scaleY(1);
      }
    }
  `,
  
  pulse: `
    @keyframes loadingPulse {
      0%, 100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }
  `,
  
  skeleton: `
    @keyframes skeleton {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }
  `,
} as const;

/**
 * Utility class for animation management
 */
export class AnimationManager {
  private static instance: AnimationManager;
  private readonly reducedMotion: boolean;
  private readonly animationCache = new Map<string, Animation>();
  
  private constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }
  
  /**
   * Check if reduced motion is preferred
   */
  public isReducedMotion(): boolean {
    return this.reducedMotion;
  }
  
  /**
   * Create animation with configuration
   */
  public createAnimation(
    element: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes,
    options: KeyframeAnimationOptions
  ): Animation {
    const animation = element.animate(keyframes, {
      ...options,
      duration: this.reducedMotion ? 0 : options.duration,
    });
    
    const key = `${element.tagName}-${Date.now()}`;
    this.animationCache.set(key, animation);
    
    // Clean up after animation completes
    animation.addEventListener('finish', () => {
      this.animationCache.delete(key);
    });
    
    return animation;
  }
  
  /**
   * Create keyboard slide-in animation
   */
  public slideInKeyboard(element: Element, direction: 'top' | 'bottom' = 'bottom'): Animation {
    const keyframes = direction === 'bottom' 
      ? [
          { transform: 'translateY(100%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ]
      : [
          { transform: 'translateY(-100%)', opacity: 0 },
          { transform: 'translateY(0)', opacity: 1 }
        ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.keyboard.slideIn.timing,
      fill: 'forwards',
    });
  }
  
  /**
   * Create keyboard slide-out animation
   */
  public slideOutKeyboard(element: Element, direction: 'top' | 'bottom' = 'bottom'): Animation {
    const keyframes = direction === 'bottom'
      ? [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(100%)', opacity: 0 }
        ]
      : [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: 'translateY(-100%)', opacity: 0 }
        ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.keyboard.slideOut.timing,
      fill: 'forwards',
    });
  }
  
  /**
   * Create button press animation
   */
  public pressButton(element: Element): Animation {
    const keyframes = [
      { transform: 'scale(1)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1)' }
    ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.button.press.timing,
    });
  }
  
  /**
   * Create success feedback animation
   */
  public showSuccess(element: Element): Animation {
    const keyframes = [
      { transform: 'scale(1)', filter: 'brightness(1)' },
      { transform: 'scale(1.05)', filter: 'brightness(1.2)' },
      { transform: 'scale(1)', filter: 'brightness(1)' }
    ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.button.success.timing,
    });
  }
  
  /**
   * Create error feedback animation
   */
  public showError(element: Element): Animation {
    const keyframes = [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(2px)' },
      { transform: 'translateX(0)' }
    ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.button.error.timing,
    });
  }
  
  /**
   * Create loading spinner animation
   */
  public createSpinner(element: Element): Animation {
    const keyframes = [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.loading.spinner.timing,
      iterations: Infinity,
    });
  }
  
  /**
   * Create pulse animation
   */
  public createPulse(element: Element): Animation {
    const keyframes = [
      { opacity: '0.4' },
      { opacity: '1' },
      { opacity: '0.4' }
    ];
    
    return this.createAnimation(element, keyframes, {
      ...ANIMATION_PRESETS.loading.pulse.timing,
      iterations: Infinity,
    });
  }
  
  /**
   * Cancel all animations for an element
   */
  public cancelAnimations(element: Element): void {
    const animations = element.getAnimations();
    for (const animation of animations) {
      animation.cancel();
    }
  }
  
  /**
   * Clean up animation cache
   */
  public cleanup(): void {
    for (const animation of this.animationCache.values()) {
      animation.cancel();
    }
    this.animationCache.clear();
  }
}

/**
 * CSS classes for animation support
 */
export const ANIMATION_CLASSES = {
  // Keyboard animations
  keyboardSlideIn: 'keyboard-slide-in',
  keyboardSlideOut: 'keyboard-slide-out',
  keyboardFadeIn: 'keyboard-fade-in',
  keyboardFadeOut: 'keyboard-fade-out',
  
  // Button animations
  buttonPress: 'button-press',
  buttonHover: 'button-hover',
  buttonSuccess: 'button-success',
  buttonError: 'button-error',
  buttonLoading: 'button-loading',
  
  // Loading animations
  spinner: 'loading-spinner',
  pulse: 'loading-pulse',
  dots: 'loading-dots',
  wave: 'loading-wave',
  
  // Accessibility
  reduceMotion: 'reduce-motion',
  respectMotion: 'respect-motion',
} as const;

/**
 * Get all animation keyframes as CSS string
 */
export function getAllKeyframes(): string {
  return [
    ...Object.values(KEYBOARD_KEYFRAMES),
    ...Object.values(BUTTON_KEYFRAMES),
    ...Object.values(LOADING_KEYFRAMES),
  ].join('\n');
}

/**
 * Generate CSS animation rules for reduced motion support
 */
export function generateReducedMotionCSS(): string {
  return `
    @media (prefers-reduced-motion: reduce) {
      *,
      ::before,
      ::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      
      .${ANIMATION_CLASSES.reduceMotion} {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
}

/**
 * Animation event handlers
 */
export interface AnimationEventHandlers {
  readonly onStart?: () => void;
  readonly onFinish?: () => void;
  readonly onCancel?: () => void;
  readonly onPause?: () => void;
  readonly onResume?: () => void;
}

/**
 * Attach event handlers to animation
 */
export function attachAnimationHandlers(
  animation: Animation,
  handlers: AnimationEventHandlers
): void {
  if (handlers.onStart) {
    animation.addEventListener('start', handlers.onStart);
  }
  if (handlers.onFinish) {
    animation.addEventListener('finish', handlers.onFinish);
  }
  if (handlers.onCancel) {
    animation.addEventListener('cancel', handlers.onCancel);
  }
  if (handlers.onPause) {
    animation.addEventListener('pause', handlers.onPause);
  }
  if (handlers.onResume) {
    animation.addEventListener('resume', handlers.onResume);
  }
}

/**
 * Create platform-specific animation configuration
 */
export function createPlatformAnimationConfig(platform: Platform): KeyboardAnimationConfig {
  const baseConfig = ANIMATION_PRESETS.keyboard.slideIn;
  
  return {
    type: 'slideIn',
    platform,
    reduceMotion: AnimationManager.getInstance().isReducedMotion(),
    ...baseConfig,
  };
}

/**
 * Export animation manager instance
 */
export const animationManager = AnimationManager.getInstance();