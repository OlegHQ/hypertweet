/**
 * Animated Keyboard Component - Task C3 Integration Demonstration
 * 
 * Showcases the integration of animations, visual states, and theming
 * for a complete keyboard UI experience with smooth transitions and
 * platform-specific styling.
 */

import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import type { Platform } from '../../injection/types.js';
import type { 
  TargetElement, 
  ToneActionHandler, 
  QuickActionHandler,
  BaseKeyboardProps,
} from './types.js';
import {
  animationManager,
  createKeyboardStateManager,
  createButtonStateManager,
  themeManager,
  ThemeDetection,
  type KeyboardVisualState,
  type ButtonState,
  type Theme,
} from './index.js';

/**
 * Animated keyboard configuration
 */
export interface AnimatedKeyboardConfig {
  readonly enableAnimations: boolean;
  readonly animationSpeed: 'fast' | 'normal' | 'slow';
  readonly autoTheme: boolean;
  readonly persistState: boolean;
  readonly reducedMotion: boolean;
}

/**
 * Animation performance metrics
 */
export interface AnimationMetrics {
  readonly frameRate: number;
  readonly animationCount: number;
  readonly averageAnimationDuration: number;
  readonly memoryUsage: number;
}

/**
 * Animated keyboard props
 */
export interface AnimatedKeyboardProps extends Omit<BaseKeyboardProps, 'onToneSelect' | 'onQuickAction'> {
  readonly config?: Partial<AnimatedKeyboardConfig>;
  readonly onStateChange?: (state: KeyboardVisualState) => void;
  readonly onThemeChange?: (theme: Theme) => void;
  readonly onAnimationStart?: (type: string) => void;
  readonly onAnimationEnd?: (type: string) => void;
  readonly onToneSelect?: ToneActionHandler;
  readonly onQuickAction?: QuickActionHandler;
  readonly metrics?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AnimatedKeyboardConfig = {
  enableAnimations: true,
  animationSpeed: 'normal',
  autoTheme: true,
  persistState: true,
  reducedMotion: false,
};

/**
 * Animated Keyboard Component with comprehensive C3 integration
 */
export const AnimatedKeyboard = forwardRef<HTMLDivElement, AnimatedKeyboardProps>(({
  platform,
  targetElement,
  visible = false,
  config = {},
  onStateChange,
  onThemeChange,
  onAnimationStart,
  onAnimationEnd,
  onToneSelect,
  onQuickAction,
  metrics = false,
  onError,
  ...props
}, ref) => {
  // Configuration with defaults
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Refs for DOM elements and managers
  const keyboardRef = useRef<HTMLDivElement>(null);
  const stateManagerRef = useRef<ReturnType<typeof createKeyboardStateManager> | null>(null);
  const buttonManagersRef = useRef<Map<string, ReturnType<typeof createButtonStateManager>>>(new Map());
  const themeRef = useRef<Theme | null>(null);
  const animationMetricsRef = useRef<AnimationMetrics>({
    frameRate: 60,
    animationCount: 0,
    averageAnimationDuration: 0,
    memoryUsage: 0,
  });
  
  // State
  const [currentState, setCurrentState] = useState<KeyboardVisualState>('hidden');
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<AnimationMetrics | null>(
    metrics ? animationMetricsRef.current : null
  );
  
  /**
   * Initialize managers and theme
   */
  useEffect(() => {
    const element = keyboardRef.current;
    if (!element) return;
    
    // Initialize state manager
    stateManagerRef.current = createKeyboardStateManager(element, platform);
    
    // Add state change listener
    stateManagerRef.current.addListener((state) => {
      setCurrentState(state);
      onStateChange?.(state);
    });
    
    // Initialize theme
    if (finalConfig.autoTheme) {
      const detectedPlatform = ThemeDetection.detectPlatform();
      const adaptiveTheme = ThemeDetection.getAdaptiveTheme(detectedPlatform);
      themeManager.setTheme(detectedPlatform);
      themeRef.current = adaptiveTheme;
      setCurrentTheme(adaptiveTheme);
    } else {
      const theme = themeManager.getTheme(platform);
      themeRef.current = theme;
      setCurrentTheme(theme);
    }
    
    // Add theme change listener
    const themeListener = (theme: Theme): void => {
      themeRef.current = theme;
      setCurrentTheme(theme);
      onThemeChange?.(theme);
    };
    themeManager.addListener(themeListener);
    
    return () => {
      // Cleanup
      themeManager.removeListener(themeListener);
      animationManager.cleanup();
    };
  }, [platform, finalConfig.autoTheme, onStateChange, onThemeChange]);
  
  /**
   * Handle visibility changes with animations
   */
  useEffect(() => {
    const stateManager = stateManagerRef.current;
    const element = keyboardRef.current;
    
    if (!stateManager || !element) return;
    
    const targetState: KeyboardVisualState = visible ? 'visible' : 'hidden';
    
    if (finalConfig.enableAnimations && !finalConfig.reducedMotion) {
      // Animate state change
      setIsAnimating(true);
      onAnimationStart?.(targetState);
      
      if (visible) {
        void stateManager.setState('expanding').then(() => {
          return stateManager.setState('visible');
        }).then(() => {
          setIsAnimating(false);
          onAnimationEnd?.('visible');
        });
      } else {
        void stateManager.setState('collapsing').then(() => {
          return stateManager.setState('hidden');
        }).then(() => {
          setIsAnimating(false);
          onAnimationEnd?.('hidden');
        });
      }
    } else {
      // Direct state change without animation
      void stateManager.setState(targetState);
    }
  }, [visible, finalConfig.enableAnimations, finalConfig.reducedMotion, onAnimationStart, onAnimationEnd]);
  
  /**
   * Create button state manager for button element
   */
  const createButtonManager = useCallback((buttonId: string, element: HTMLElement) => {
    const manager = createButtonStateManager(element);
    buttonManagersRef.current.set(buttonId, manager);
    return manager;
  }, []);
  
  /**
   * Handle button interactions with state animations
   */
  const handleButtonInteraction = useCallback(async (
    buttonId: string,
    element: HTMLElement,
    newState: ButtonState
  ) => {
    let manager = buttonManagersRef.current.get(buttonId);
    
    manager ??= createButtonManager(buttonId, element);
    
    if (finalConfig.enableAnimations) {
      // Animate button state change
      if (newState === 'pressed') {
        const animation = animationManager.pressButton(element);
        onAnimationStart?.('buttonPress');
        
        animation.addEventListener('finish', () => {
          onAnimationEnd?.('buttonPress');
        });
      } else if (newState === 'success') {
        const animation = animationManager.showSuccess(element);
        onAnimationStart?.('buttonSuccess');
        
        animation.addEventListener('finish', () => {
          onAnimationEnd?.('buttonSuccess');
        });
      } else if (newState === 'error') {
        const animation = animationManager.showError(element);
        onAnimationStart?.('buttonError');
        
        animation.addEventListener('finish', () => {
          onAnimationEnd?.('buttonError');
        });
      }
    }
    
    await manager.setState(newState);
  }, [finalConfig.enableAnimations, createButtonManager, onAnimationStart, onAnimationEnd]);
  
  /**
   * Enhanced tone select handler with animations
   */
  const handleToneSelect: ToneActionHandler = useCallback(async (action) => {
    const { targetElement: target } = action;
    
    if (target?.element) {
      await handleButtonInteraction('tone-button', target.element, 'pressed');
      
      // Simulate processing delay
      await handleButtonInteraction('tone-button', target.element, 'loading');
      
      try {
        // Call original handler
        await onToneSelect?.(action);
        await handleButtonInteraction('tone-button', target.element, 'success');
      } catch (error) {
        await handleButtonInteraction('tone-button', target.element, 'error');
        throw error;
      } finally {
        // Return to default state after delay
        setTimeout(() => {
          void handleButtonInteraction('tone-button', target.element, 'default');
        }, 2000);
      }
    }
  }, [onToneSelect, handleButtonInteraction]);
  
  /**
   * Enhanced quick action handler with animations
   */
  const handleQuickAction: QuickActionHandler = useCallback(async (action) => {
    const { targetElement: target } = action;
    
    if (target?.element) {
      await handleButtonInteraction('quick-action', target.element, 'pressed');
      
      try {
        // Call original handler
        await onQuickAction?.(action);
        await handleButtonInteraction('quick-action', target.element, 'success');
      } catch (error) {
        await handleButtonInteraction('quick-action', target.element, 'error');
        throw error;
      } finally {
        // Return to default state after delay
        setTimeout(() => {
          void handleButtonInteraction('quick-action', target.element, 'default');
        }, 1500);
      }
    }
  }, [onQuickAction, handleButtonInteraction]);
  
  /**
   * Performance monitoring
   */
  useEffect(() => {
    if (!metrics) return;
    
    const updateMetrics = (): void => {
      const newMetrics: AnimationMetrics = {
        frameRate: 60, // This would be calculated from actual frame timing
        animationCount: buttonManagersRef.current.size,
        averageAnimationDuration: finalConfig.animationSpeed === 'fast' ? 150 : 
                                 finalConfig.animationSpeed === 'slow' ? 500 : 300,
        memoryUsage: (performance as any).memory?.usedJSHeapSize ?? 0,
      };
      
      animationMetricsRef.current = newMetrics;
      setPerformanceMetrics(newMetrics);
    };
    
    const interval = setInterval(updateMetrics, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [metrics, finalConfig.animationSpeed]);
  
  /**
   * Generate theme-aware styles
   */
  const keyboardStyles = React.useMemo(() => {
    if (!currentTheme) return {};
    
    return {
      fontFamily: currentTheme.typography.fontFamily,
      fontSize: currentTheme.typography.fontSize.base,
      color: currentTheme.colors.text,
      backgroundColor: currentTheme.components.keyboard.background,
      border: `1px solid ${currentTheme.components.keyboard.border}`,
      borderRadius: currentTheme.components.keyboard.borderRadius,
      boxShadow: currentTheme.components.keyboard.shadow,
      padding: currentTheme.spacing.md,
      transition: finalConfig.enableAnimations 
        ? `all ${currentTheme.animations.duration.normal}ms ${currentTheme.animations.easing.easeInOut}`
        : 'none',
      zIndex: currentTheme.zIndex.keyboard,
    };
  }, [currentTheme, finalConfig.enableAnimations]);
  
  /**
   * Announcement for accessibility
   */
  const announcement = React.useMemo(() => {
    if (isAnimating) {
      return currentState === 'expanding' 
        ? 'Keyboard is appearing'
        : currentState === 'collapsing'
        ? 'Keyboard is disappearing'
        : 'Keyboard is animating';
    }
    
    return currentState === 'visible'
      ? 'Keyboard is ready for interaction'
      : 'Keyboard is hidden';
  }, [currentState, isAnimating]);
  
  return (
    <div
      ref={ref ?? keyboardRef}
      style={keyboardStyles}
      className={`animated-keyboard animated-keyboard--${platform} animated-keyboard--${currentState}`}
      data-platform={platform}
      data-state={currentState}
      data-animating={isAnimating}
      data-theme={currentTheme?.name.toLowerCase()}
      role="toolbar"
      aria-label="AI-powered keyboard interface"
      aria-description={announcement}
      aria-live="polite"
      {...props}
    >
      {/* Theme CSS injection */}
      {currentTheme && (
        <style>
          {themeManager.generateCSSVariables(currentTheme)}
        </style>
      )}
      
      {/* Keyboard content */}
      <div className="animated-keyboard__content">
        <div className="animated-keyboard__header">
          <span>AI Keyboard ({currentTheme?.name})</span>
          {isAnimating && (
            <span className="animated-keyboard__status">Animating...</span>
          )}
        </div>
        
        <div className="animated-keyboard__body">
          <p>Enhanced keyboard with animations, states, and theming</p>
          <p>Current state: {currentState}</p>
          <p>Platform: {platform}</p>
          
          {/* Sample interactive buttons */}
          <div className="animated-keyboard__actions">
            <button
              type="button"
              onClick={() => void handleToneSelect({
                tone: 'professional',
                mode: 'quick',
                targetElement
              })}
            >
              Professional Tone
            </button>
            
            <button
              type="button"
              onClick={() => void handleQuickAction({
                action: 'generate',
                targetElement
              })}
            >
              Generate
            </button>
          </div>
        </div>
        
        {/* Performance metrics display */}
        {performanceMetrics && (
          <div className="animated-keyboard__metrics">
            <h4>Performance Metrics</h4>
            <div>Frame Rate: {performanceMetrics.frameRate} FPS</div>
            <div>Active Animations: {performanceMetrics.animationCount}</div>
            <div>Avg Duration: {performanceMetrics.averageAnimationDuration}ms</div>
            <div>Memory Usage: {Math.round(performanceMetrics.memoryUsage / 1024 / 1024)}MB</div>
          </div>
        )}
      </div>
    </div>
  );
});

AnimatedKeyboard.displayName = 'AnimatedKeyboard';

/**
 * Utility hook for managing keyboard animations
 */
export function useKeyboardAnimation(
  element: HTMLElement | null,
  platform: Platform
) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentState, setCurrentState] = useState<KeyboardVisualState>('hidden');
  
  const animate = useCallback(async (
    type: 'slideIn' | 'slideOut' | 'press' | 'success' | 'error',
    options?: { duration?: number; direction?: 'top' | 'bottom' }
  ) => {
    if (!element) return;
    
    setIsAnimating(true);
    
    try {
      let animation: Animation;
      
      switch (type) {
        case 'slideIn':
          animation = animationManager.slideInKeyboard(element, options?.direction);
          setCurrentState('expanding');
          break;
        case 'slideOut':
          animation = animationManager.slideOutKeyboard(element, options?.direction);
          setCurrentState('collapsing');
          break;
        case 'press':
          animation = animationManager.pressButton(element);
          break;
        case 'success':
          animation = animationManager.showSuccess(element);
          break;
        case 'error':
          animation = animationManager.showError(element);
          break;
        default:
          return;
      }
      
      await animation.finished;
      
      if (type === 'slideIn') {
        setCurrentState('visible');
      } else if (type === 'slideOut') {
        setCurrentState('hidden');
      }
    } finally {
      setIsAnimating(false);
    }
  }, [element]);
  
  return {
    animate,
    isAnimating,
    currentState,
  };
}

/**
 * Hook for managing platform-specific theming
 */
export function useKeyboardTheme(platform: Platform, autoDetect = true) {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  
  useEffect(() => {
    if (autoDetect) {
      const detectedPlatform = ThemeDetection.detectPlatform();
      const theme = ThemeDetection.getAdaptiveTheme(detectedPlatform);
      setCurrentTheme(theme);
      themeManager.setTheme(detectedPlatform);
    } else {
      const theme = themeManager.getTheme(platform);
      setCurrentTheme(theme);
      themeManager.setTheme(platform);
    }
    
    const listener = (theme: Theme): void => {
      setCurrentTheme(theme);
    };
    
    themeManager.addListener(listener);
    
    return () => {
      themeManager.removeListener(listener);
    };
  }, [platform, autoDetect]);
  
  return {
    theme: currentTheme,
    setTheme: (newPlatform: Platform) => {
      themeManager.setTheme(newPlatform);
    },
    detectPlatform: ThemeDetection.detectPlatform,
    generateCSS: (theme: Theme) => themeManager.generateCSSVariables(theme),
  };
}