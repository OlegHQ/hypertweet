/**
 * Twitter-Specific DOM Utilities
 * 
 * Handles Twitter's unique DOM structure, theme detection, modal handling,
 * and Twitter-specific behaviors for optimal keyboard injection.
 */

import { DOMUtils, type DOMElementConfig } from '../domUtils.js';
import { createPlatformDetectionError, type PlatformDetectionError } from '../types.js';
import { TwitterSelectorValidator } from './TwitterSelectors.js';

/**
 * Twitter-specific positioning strategies
 */
export type TwitterPositionStrategy = 
  | 'below-compose'     // Below the compose text area
  | 'toolbar-append'    // Append to existing toolbar
  | 'toolbar-prepend'   // Prepend to existing toolbar
  | 'modal-bottom'      // Bottom of modal compose
  | 'sidebar-inject'    // Inject in sidebar context
  | 'floating-overlay'; // Floating overlay positioning

/**
 * Twitter theme information
 */
export interface TwitterTheme {
  readonly isDark: boolean;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderColor: string;
}

/**
 * Twitter compose context information
 */
export interface TwitterComposeContext {
  readonly type: 'main' | 'reply' | 'quote' | 'modal' | 'unknown';
  readonly element: HTMLElement;
  readonly toolbar: HTMLElement | null;
  readonly container: HTMLElement | null;
  readonly characterLimit: number;
  readonly isThreaded: boolean;
  readonly parentTweetId?: string;
}

/**
 * Twitter injection positioning result
 */
export interface TwitterPositionResult {
  readonly success: boolean;
  readonly strategy: TwitterPositionStrategy;
  readonly element: HTMLElement;
  readonly position: DOMRect;
  readonly theme: TwitterTheme;
  readonly context: TwitterComposeContext;
  readonly error?: PlatformDetectionError;
}

/**
 * Twitter DOM utilities namespace
 */
export namespace TwitterDOM {
  
  // Constants for Twitter-specific behavior
  const TWITTER_CHARACTER_LIMIT = 280;
  const TWITTER_MODAL_Z_INDEX = 10000;
  const TWITTER_ANIMATION_DURATION = 200;
  const KEYBOARD_HEIGHT_ESTIMATE = 120;
  
  /**
   * Detects current Twitter theme
   */
  export function detectTheme(): TwitterTheme {
    const isDark = TwitterSelectorValidator.isDarkMode();
    const computedStyle = getComputedStyle(document.documentElement);
    
    // Extract Twitter's CSS custom properties
    const accentColor = computedStyle.getPropertyValue('--color-accent') || 
                       computedStyle.getPropertyValue('--twitter-blue') || 
                       '#1d9bf0';
    
    const backgroundColor = isDark 
      ? computedStyle.getPropertyValue('--color-background-dark') || '#000000'
      : computedStyle.getPropertyValue('--color-background-light') || '#ffffff';
    
    const textColor = isDark
      ? computedStyle.getPropertyValue('--color-text-dark') || '#ffffff'
      : computedStyle.getPropertyValue('--color-text-light') || '#0f1419';
    
    const borderColor = isDark
      ? computedStyle.getPropertyValue('--color-border-dark') || '#2f3336'
      : computedStyle.getPropertyValue('--color-border-light') || '#eff3f4';
    
    return {
      isDark,
      accentColor,
      backgroundColor,
      textColor,
      borderColor,
    };
  }
  
  /**
   * Analyzes compose context for optimal injection
   */
  export function analyzeComposeContext(composeElement: HTMLElement): TwitterComposeContext {
    const type = TwitterSelectorValidator.getComposeContext(composeElement);
    
    // Find toolbar element
    const toolbar = findToolbarElement(composeElement);
    
    // Find container element
    const container = findContainerElement(composeElement, type);
    
    // Determine character limit based on context
    const characterLimit = getCharacterLimit(type);
    
    // Check if this is part of a thread
    const isThreaded = isThreadedCompose(composeElement);
    
    // Extract parent tweet ID if in reply context
    const parentTweetId = type === 'reply' ? extractParentTweetId(composeElement) : undefined;
    
    return {
      type,
      element: composeElement,
      toolbar,
      container,
      characterLimit,
      isThreaded,
      parentTweetId,
    };
  }
  
