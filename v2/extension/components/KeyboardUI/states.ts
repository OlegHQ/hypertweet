/**
 * Visual State Management for KeyboardUI Components
 * 
 * Provides comprehensive state management for UI components with
 * platform-specific adaptations and smooth state transitions.
 */

import type { Platform } from '../../injection/types.js';

/**
 * Base visual states for UI components
 */
export type BaseVisualState = 'hidden' | 'visible' | 'loading' | 'error' | 'disabled';

/**
 * Keyboard-specific visual states
 */
export type KeyboardState = 
  | 'hidden'
  | 'visible' 
  | 'expanding'
  | 'collapsing'
  | 'loading'
  | 'error'
  | 'disabled'
  | 'minimized';

/**
 * Button visual states
 */
export type ButtonState = 
  | 'default'
  | 'hover'
  | 'active'
  | 'pressed'
  | 'focused'
  | 'disabled'
  | 'loading'
  | 'success'
  | 'error'
  | 'selected';

/**
 * Input/text area visual states
 */
export type InputState = 
  | 'default'
  | 'focused'
  | 'typing'
  | 'disabled'
  | 'readonly'
  | 'error'
  | 'success'
  | 'loading';

/**
 * Dropdown/selector visual states
 */
export type DropdownState = 
  | 'closed'
  | 'opening'
  | 'open'
  | 'closing'
  | 'disabled'
  | 'loading'
  | 'error';

/**
 * Theme states for visual feedback
 */
export type ThemeState = 'light' | 'dark' | 'auto' | 'platform' | 'switching';

/**
 * Animation states
 */
export type AnimationState = 'idle' | 'running' | 'paused' | 'finished' | 'cancelled';

/**
 * State transition configuration
 */
export interface StateTransition<T extends string = string> {
  readonly from: T;
  readonly to: T;
  readonly duration: number;
  readonly easing: string;
  readonly allowInterrupt: boolean;
}

/**
 * Visual state configuration
 */
export interface VisualStateConfig {
  readonly styles: Record<string, string>;
  readonly classes: readonly string[];
  readonly attributes: Record<string, string>;
  readonly animations?: string;
  readonly accessibility?: {
    readonly ariaLabel?: string;
    readonly ariaDescription?: string;
    readonly ariaState?: Record<string, string>;
  };
}

/**
 * Platform-specific state configuration
 */
export interface PlatformStateConfig {
  readonly platform: Platform;
  readonly states: Record<string, VisualStateConfig>;
  readonly transitions: readonly StateTransition[];
  readonly defaultState: string;
}

/**
 * State manager interface
 */
export interface StateManager<T extends string = string> {
  readonly currentState: T;
  readonly previousState: T | null;
  readonly isTransitioning: boolean;
  setState(newState: T): Promise<void>;
  canTransition(from: T, to: T): boolean;
  getStateConfig(state: T): VisualStateConfig | null;
  reset(): void;
}

/**
 * Keyboard state configurations
 */
