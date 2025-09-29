/**
 * Fallback Injection Strategies
 *
 * Provides alternative injection methods when primary strategies fail,
 * including simplified UI modes, manual triggers, and progressive enhancement.
 */

import { DOMUtils } from './domUtils.js';
import {
  createPlatformDetectionError,
  type Platform,
  type PlatformDetectionError,
  type SelectorConfig,
} from './types.js';

/**
 * Fallback strategy types
 */
export type FallbackStrategy = 
  | 'simplified'    // Minimal UI with basic functionality
  | 'manual'        // User-triggered injection
  | 'observer'      // Delayed injection with observers
  | 'polling'       // Periodic retry with polling
  | 'legacy'        // Compatibility mode for older browsers
  | 'minimal'       // Bare minimum injection
  | 'alternative'   // Alternative DOM targets
  | 'floating';     // Floating UI not attached to specific elements

/**
 * Fallback strategy configuration
 */
export interface FallbackConfig {
  readonly strategy: FallbackStrategy;
  readonly priority: number; // Lower = higher priority
  readonly compatible: boolean;
  readonly description: string;
  readonly limitations: readonly string[];
}

/**
 * Fallback injection result
 */
export interface FallbackResult {
  readonly success: boolean;
  readonly strategy: FallbackStrategy;
  readonly element?: HTMLElement;
  readonly error?: PlatformDetectionError;
  readonly limitations: readonly string[];
  readonly userInstructions?: string;
}

/**
 * Simplified UI configuration
 */
export interface SimplifiedUIConfig {
  readonly showBasicButtons: boolean;
  readonly showToneSelector: boolean;
  readonly maxButtons: number;
  readonly compactMode: boolean;
}

/**
 * Manual injection trigger configuration
 */
export interface ManualTriggerConfig {
  readonly shortcut: string;
  readonly buttonText: string;
  readonly helpText: string;
  readonly position: 'corner' | 'sidebar' | 'floating';
}

/**
 * Fallback Strategies namespace
 */
export namespace FallbackStrategies {
  
  // Strategy configurations ordered by preference
  const FALLBACK_CONFIGS: readonly FallbackConfig[] = [
    {
      strategy: 'alternative',
      priority: 1,
      compatible: true,
      description: 'Try alternative DOM selectors',
      limitations: ['May have suboptimal positioning'],
    },
    {
      strategy: 'observer',
      priority: 2,
      compatible: true,
      description: 'Wait for DOM changes with observers',
      limitations: ['Delayed injection', 'May impact performance'],
    },
    {
      strategy: 'simplified',
      priority: 3,
      compatible: true,
      description: 'Simplified keyboard with basic features',
      limitations: ['Reduced functionality', 'Basic UI only'],
    },
    {
      strategy: 'polling',
      priority: 4,
      compatible: true,
      description: 'Periodic retry with polling mechanism',
      limitations: ['Performance impact', 'May be delayed'],
    },
    {
      strategy: 'floating',
      priority: 5,
      compatible: true,
      description: 'Floating keyboard not attached to page elements',
      limitations: ['Fixed position', 'May obstruct content'],
    },
    {
      strategy: 'manual',
      priority: 6,
      compatible: true,
      description: 'Manual activation by user',
      limitations: ['Requires user action', 'Not automatic'],
    },
    {
      strategy: 'legacy',
      priority: 7,
      compatible: isLegacyBrowserSupported(),
      description: 'Legacy compatibility mode',
      limitations: ['Limited features', 'Basic styling only'],
    },
    {
      strategy: 'minimal',
      priority: 8,
      compatible: true,
      description: 'Minimal injection with core features only',
      limitations: ['Very basic functionality', 'No advanced features'],
    },
  ] as const;