  /**
   * Creates a Twitter-themed keyboard element
   */
  export function createTwitterKeyboard(theme: TwitterTheme): HTMLElement {
    const config: DOMElementConfig = {
      tag: 'div',
      className: 'hypertweet-twitter-keyboard',
      attributes: {
        'data-hypertweet-injection': 'true',
        'data-platform': 'twitter',
        'data-component': 'keyboard',
        'role': 'toolbar',
        'aria-label': 'AI Tone Selection Keyboard',
      },
      styles: {
        position: 'relative',
        width: '100%',
        'min-height': '60px',
        'max-height': '120px',
        'background-color': theme.backgroundColor,
        'border': `1px solid ${theme.borderColor}`,
        'border-radius': '16px',
        'padding': '12px',
        'margin': '8px 0',
        'box-shadow': theme.isDark 
          ? '0 2px 8px rgba(255, 255, 255, 0.1)'
          : '0 2px 8px rgba(0, 0, 0, 0.1)',
        'transition': `all ${TWITTER_ANIMATION_DURATION}ms ease-in-out`,
        'z-index': '1000',
        'overflow': 'hidden',
        'box-sizing': 'border-box',
      },
    };
    
    const result = DOMUtils.createElement(config);
    if (!result.success) {
      throw result.error ?? createPlatformDetectionError(
        'DOM_CREATION_FAILED',
        'Failed to create Twitter keyboard element'
      );
    }
    
    // Add Twitter-specific keyboard content structure
    const keyboard = result.element;
    addKeyboardContent(keyboard, theme);
    
    return keyboard;
  }
  