export const KEYBOARD_STATE_CONFIGS: Record<KeyboardState, VisualStateConfig> = {
  hidden: {
    styles: {
      display: 'none',
      opacity: '0',
      transform: 'translateY(100%)',
      visibility: 'hidden',
    },
    classes: ['keyboard-hidden'],
    attributes: {
      'aria-hidden': 'true',
      'data-state': 'hidden',
    },
    accessibility: {
      ariaLabel: 'Keyboard hidden',
    },
  },
  
  visible: {
    styles: {
      display: 'flex',
      opacity: '1',
      transform: 'translateY(0)',
      visibility: 'visible',
    },
    classes: ['keyboard-visible'],
    attributes: {
      'aria-hidden': 'false',
      'data-state': 'visible',
    },
    accessibility: {
      ariaLabel: 'Keyboard visible',
      ariaDescription: 'AI-powered keyboard interface for tone selection and text generation',
    },
  },
  
  expanding: {
    styles: {
      display: 'flex',
      opacity: '1',
      transform: 'translateY(0)',
      visibility: 'visible',
    },
    classes: ['keyboard-expanding'],
    attributes: {
      'aria-hidden': 'false',
      'data-state': 'expanding',
    },
    animations: 'slideInFromBottom',
    accessibility: {
      ariaLabel: 'Keyboard expanding',
    },
  },
  
  collapsing: {
    styles: {
      display: 'flex',
      opacity: '0',
      transform: 'translateY(100%)',
      visibility: 'visible',
    },
    classes: ['keyboard-collapsing'],
    attributes: {
      'aria-hidden': 'true',
      'data-state': 'collapsing',
    },
    animations: 'slideOutToBottom',
    accessibility: {
      ariaLabel: 'Keyboard collapsing',
    },
  },
  
  loading: {
    styles: {
      display: 'flex',
      opacity: '0.7',
      transform: 'translateY(0)',
      visibility: 'visible',
      cursor: 'wait',
    },
    classes: ['keyboard-loading'],
    attributes: {
      'aria-hidden': 'false',
      'aria-busy': 'true',
      'data-state': 'loading',
    },
    accessibility: {
      ariaLabel: 'Keyboard loading',
      ariaDescription: 'Loading keyboard interface, please wait',
    },
  },
  
  error: {
    styles: {
      display: 'flex',
      opacity: '1',
      transform: 'translateY(0)',
      visibility: 'visible',
      borderColor: 'var(--error-color)',
    },
    classes: ['keyboard-error'],
    attributes: {
      'aria-hidden': 'false',
      'aria-invalid': 'true',
      'data-state': 'error',
    },
    accessibility: {
      ariaLabel: 'Keyboard error',
      ariaDescription: 'Error loading keyboard interface',
    },
  },
  
  disabled: {
    styles: {
      display: 'flex',
      opacity: '0.5',
      transform: 'translateY(0)',
      visibility: 'visible',
      pointerEvents: 'none',
    },
    classes: ['keyboard-disabled'],
    attributes: {
      'aria-hidden': 'false',
      'aria-disabled': 'true',
      'data-state': 'disabled',
    },
    accessibility: {
      ariaLabel: 'Keyboard disabled',
      ariaDescription: 'Keyboard interface is currently disabled',
    },
  },
  
  minimized: {
    styles: {
      display: 'flex',
      opacity: '0.8',
      transform: 'scale(0.9) translateY(0)',
      visibility: 'visible',
      height: 'auto',
    },
    classes: ['keyboard-minimized'],
    attributes: {
      'aria-hidden': 'false',
      'aria-expanded': 'false',
      'data-state': 'minimized',
    },
    accessibility: {
      ariaLabel: 'Keyboard minimized',
      ariaDescription: 'Keyboard interface in minimized mode',
    },
  },
};

/**
 * Button state configurations
 */