  /**
   * Get available fallback strategies sorted by priority
   */
  export function getAvailableStrategies(platform: Platform): readonly FallbackConfig[] {
    return FALLBACK_CONFIGS
      .filter(config => config.compatible)
      .filter(config => isPlatformCompatible(config.strategy, platform))
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute fallback strategy
   */
  export async function executeStrategy(
    strategy: FallbackStrategy,
    platform: Platform,
    context: {
      readonly originalError: PlatformDetectionError;
      readonly targetSelector?: string;
      readonly fallbackSelectors?: readonly string[];
    }
  ): Promise<FallbackResult> {
    try {
      switch (strategy) {
        case 'alternative':
          return await executeAlternativeStrategy(platform, context);
        
        case 'simplified':
          return await executeSimplifiedStrategy(platform, context);
        
        case 'observer':
          return await executeObserverStrategy(platform, context);
        
        case 'polling':
          return await executePollingStrategy(platform, context);
        
        case 'floating':
          return await executeFloatingStrategy(platform, context);
        
        case 'manual':
          return await executeManualStrategy(platform, context);
        
        case 'legacy':
          return await executeLegacyStrategy(platform, context);
        
        case 'minimal':
          return await executeMinimalStrategy(platform, context);
        
        default:
          throw createPlatformDetectionError(
            'CONFIGURATION_ERROR',
            `Unsupported fallback strategy: ${strategy}`,
            { strategy, platform }
          );
      }
    } catch (error) {
      const fallbackError = error instanceof Error 
        ? createPlatformDetectionError(
            'INJECTION_FAILED',
            `Fallback strategy '${strategy}' failed: ${error.message}`,
            { strategy, platform, originalError: error.message }
          )
        : createPlatformDetectionError(
            'INJECTION_FAILED',
            `Fallback strategy '${strategy}' failed`,
            { strategy, platform }
          );

      return {
        success: false,
        strategy,
        error: fallbackError,
        limitations: [],
      };
    }
  }

  /**
   * Try all available fallback strategies in order
   */
  export async function tryAllStrategies(
    platform: Platform,
    context: {
      readonly originalError: PlatformDetectionError;
      readonly targetSelector?: string;
      readonly fallbackSelectors?: readonly string[];
    }
  ): Promise<FallbackResult> {
    const strategies = getAvailableStrategies(platform);
    
    let lastError: PlatformDetectionError = context.originalError;
    
    for (const config of strategies) {
      const result = await executeStrategy(config.strategy, platform, {
        ...context,
        originalError: lastError,
      });
      
      if (result.success) {
        return result;
      }
      
      if (result.error) {
        lastError = result.error;
      }
    }
    
    // If all strategies failed, return the last error
    return {
      success: false,
      strategy: 'minimal',
      error: createPlatformDetectionError(
        'INJECTION_FAILED',
        'All fallback strategies failed',
        { platform, strategiesAttempted: strategies.length }
      ),
      limitations: ['No working injection method found'],
    };
  }

  /**
   * Alternative selector strategy - try different DOM selectors
   */
  async function executeAlternativeStrategy(
    platform: Platform,
    context: { readonly fallbackSelectors?: readonly string[] }
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    const selectors = context.fallbackSelectors ?? getAlternativeSelectors(platform);
    
    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && isElementSuitableForInjection(element)) {
        return {
          success: true,
          strategy: 'alternative',
          element,
          limitations: ['May have suboptimal positioning'],
        };
      }
    }
    