  /**
   * Positions keyboard element using optimal Twitter strategy
   */
  export function positionKeyboard(
    keyboard: HTMLElement,
    context: TwitterComposeContext,
    theme: TwitterTheme
  ): TwitterPositionResult {
    const strategies: TwitterPositionStrategy[] = [
      'below-compose',
      'toolbar-append',
      'modal-bottom',
      'toolbar-prepend',
      'floating-overlay',
    ];
    
    let lastError: PlatformDetectionError | undefined;
    
    for (const strategy of strategies) {
      try {
        const result = attemptPositioning(keyboard, context, strategy, theme);
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = createPlatformDetectionError(
          'POSITIONING_FAILED',
          `Strategy ${strategy} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
    
    // If all strategies failed, use fallback
    return createFallbackPosition(keyboard, context, theme, lastError);
  }
  
  /**
   * Handles Twitter modal-specific injection
   */
  export function handleModalInjection(
    keyboard: HTMLElement,
    modalElement: HTMLElement,
    theme: TwitterTheme
  ): boolean {
    try {
      // Find modal content area
      const modalContent = modalElement.querySelector('[role="dialog"] > div') ??
                          modalElement.querySelector('.modal-content') ??
                          modalElement.firstElementChild;
      
      if (!modalContent) {
        return false;
      }
      
      // Adjust keyboard styling for modal
      Object.assign(keyboard.style, {
        'z-index': (TWITTER_MODAL_Z_INDEX + 1).toString(),
        'position': 'relative',
        'margin': '12px 16px',
        'max-width': 'calc(100% - 32px)',
      });
      
      // Insert at bottom of modal content
      modalContent.appendChild(keyboard);
      
      // Set up modal close cleanup
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of Array.from(mutation.removedNodes)) {
              if (node === modalElement || modalElement.contains(node)) {
                DOMUtils.safeRemoveElement(keyboard);
                observer.disconnect();
                return;
              }
            }
          }
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      
      return true;
    } catch (error) {
      console.error('Modal injection failed:', error);
      return false;
    }
  }
  
  /**
   * Handles Twitter SPA navigation cleanup
   */
  export function setupNavigationCleanup(keyboard: HTMLElement): () => void {
    const currentUrl = window.location.href;
    
    const cleanup = (): void => {
      if (window.location.href !== currentUrl) {
        DOMUtils.safeRemoveElement(keyboard);
      }
    };
    
    // Listen for navigation events
    window.addEventListener('popstate', cleanup);
    
    // Monitor URL changes (for SPA navigation)
    let lastUrl = currentUrl;
    const urlCheckInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        cleanup();
        clearInterval(urlCheckInterval);
      }
    }, 1000);
    
    // Return cleanup function
    return (): void => {
      window.removeEventListener('popstate', cleanup);
      clearInterval(urlCheckInterval);
      DOMUtils.safeRemoveElement(keyboard);
    };
  }
  
  /**
   * Integrates keyboard with Twitter's compose area
   */
  export function integrateWithCompose(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: TwitterComposeContext
  ): boolean {
    try {
      // Monitor compose element changes
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-disabled') {
            const isDisabled = composeElement.getAttribute('aria-disabled') === 'true';
            keyboard.style.opacity = isDisabled ? '0.5' : '1';
            keyboard.style.pointerEvents = isDisabled ? 'none' : 'auto';
          }
        }
      });
      
      observer.observe(composeElement, {
        attributes: true,
        attributeFilter: ['aria-disabled', 'disabled', 'contenteditable'],
      });
      
      // Store cleanup reference
      const cleanup = (): void => {
        observer.disconnect();
      };
      
      // Register cleanup
      DOMUtils.registerForCleanup(
        keyboard,
        cleanup,
        'twitter',
        `twitter-compose-integration-${Date.now()}`
      );
      
      return true;
    } catch (error) {
      console.error('Compose integration failed:', error);
      return false;
    }
  }
  
  /**
   * Gets Twitter-specific styling for keyboard integration
   */
  export function getTwitterStyling(theme: TwitterTheme, context: TwitterComposeContext): Record<string, string> {
    const baseStyles = {
      'font-family': 'TwitterChirp, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      'font-size': '15px',
      'line-height': '20px',
      'color': theme.textColor,
      'background-color': theme.backgroundColor,
      'border-color': theme.borderColor,
    };
    
    // Context-specific adjustments
    switch (context.type) {
      case 'modal':
        return {
          ...baseStyles,
          'border-radius': '0 0 16px 16px',
          'border-top': 'none',
          'margin': '0',
          'padding': '16px 20px',
        };
        
      case 'reply':
        return {
          ...baseStyles,
          'border-radius': '12px',
          'margin': '8px 0',
          'padding': '10px 12px',
          'min-height': '50px',
        };
        
      case 'quote':
        return {
          ...baseStyles,
          'border-radius': '12px',
          'margin': '8px 0',
          'padding': '10px 12px',
          'max-height': '80px',
        };
        
      default:
        return baseStyles;
    }
  }
  
  // Helper functions
  
  function findToolbarElement(composeElement: HTMLElement): HTMLElement | null {
    // Look for toolbar in compose area
    const toolbar = composeElement.closest('div')?.querySelector('[data-testid="toolBar"]') ??
                   composeElement.parentElement?.querySelector('[data-testid="tweetButtonInline"]') ??
                   composeElement.parentElement?.querySelector('[role="group"]');
    
    return toolbar as HTMLElement | null;
  }
  
  function findContainerElement(composeElement: HTMLElement, type: TwitterComposeContext['type']): HTMLElement | null {
    switch (type) {
      case 'modal':
        return composeElement.closest('[role="dialog"]');
      case 'reply':
        return composeElement.closest('article')?.nextElementSibling as HTMLElement | null;
      case 'quote':
        return composeElement.closest('[data-testid="quote-tweet"]');
      default:
        return composeElement.closest('[data-testid="tweet-compose"]') ??
               composeElement.closest('[data-testid="primaryColumn"]');
    }
  }
  
  function getCharacterLimit(type: TwitterComposeContext['type']): number {
    // Twitter has consistent character limits across contexts
    return TWITTER_CHARACTER_LIMIT;
  }
  
  function isThreadedCompose(composeElement: HTMLElement): boolean {
    // Check if this is part of a thread
    return composeElement.closest('[data-testid="thread"]') !== null ||
           composeElement.getAttribute('aria-label')?.includes('thread') === true;
  }
  
  function extractParentTweetId(composeElement: HTMLElement): string | undefined {
    // Extract tweet ID from reply context
    const tweetElement = composeElement.closest('article');
    if (!tweetElement) return undefined;
    
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (!tweetLink) return undefined;
    
    const match = tweetLink.href.match(/\/status\/(\d+)/);
    return match?.[1];
  }
  
  function addKeyboardContent(keyboard: HTMLElement, theme: TwitterTheme): void {
    // Add basic keyboard structure
    keyboard.innerHTML = `
      <div class="hypertweet-keyboard-header" style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;
        font-weight: 500;
        color: ${theme.textColor};
        opacity: 0.8;
      ">
        <span>AI Tone Selection</span>
        <button class="hypertweet-keyboard-close" style="
          background: none;
          border: none;
          color: ${theme.textColor};
          opacity: 0.6;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: 16px;
        " aria-label="Close keyboard">×</button>
      </div>
      <div class="hypertweet-keyboard-content" style="
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        min-height: 32px;
      ">
        <div class="hypertweet-keyboard-placeholder" style="
          color: ${theme.textColor};
          opacity: 0.5;
          font-size: 14px;
        ">Loading keyboard...</div>
      </div>
    `;
    
    // Add close button functionality
    const closeButton = keyboard.querySelector('.hypertweet-keyboard-close');
    closeButton?.addEventListener('click', () => {
      DOMUtils.safeRemoveElement(keyboard);
    });
  }
  
  function attemptPositioning(
    keyboard: HTMLElement,
    context: TwitterComposeContext,
    strategy: TwitterPositionStrategy,
    theme: TwitterTheme
  ): TwitterPositionResult {
    try {
      let success = false;
      let element: HTMLElement;
      
      switch (strategy) {
        case 'below-compose':
          success = positionBelowCompose(keyboard, context);
          element = context.element;
          break;
          
        case 'toolbar-append':
          if (context.toolbar) {
            context.toolbar.appendChild(keyboard);
            success = true;
            element = context.toolbar;
          } else {
            throw new Error('No toolbar found');
          }
          break;
          
        case 'toolbar-prepend':
          if (context.toolbar) {
            context.toolbar.insertBefore(keyboard, context.toolbar.firstChild);
            success = true;
            element = context.toolbar;
          } else {
            throw new Error('No toolbar found');
          }
          break;
          
        case 'modal-bottom':
          if (context.type === 'modal' && context.container) {
            success = handleModalInjection(keyboard, context.container, theme);
            element = context.container;
          } else {
            throw new Error('Not in modal context');
          }
          break;
          
        case 'floating-overlay':
          success = positionFloatingOverlay(keyboard, context, theme);
          element = context.element;
          break;
          
        default:
          throw new Error(`Unknown strategy: ${strategy}`);
      }
      
      if (success) {
        return {
          success: true,
          strategy,
          element,
          position: keyboard.getBoundingClientRect(),
          theme,
          context,
        };
      } else {
        return {
          success: false,
          strategy,
          element: context.element,
          position: new DOMRect(),
          theme,
          context,
          error: createPlatformDetectionError(
            'POSITIONING_FAILED',
            `Strategy ${strategy} positioning failed`
          ),
        };
      }
    } catch (error) {
      return {
        success: false,
        strategy,
        element: context.element,
        position: new DOMRect(),
        theme,
        context,
        error: createPlatformDetectionError(
          'POSITIONING_FAILED',
          `Strategy ${strategy} error: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
      };
    }
  }
  
  function positionBelowCompose(keyboard: HTMLElement, context: TwitterComposeContext): boolean {
    const composeContainer = context.element.closest('div');
    if (!composeContainer) return false;
    
    // Insert after the compose container
    const nextSibling = composeContainer.nextSibling;
    if (nextSibling) {
      composeContainer.parentNode?.insertBefore(keyboard, nextSibling);
    } else {
      composeContainer.parentNode?.appendChild(keyboard);
    }
    
    return true;
  }
  
  function positionFloatingOverlay(
    keyboard: HTMLElement,
    context: TwitterComposeContext,
    theme: TwitterTheme
  ): boolean {
    // Position as floating overlay
    Object.assign(keyboard.style, {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      'z-index': '10000',
      'box-shadow': theme.isDark
        ? '0 4px 16px rgba(255, 255, 255, 0.15)'
        : '0 4px 16px rgba(0, 0, 0, 0.15)',
    });
    
    // Append to compose container with relative positioning
    const container = context.element.closest('div');
    if (!container) return false;
    
    container.style.position = 'relative';
    container.appendChild(keyboard);
    
    return true;
  }
  
  function createFallbackPosition(
    keyboard: HTMLElement,
    context: TwitterComposeContext,
    theme: TwitterTheme,
    lastError?: PlatformDetectionError
  ): TwitterPositionResult {
    // Fallback: append to body with absolute positioning
    Object.assign(keyboard.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      'z-index': '999999',
      'max-width': '300px',
    });
    
    document.body.appendChild(keyboard);
    
    return {
      success: true,
      strategy: 'floating-overlay',
      element: keyboard,
      position: keyboard.getBoundingClientRect(),
      theme,
      context,
      error: lastError,
    };
  }
}