export const BUTTON_STATE_CONFIGS: Record<ButtonState, VisualStateConfig> = {
  default: {
    styles: {
      opacity: '1',
      transform: 'scale(1)',
      cursor: 'pointer',
    },
    classes: ['button-default'],
    attributes: {
      'data-state': 'default',
    },
    accessibility: {
      ariaLabel: 'Button',
    },
  },
  
  hover: {
    styles: {
      opacity: '0.9',
      transform: 'scale(1.02)',
      cursor: 'pointer',
    },
    classes: ['button-hover'],
    attributes: {
      'data-state': 'hover',
    },
    accessibility: {
      ariaLabel: 'Button hovered',
    },
  },
  
  active: {
    styles: {
      opacity: '0.8',
      transform: 'scale(0.98)',
      cursor: 'pointer',
    },
    classes: ['button-active'],
    attributes: {
      'data-state': 'active',
    },
    accessibility: {
      ariaLabel: 'Button active',
    },
  },
  
  pressed: {
    styles: {
      opacity: '0.7',
      transform: 'scale(0.95)',
      cursor: 'pointer',
    },
    classes: ['button-pressed'],
    attributes: {
      'data-state': 'pressed',
    },
    accessibility: {
      ariaLabel: 'Button pressed',
    },
  },
  
  focused: {
    styles: {
      opacity: '1',
      transform: 'scale(1)',
      cursor: 'pointer',
      outline: '2px solid var(--focus-color)',
      outlineOffset: '2px',
    },
    classes: ['button-focused'],
    attributes: {
      'data-state': 'focused',
    },
    accessibility: {
      ariaLabel: 'Button focused',
    },
  },
  
  disabled: {
    styles: {
      opacity: '0.4',
      transform: 'scale(1)',
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
    classes: ['button-disabled'],
    attributes: {
      'aria-disabled': 'true',
      'data-state': 'disabled',
    },
    accessibility: {
      ariaLabel: 'Button disabled',
    },
  },
  
  loading: {
    styles: {
      opacity: '0.6',
      transform: 'scale(1)',
      cursor: 'wait',
      pointerEvents: 'none',
    },
    classes: ['button-loading'],
    attributes: {
      'aria-busy': 'true',
      'data-state': 'loading',
    },
    accessibility: {
      ariaLabel: 'Button loading',
      ariaDescription: 'Processing request, please wait',
    },
  },
  
  success: {
    styles: {
      opacity: '1',
      transform: 'scale(1)',
      cursor: 'pointer',
      backgroundColor: 'var(--success-color)',
      color: 'var(--success-text-color)',
    },
    classes: ['button-success'],
    attributes: {
      'data-state': 'success',
    },
    accessibility: {
      ariaLabel: 'Button success',
      ariaDescription: 'Action completed successfully',
    },
  },
  
  error: {
    styles: {
      opacity: '1',
      transform: 'scale(1)',
      cursor: 'pointer',
      backgroundColor: 'var(--error-color)',
      color: 'var(--error-text-color)',
    },
    classes: ['button-error'],
    attributes: {
      'aria-invalid': 'true',
      'data-state': 'error',
    },
    accessibility: {
      ariaLabel: 'Button error',
      ariaDescription: 'Action failed, click to retry',
    },
  },
  
  selected: {
    styles: {
      opacity: '1',
      transform: 'scale(1)',
      cursor: 'pointer',
      backgroundColor: 'var(--selected-color)',
      color: 'var(--selected-text-color)',
    },
    classes: ['button-selected'],
    attributes: {
      'aria-selected': 'true',
      'data-state': 'selected',
    },
    accessibility: {
      ariaLabel: 'Button selected',
      ariaDescription: 'Currently selected option',
    },
  },
};

/**
 * Platform-specific state configurations
 */
export const PLATFORM_STATE_CONFIGS: Record<Platform, PlatformStateConfig> = {
  twitter: {
    platform: 'twitter',
    states: {
      ...KEYBOARD_STATE_CONFIGS,
      visible: {
        ...KEYBOARD_STATE_CONFIGS.visible,
        styles: {
          ...KEYBOARD_STATE_CONFIGS.visible.styles,
          borderRadius: '16px',
          backgroundColor: 'rgb(15, 20, 25)',
          border: '1px solid rgb(47, 51, 54)',
        },
      },
    },
    transitions: [
      { from: 'hidden', to: 'expanding', duration: 300, easing: 'ease-out', allowInterrupt: false },
      { from: 'expanding', to: 'visible', duration: 0, easing: 'linear', allowInterrupt: false },
      { from: 'visible', to: 'collapsing', duration: 250, easing: 'ease-in', allowInterrupt: false },
      { from: 'collapsing', to: 'hidden', duration: 0, easing: 'linear', allowInterrupt: false },
    ],
    defaultState: 'hidden',
  },
  
  linkedin: {
    platform: 'linkedin',
    states: {
      ...KEYBOARD_STATE_CONFIGS,
      visible: {
        ...KEYBOARD_STATE_CONFIGS.visible,
        styles: {
          ...KEYBOARD_STATE_CONFIGS.visible.styles,
          borderRadius: '8px',
          backgroundColor: '#fff',
          border: '1px solid #e6e6e6',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    transitions: [
      { from: 'hidden', to: 'expanding', duration: 300, easing: 'ease-out', allowInterrupt: false },
      { from: 'expanding', to: 'visible', duration: 0, easing: 'linear', allowInterrupt: false },
      { from: 'visible', to: 'collapsing', duration: 250, easing: 'ease-in', allowInterrupt: false },
      { from: 'collapsing', to: 'hidden', duration: 0, easing: 'linear', allowInterrupt: false },
    ],
    defaultState: 'hidden',
  },
  
  reddit: {
    platform: 'reddit',
    states: {
      ...KEYBOARD_STATE_CONFIGS,
      visible: {
        ...KEYBOARD_STATE_CONFIGS.visible,
        styles: {
          ...KEYBOARD_STATE_CONFIGS.visible.styles,
          borderRadius: '4px',
          backgroundColor: '#1a1a1b',
          border: '1px solid #343536',
        },
      },
    },
    transitions: [
      { from: 'hidden', to: 'expanding', duration: 300, easing: 'ease-out', allowInterrupt: false },
      { from: 'expanding', to: 'visible', duration: 0, easing: 'linear', allowInterrupt: false },
      { from: 'visible', to: 'collapsing', duration: 250, easing: 'ease-in', allowInterrupt: false },
      { from: 'collapsing', to: 'hidden', duration: 0, easing: 'linear', allowInterrupt: false },
    ],
    defaultState: 'hidden',
  },
};

/**
 * State manager implementation
 */
export class VisualStateManager<T extends string = string> implements StateManager<T> {
  private _currentState: T;
  private _previousState: T | null = null;
  private _isTransitioning = false;
  private readonly stateConfigs: Record<T, VisualStateConfig>;
  private readonly transitions: readonly StateTransition<T>[];
  private readonly element: Element;
  private readonly listeners = new Set<(state: T) => void>();
  
  constructor(
    element: Element,
    initialState: T,
    stateConfigs: Record<T, VisualStateConfig>,
    transitions: readonly StateTransition<T>[] = []
  ) {
    this.element = element;
    this._currentState = initialState;
    this.stateConfigs = stateConfigs;
    this.transitions = transitions;
    
    // Apply initial state
    this.applyState(initialState);
  }
  
  /**
   * Get current state
   */
  public get currentState(): T {
    return this._currentState;
  }
  
  /**
   * Get previous state
   */
  public get previousState(): T | null {
    return this._previousState;
  }
  
  /**
   * Check if transitioning
   */
  public get isTransitioning(): boolean {
    return this._isTransitioning;
  }
  
  /**
   * Set new state with transition
   */
  public async setState(newState: T): Promise<void> {
    if (this._currentState === newState) {
      return;
    }
    
    if (this._isTransitioning) {
      const transition = this.getTransition(this._currentState, newState);
      if (!transition?.allowInterrupt) {
        return;
      }
    }
    
    this._previousState = this._currentState;
    this._isTransitioning = true;
    
    try {
      const transition = this.getTransition(this._currentState, newState);
      
      if (transition) {
        await this.executeTransition(transition, newState);
      } else {
        this.applyState(newState);
      }
      
      this._currentState = newState;
      this.notifyListeners(newState);
    } finally {
      this._isTransitioning = false;
    }
  }
  
  /**
   * Check if transition is allowed
   */
  public canTransition(from: T, to: T): boolean {
    return this.getTransition(from, to) !== null;
  }
  
  /**
   * Get state configuration
   */
  public getStateConfig(state: T): VisualStateConfig | null {
    return this.stateConfigs[state] ?? null;
  }
  
  /**
   * Reset to initial state
   */
  public reset(): void {
    const initialState = this._currentState;
    this._previousState = null;
    this._isTransitioning = false;
    this.applyState(initialState);
  }
  
  /**
   * Add state change listener
   */
  public addListener(listener: (state: T) => void): void {
    this.listeners.add(listener);
  }
  
  /**
   * Remove state change listener
   */
  public removeListener(listener: (state: T) => void): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Apply state configuration to element
   */
  private applyState(state: T): void {
    const config = this.getStateConfig(state);
    if (!config) {
      return;
    }
    
    // Apply styles
    Object.assign((this.element as HTMLElement).style, config.styles);
    
    // Apply classes
    this.element.className = config.classes.join(' ');
    
    // Apply attributes
    for (const [key, value] of Object.entries(config.attributes)) {
      this.element.setAttribute(key, value);
    }
    
    // Apply accessibility attributes
    if (config.accessibility) {
      const { ariaLabel, ariaDescription, ariaState } = config.accessibility;
      
      if (ariaLabel) {
        this.element.setAttribute('aria-label', ariaLabel);
      }
      if (ariaDescription) {
        this.element.setAttribute('aria-description', ariaDescription);
      }
      if (ariaState) {
        for (const [key, value] of Object.entries(ariaState)) {
          this.element.setAttribute(`aria-${key}`, value);
        }
      }
    }
  }
  
  /**
   * Get transition configuration
   */
  private getTransition(from: T, to: T): StateTransition<T> | null {
    return this.transitions.find(t => t.from === from && t.to === to) ?? null;
  }
  
  /**
   * Execute state transition
   */
  private async executeTransition(transition: StateTransition<T>, newState: T): Promise<void> {
    return new Promise<void>((resolve) => {
      // Create animation for transition
      const animation = this.element.animate(
        [
          // Will be filled by the actual implementation
        ],
        {
          duration: transition.duration,
          easing: transition.easing,
          fill: 'forwards',
        }
      );
      
      animation.addEventListener('finish', () => {
        this.applyState(newState);
        resolve();
      });
    });
  }
  
  /**
   * Notify state change listeners
   */
  private notifyListeners(state: T): void {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }
  }
}

/**
 * Create state manager for keyboard
 */
export function createKeyboardStateManager(
  element: Element,
  platform: Platform
): VisualStateManager<KeyboardState> {
  const platformConfig = PLATFORM_STATE_CONFIGS[platform];
  return new VisualStateManager(
    element,
    platformConfig.defaultState as KeyboardState,
    platformConfig.states as Record<KeyboardState, VisualStateConfig>,
    platformConfig.transitions as StateTransition<KeyboardState>[]
  );
}

/**
 * Create state manager for button
 */
export function createButtonStateManager(
  element: Element
): VisualStateManager<ButtonState> {
  const defaultTransitions: StateTransition<ButtonState>[] = [
    { from: 'default', to: 'hover', duration: 150, easing: 'ease-out', allowInterrupt: true },
    { from: 'hover', to: 'default', duration: 150, easing: 'ease-in', allowInterrupt: true },
    { from: 'default', to: 'active', duration: 100, easing: 'ease-out', allowInterrupt: true },
    { from: 'active', to: 'default', duration: 100, easing: 'ease-in', allowInterrupt: true },
    { from: 'default', to: 'loading', duration: 200, easing: 'ease-out', allowInterrupt: false },
    { from: 'loading', to: 'success', duration: 300, easing: 'ease-out', allowInterrupt: false },
    { from: 'loading', to: 'error', duration: 300, easing: 'ease-out', allowInterrupt: false },
    { from: 'success', to: 'default', duration: 1000, easing: 'ease-in', allowInterrupt: true },
    { from: 'error', to: 'default', duration: 1000, easing: 'ease-in', allowInterrupt: true },
  ];
  
  return new VisualStateManager(
    element,
    'default',
    BUTTON_STATE_CONFIGS,
    defaultTransitions
  );
}

/**
 * State utility functions
 */
export const StateUtils = {
  /**
   * Check if state is loading
   */
  isLoadingState(state: string): boolean {
    return state.includes('loading') || state === 'expanding';
  },
  
  /**
   * Check if state is error
   */
  isErrorState(state: string): boolean {
    return state.includes('error');
  },
  
  /**
   * Check if state is disabled
   */
  isDisabledState(state: string): boolean {
    return state.includes('disabled');
  },
  
  /**
   * Check if state is interactive
   */
  isInteractiveState(state: string): boolean {
    return !this.isLoadingState(state) && !this.isErrorState(state) && !this.isDisabledState(state);
  },
  
  /**
   * Get state priority for conflict resolution
   */
  getStatePriority(state: string): number {
    const priorities: Record<string, number> = {
      error: 100,
      disabled: 90,
      loading: 80,
      success: 70,
      active: 60,
      focused: 50,
      hover: 40,
      selected: 30,
      visible: 20,
      default: 10,
      hidden: 0,
    };
    
    return priorities[state] ?? 5;
  },
} as const;