    throw new Error('No alternative selectors found suitable elements');
  }

  /**
   * Simplified UI strategy - create basic keyboard with limited features
   */
  async function executeSimplifiedStrategy(
    platform: Platform,
    context: { readonly targetSelector?: string }
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    const config: SimplifiedUIConfig = {
      showBasicButtons: true,
      showToneSelector: false,
      maxButtons: 5,
      compactMode: true,
    };

    // Find any suitable container
    const container = findSuitableContainer() ?? document.body;
    
    const element = createSimplifiedKeyboard(config);
    container.appendChild(element);
    
    return {
      success: true,
      strategy: 'simplified',
      element,
      limitations: [
        'Reduced functionality',
        'Basic UI only',
        'No advanced features',
      ],
      userInstructions: 'A simplified keyboard has been loaded with basic features.',
    };
  }

  /**
   * Observer strategy - use MutationObserver to wait for elements
   */
  async function executeObserverStrategy(
    platform: Platform,
    context: { readonly targetSelector?: string }
  ): Promise<FallbackResult> {
    const selector = context.targetSelector ?? getDefaultSelector(platform);
    
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && isElementSuitableForInjection(element)) {
          observer.disconnect();
          clearTimeout(timeoutId);
          
          resolve({
            success: true,
            strategy: 'observer',
            element,
            limitations: ['Delayed injection'],
          });
        }
      });
      
      // Observe DOM changes
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id'],
      });
      
      // Timeout after 10 seconds
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve({
          success: false,
          strategy: 'observer',
          error: createPlatformDetectionError(
            'DETECTION_TIMEOUT',
            'Observer strategy timed out waiting for suitable element',
            { selector, platform }
          ),
          limitations: ['Timed out waiting for elements'],
        });
      }, 10000);
    });
  }

  /**
   * Polling strategy - periodically retry injection
   */
  async function executePollingStrategy(
    platform: Platform,
    context: { readonly targetSelector?: string }
  ): Promise<FallbackResult> {
    const selector = context.targetSelector ?? getDefaultSelector(platform);
    const maxAttempts = 20;
    const interval = 500;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element && isElementSuitableForInjection(element)) {
        return {
          success: true,
          strategy: 'polling',
          element,
          limitations: ['May have been delayed'],
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Polling strategy timed out');
  }

  /**
   * Floating strategy - create floating keyboard
   */
  async function executeFloatingStrategy(
    platform: Platform,
    context: Record<string, unknown>
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    const element = createFloatingKeyboard(platform);
    document.body.appendChild(element);
    
    return {
      success: true,
      strategy: 'floating',
      element,
      limitations: [
        'Fixed position',
        'May obstruct content',
        'Not contextually positioned',
      ],
      userInstructions: 'A floating keyboard has been added. You can drag it to reposition.',
    };
  }

  /**
   * Manual strategy - create manual trigger
   */
  async function executeManualStrategy(
    platform: Platform,
    context: Record<string, unknown>
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    const config: ManualTriggerConfig = {
      shortcut: 'Ctrl+Shift+K',
      buttonText: 'Show Keyboard',
      helpText: 'Click to activate keyboard or use Ctrl+Shift+K',
      position: 'corner',
    };

    const element = createManualTrigger(config, platform);
    document.body.appendChild(element);
    
    return {
      success: true,
      strategy: 'manual',
      element,
      limitations: [
        'Requires user action',
        'Not automatic',
        'Manual activation only',
      ],
      userInstructions: `${config.helpText}`,
    };
  }

  /**
   * Legacy strategy - basic compatibility mode
   */
  async function executeLegacyStrategy(
    platform: Platform,
    context: Record<string, unknown>
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    if (!isLegacyBrowserSupported()) {
      throw new Error('Legacy browser support not available');
    }

    const element = createLegacyKeyboard(platform);
    const container = findSuitableContainer() ?? document.body;
    container.appendChild(element);
    
    return {
      success: true,
      strategy: 'legacy',
      element,
      limitations: [
        'Limited features',
        'Basic styling only',
        'Reduced functionality',
      ],
    };
  }

  /**
   * Minimal strategy - bare minimum injection
   */
  async function executeMinimalStrategy(
    platform: Platform,
    context: Record<string, unknown>
  ): Promise<FallbackResult> {
    await Promise.resolve(); // Ensure function is properly async
    const element = createMinimalKeyboard(platform);
    const container = findSuitableContainer() ?? document.body;
    container.appendChild(element);
    
    return {
      success: true,
      strategy: 'minimal',
      element,
      limitations: [
        'Very basic functionality',
        'No advanced features',
        'Minimal UI',
      ],
    };
  }

  /**
   * Helper functions
   */
  
  function isPlatformCompatible(strategy: FallbackStrategy, platform: Platform): boolean {
    // All strategies are compatible with all platforms for now
    // In the future, this could be more specific
    return true;
  }

  function isElementSuitableForInjection(element: HTMLElement): boolean {
    // Check if element is visible
    if (!DOMUtils.isElementVisible(element)) {
      return false;
    }

    // Check if element is safe to modify
    if (!DOMUtils.isElementSafeToModify(element)) {
      return false;
    }

    // Check minimum size requirements
    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) {
      return false;
    }

    // Check if element is interactive
    const style = window.getComputedStyle(element);
    const isDisabled = 'disabled' in element && (element as HTMLInputElement).disabled;
    const isInteractive = style.pointerEvents !== 'none' && 
                          !isDisabled &&
                          element.tabIndex >= -1;
    
    return isInteractive;
  }

  function isLegacyBrowserSupported(): boolean {
    // Check for basic modern browser features that are required
    // MutationObserver and querySelector are essential for the injection system
    return !!(window.MutationObserver && document.querySelector);
  }

  function getAlternativeSelectors(platform: Platform): readonly string[] {
    const commonSelectors = [
      '[role="textbox"]',
      'textarea',
      'input[type="text"]',
      '.compose',
      '.editor',
      '[contenteditable="true"]',
    ];

    const platformSpecific: Record<Platform, readonly string[]> = {
      twitter: [
        '[data-testid="tweetTextarea_0"]',
        '.DraftEditor-editorContainer',
        '.public-DraftEditor-content',
        '[aria-label*="Tweet"]',
      ],
      linkedin: [
        '.ql-editor',
        '[role="textbox"]',
        '.share-creation-state__text-editor',
        '[data-placeholder*="Share"]',
      ],
      reddit: [
        '.public-DraftStyleDefault-block',
        '[data-testid="comment-input"]',
        '.Comment__textarea',
        '[placeholder*="comment"]',
      ],
    };

    return [...(platformSpecific[platform] ?? []), ...commonSelectors];
  }

  function getDefaultSelector(platform: Platform): string {
    const defaults: Record<Platform, string> = {
      twitter: '[data-testid="tweetTextarea_0"]',
      linkedin: '.ql-editor',
      reddit: '[data-testid="comment-input"]',
    };

    return defaults[platform] ?? '[role="textbox"]';
  }

  function findSuitableContainer(): HTMLElement | null {
    const selectors = [
      'main',
      '[role="main"]',
      '.content',
      '#content',
      '.container',
      'body > div:first-child',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        return element;
      }
    }

    return null;
  }

  function createSimplifiedKeyboard(config: SimplifiedUIConfig): HTMLElement {
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard-simplified';
    keyboard.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `;

    if (config.showBasicButtons) {
      const buttons = ['Professional', 'Casual', 'Friendly'];
      buttons.slice(0, config.maxButtons).forEach(tone => {
        const button = document.createElement('button');
        button.textContent = tone;
        button.style.cssText = `
          display: block;
          width: 100%;
          margin-bottom: 8px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f8f9fa;
          cursor: pointer;
        `;
        keyboard.appendChild(button);
      });
    }

    return keyboard;
  }

  function createFloatingKeyboard(platform: Platform): HTMLElement {
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard-floating';
    keyboard.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      cursor: move;
      max-width: 300px;
    `;

    keyboard.innerHTML = `
      <div style="text-align: center; margin-bottom: 12px; font-weight: bold;">
        AI Keyboard (${platform})
      </div>
      <div style="font-size: 12px; color: #666; text-align: center;">
        Drag to reposition
      </div>
    `;

    // Make draggable
    makeDraggable(keyboard);

    return keyboard;
  }

  function createManualTrigger(config: ManualTriggerConfig, platform: Platform): HTMLElement {
    const trigger = document.createElement('button');
    trigger.className = 'keyboard-manual-trigger';
    trigger.textContent = config.buttonText;
    
    const positions = {
      corner: 'position: fixed; bottom: 20px; right: 20px;',
      sidebar: 'position: fixed; top: 50%; right: 0; transform: translateY(-50%);',
      floating: 'position: fixed; top: 20px; right: 20px;',
    };

    trigger.style.cssText = `
      ${positions[config.position]}
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px 16px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
    `;

    trigger.title = config.helpText;

    // Add click handler (would integrate with actual keyboard in real implementation)
    trigger.addEventListener('click', () => {
      console.log('Manual keyboard trigger activated');
      // In real implementation, this would trigger the keyboard
    });

    return trigger;
  }

  function createLegacyKeyboard(platform: Platform): HTMLElement {
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard-legacy';
    keyboard.innerHTML = `
      <div style="background: #f0f0f0; border: 1px solid #999; padding: 10px; margin: 10px 0;">
        <strong>AI Keyboard (Legacy Mode)</strong><br>
        <small>Basic functionality for ${platform}</small>
      </div>
    `;

    return keyboard;
  }

  function createMinimalKeyboard(platform: Platform): HTMLElement {
    const keyboard = document.createElement('div');
    keyboard.className = 'keyboard-minimal';
    keyboard.style.cssText = `
      background: #fff;
      border: 1px solid #ccc;
      padding: 8px;
      margin: 8px 0;
      font-size: 12px;
    `;
    keyboard.textContent = `AI Keyboard (Minimal) - ${platform}`;

    return keyboard;
  }

  function makeDraggable(element: HTMLElement): void {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = element.getBoundingClientRect();
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        element.style.left = `${e.clientX - dragOffset.x}px`;
        element.style.top = `${e.clientY - dragOffset.y}px`;
        element.style.transform = 'none';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}