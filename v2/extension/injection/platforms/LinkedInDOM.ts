/**
 * LinkedIn DOM Utilities - Comprehensive 2024 Implementation
 * 
 * LinkedIn-specific DOM manipulation utilities including theme detection,
 * positioning strategies, and integration with LinkedIn's UI patterns.
 */

import { createPlatformDetectionError, type PlatformDetectionError } from '../types.js';

/**
 * LinkedIn theme detection result
 */
export interface LinkedInTheme {
  readonly isDark: boolean;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly accentColor: string;
  readonly cardBackgroundColor: string;
  readonly hoverColor: string;
  readonly focusColor: string;
}

/**
 * LinkedIn compose context information
 */
export interface LinkedInComposeContext {
  readonly type: 'post' | 'comment' | 'message' | 'article' | 'company' | 'unknown';
  readonly container: HTMLElement;
  readonly editor: HTMLElement;
  readonly form: HTMLElement | null;
  readonly isModal: boolean;
  readonly isQuillEditor: boolean;
  readonly hasToolbar: boolean;
  readonly position: {
    readonly top: number;
    readonly left: number;
    readonly width: number;
    readonly height: number;
  };
}

/**
 * LinkedIn positioning strategy options
 */
export type LinkedInPositionStrategy = 
  | 'after_editor'
  | 'before_toolbar'
  | 'in_footer'
  | 'beside_actions'
  | 'above_form'
  | 'custom';

/**
 * LinkedIn positioning result
 */
export interface LinkedInPositionResult {
  readonly success: boolean;
  readonly strategy: LinkedInPositionStrategy;
  readonly finalPosition: DOMRect | null;
  readonly error?: PlatformDetectionError;
  readonly adjustments?: {
    readonly originalStrategy: LinkedInPositionStrategy;
    readonly appliedStrategy: LinkedInPositionStrategy;
    readonly reason: string;
  };
}

/**
 * LinkedIn DOM manipulation utilities namespace
 */
export namespace LinkedInDOM {

  /**
   * Detects current LinkedIn theme (light/dark mode)
   */
  export function detectTheme(): LinkedInTheme {
    try {
      // Check for dark mode class on body or html
      const isDarkMode = 
        document.body.classList.contains('theme--dark') ||
        document.documentElement.classList.contains('theme--dark') ||
        document.body.classList.contains('dark-theme') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      // LinkedIn's color scheme
      if (isDarkMode) {
        return {
          isDark: true,
          backgroundColor: 'rgb(25, 25, 25)',
          textColor: 'rgb(255, 255, 255)',
          borderColor: 'rgb(54, 54, 54)',
          accentColor: 'rgb(112, 181, 249)',
          cardBackgroundColor: 'rgb(34, 34, 34)',
          hoverColor: 'rgba(112, 181, 249, 0.1)',
          focusColor: 'rgba(112, 181, 249, 0.2)',
        };
      } else {
        return {
          isDark: false,
          backgroundColor: 'rgb(255, 255, 255)',
          textColor: 'rgb(0, 0, 0)',
          borderColor: 'rgb(220, 220, 220)',
          accentColor: 'rgb(10, 102, 194)',
          cardBackgroundColor: 'rgb(255, 255, 255)',
          hoverColor: 'rgba(10, 102, 194, 0.1)',
          focusColor: 'rgba(10, 102, 194, 0.2)',
        };
      }
    } catch (error) {
      // Fallback to light theme
      return {
        isDark: false,
        backgroundColor: 'rgb(255, 255, 255)',
        textColor: 'rgb(0, 0, 0)',
        borderColor: 'rgb(220, 220, 220)',
        accentColor: 'rgb(10, 102, 194)',
        cardBackgroundColor: 'rgb(255, 255, 255)',
        hoverColor: 'rgba(10, 102, 194, 0.1)',
        focusColor: 'rgba(10, 102, 194, 0.2)',
      };
    }
  }

  /**
   * Analyzes LinkedIn compose context for optimal integration
   */
  export function analyzeComposeContext(composeElement: HTMLElement): LinkedInComposeContext {
    const context = getComposeType(composeElement);
    const container = findContainer(composeElement);
    const form = composeElement.closest('form') as HTMLElement | null;
    const isModal = isInModal(composeElement);
    const isQuillEditor = isQuillEditorElement(composeElement);
    const hasToolbar = hasEditorToolbar(composeElement);

    const rect = composeElement.getBoundingClientRect();

    return {
      type: context,
      container,
      editor: composeElement,
      form,
      isModal,
      isQuillEditor,
      hasToolbar,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  /**
   * Positions keyboard element optimally for LinkedIn context
   */
  export function positionKeyboard(
    keyboard: HTMLElement,
    context: LinkedInComposeContext,
    theme: LinkedInTheme,
    preferredStrategy: LinkedInPositionStrategy = 'after_editor'
  ): LinkedInPositionResult {
    try {
      const strategies: LinkedInPositionStrategy[] = [
        preferredStrategy,
        'after_editor',
        'before_toolbar',
        'in_footer',
        'beside_actions',
        'above_form',
      ];

      // Remove duplicates while preserving order
      const uniqueStrategies = Array.from(new Set(strategies));

      for (const strategy of uniqueStrategies) {
        const result = applyPositioningStrategy(keyboard, context, strategy, theme);
        if (result.success) {
          return result;
        }
      }

      // If all strategies fail, use custom positioning
      return applyCustomPositioning(keyboard, context, theme);

    } catch (error) {
      return {
        success: false,
        strategy: preferredStrategy,
        finalPosition: null,
        error: createPlatformDetectionError(
          'POSITIONING_FAILED',
          `LinkedIn keyboard positioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { context: context.type, strategy: preferredStrategy }
        ),
      };
    }
  }

  /**
   * Gets LinkedIn-specific styling for keyboard integration
   */
  export function getLinkedInStyling(theme: LinkedInTheme, context: LinkedInComposeContext): Record<string, string> {
    const baseStyles = {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
      fontSize: '14px',
      lineHeight: '1.42857',
      color: theme.textColor,
      backgroundColor: theme.cardBackgroundColor,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: '8px',
      padding: '12px',
      margin: '8px 0',
      boxShadow: context.isModal 
        ? '0 4px 12px rgba(0, 0, 0, 0.15)' 
        : '0 2px 4px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    };

    // Context-specific adjustments
    switch (context.type) {
      case 'comment':
        return {
          ...baseStyles,
          marginLeft: '16px',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '13px',
        };

      case 'message':
        return {
          ...baseStyles,
          borderRadius: '20px',
          padding: '8px 16px',
          margin: '4px 0',
        };

      case 'article':
        return {
          ...baseStyles,
          borderRadius: '12px',
          padding: '16px',
          margin: '16px 0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        };

      case 'company':
        return {
          ...baseStyles,
          borderLeft: `4px solid ${theme.accentColor}`,
          backgroundColor: theme.isDark ? 'rgb(40, 40, 40)' : 'rgb(248, 249, 250)',
        };

      default:
        return baseStyles;
    }
  }

  /**
   * Integrates keyboard with LinkedIn's compose area
   */
  export function integrateWithCompose(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: LinkedInComposeContext
  ): void {
    try {
      // Add LinkedIn-specific attributes
      keyboard.setAttribute('data-linkedin-integration', 'true');
      keyboard.setAttribute('data-compose-context', context.type);

      // Set up responsive behavior for LinkedIn's layout
      setupResponsiveBehavior(keyboard, context);

      // Handle Quill editor specific integration
      if (context.isQuillEditor) {
        setupQuillIntegration(keyboard, composeElement, context);
      }

      // Handle modal-specific behavior
      if (context.isModal) {
        setupModalIntegration(keyboard, context);
      }

      // Set up form integration
      if (context.form) {
        setupFormIntegration(keyboard, context.form, context);
      }

    } catch (error) {
      console.warn('LinkedIn compose integration failed:', error);
    }
  }

  /**
   * Handles LinkedIn's dynamic layout changes
   */
  export function handleLayoutChange(keyboard: HTMLElement, context: LinkedInComposeContext): void {
    try {
      // Re-analyze context
      const updatedContext = analyzeComposeContext(context.editor);
      
      // Update positioning if needed
      const theme = detectTheme();
      const positioning = positionKeyboard(keyboard, updatedContext, theme);
      
      if (!positioning.success) {
        console.warn('LinkedIn layout change handling failed:', positioning.error);
      }

      // Update styling for new context
      const newStyles = getLinkedInStyling(theme, updatedContext);
      Object.assign(keyboard.style, newStyles);

    } catch (error) {
      console.warn('LinkedIn layout change handling failed:', error);
    }
  }

  // Private helper functions

  function getComposeType(element: HTMLElement): LinkedInComposeContext['type'] {
    if (element.closest('.share-creation-state') || element.closest('.compose-publisher')) {
      return 'post';
    }
    if (element.closest('.comments-comment-box__form')) {
      return 'comment';
    }
    if (element.closest('.msg-form__container')) {
      return 'message';
    }
    if (element.closest('.article-editor') || element.closest('.newsletter-editor')) {
      return 'article';
    }
    if (element.closest('.org-admin-share-update-form')) {
      return 'company';
    }
    return 'unknown';
  }

  function findContainer(element: HTMLElement): HTMLElement {
    // Try to find the most appropriate container
    const containers = [
      '.artdeco-card',
      '.share-creation-state',
      '.comments-comment-box__form',
      '.msg-form__container',
      '.compose-publisher-container',
      'form',
    ];

    for (const selector of containers) {
      const container = element.closest(selector) as HTMLElement;
      if (container) {
        return container;
      }
    }

    // Fallback to parent element
    return element.parentElement ?? element;
  }

  function isInModal(element: HTMLElement): boolean {
    return element.closest('.artdeco-modal') !== null ||
           element.closest('.msg-overlay-conversation-bubble') !== null ||
           element.closest('.share-creation-state-modal') !== null;
  }

  function isQuillEditorElement(element: HTMLElement): boolean {
    return element.classList.contains('ql-editor') ||
           element.closest('.ql-container') !== null ||
           element.hasAttribute('data-test-ql-editor-contenteditable');
  }

  function hasEditorToolbar(element: HTMLElement): boolean {
    const container = findContainer(element);
    return container.querySelector('.ql-toolbar') !== null ||
           container.querySelector('.editor-toolbar') !== null ||
           container.querySelector('.share-actions') !== null;
  }

  function applyPositioningStrategy(
    keyboard: HTMLElement,
    context: LinkedInComposeContext,
    strategy: LinkedInPositionStrategy,
    theme: LinkedInTheme
  ): LinkedInPositionResult {
    try {
      let targetElement: HTMLElement | null = null;
      let insertPosition: 'before' | 'after' | 'inside' = 'after';

      switch (strategy) {
        case 'after_editor':
          targetElement = context.editor;
          insertPosition = 'after';
          break;

        case 'before_toolbar':
          targetElement = findToolbar(context.container);
          insertPosition = 'before';
          break;

        case 'in_footer':
          targetElement = findFooter(context.container);
          insertPosition = 'inside';
          break;

        case 'beside_actions':
          targetElement = findActionArea(context.container);
          insertPosition = 'after';
          break;

        case 'above_form':
          targetElement = context.form ?? context.container;
          insertPosition = 'before';
          break;

        default:
          return { success: false, strategy, finalPosition: null };
      }

      if (!targetElement) {
        return { success: false, strategy, finalPosition: null };
      }

      // Apply positioning
      if (insertPosition === 'before') {
        targetElement.parentNode?.insertBefore(keyboard, targetElement);
      } else if (insertPosition === 'after') {
        if (targetElement.nextSibling) {
          targetElement.parentNode?.insertBefore(keyboard, targetElement.nextSibling);
        } else {
          targetElement.parentNode?.appendChild(keyboard);
        }
      } else {
        targetElement.appendChild(keyboard);
      }

      // Apply styling
      const styles = getLinkedInStyling(theme, context);
      Object.assign(keyboard.style, styles);

      return {
        success: true,
        strategy,
        finalPosition: keyboard.getBoundingClientRect(),
      };

    } catch (error) {
      return {
        success: false,
        strategy,
        finalPosition: null,
        error: createPlatformDetectionError(
          'POSITIONING_FAILED',
          `Strategy '${strategy}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { strategy, context: context.type }
        ),
      };
    }
  }

  function applyCustomPositioning(
    keyboard: HTMLElement,
    context: LinkedInComposeContext,
    theme: LinkedInTheme
  ): LinkedInPositionResult {
    try {
      // Fallback: append to container
      context.container.appendChild(keyboard);
      
      // Apply basic styling
      const styles = getLinkedInStyling(theme, context);
      Object.assign(keyboard.style, {
        ...styles,
        marginTop: '12px',
        width: '100%',
        boxSizing: 'border-box',
      });

      return {
        success: true,
        strategy: 'custom',
        finalPosition: keyboard.getBoundingClientRect(),
        adjustments: {
          originalStrategy: 'after_editor',
          appliedStrategy: 'custom',
          reason: 'All standard strategies failed, using fallback container positioning',
        },
      };

    } catch (error) {
      return {
        success: false,
        strategy: 'custom',
        finalPosition: null,
        error: createPlatformDetectionError(
          'POSITIONING_FAILED',
          `Custom positioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { context: context.type }
        ),
      };
    }
  }

  function findToolbar(container: HTMLElement): HTMLElement | null {
    const selectors = [
      '.ql-toolbar',
      '.editor-toolbar',
      '.share-actions',
      '.compose-publisher__actions',
      '.comments-comment-box-comment__button-group',
    ];

    for (const selector of selectors) {
      const toolbar = container.querySelector(selector) as HTMLElement;
      if (toolbar) return toolbar;
    }

    return null;
  }

  function findFooter(container: HTMLElement): HTMLElement | null {
    const selectors = [
      '.share-creation-state__footer',
      '.comments-comment-box__submit-button-container',
      '.msg-form__send-button-container',
      '.compose-publisher__footer',
    ];

    for (const selector of selectors) {
      const footer = container.querySelector(selector) as HTMLElement;
      if (footer) return footer;
    }

    return null;
  }

  function findActionArea(container: HTMLElement): HTMLElement | null {
    const selectors = [
      '.share-actions__primary-actions',
      '.comments-comment-box-comment__main-content',
      '.msg-form__send-button',
      '.compose-publisher__toolbar',
    ];

    for (const selector of selectors) {
      const actions = container.querySelector(selector) as HTMLElement;
      if (actions) return actions;
    }

    return null;
  }

  function setupResponsiveBehavior(keyboard: HTMLElement, context: LinkedInComposeContext): void {
    // Add responsive classes
    keyboard.classList.add('linkedin-keyboard-responsive');
    
    // Set up media query handling
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResponsive = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        // Mobile layout
        keyboard.style.padding = '8px';
        keyboard.style.margin = '4px 0';
        keyboard.style.fontSize = '13px';
      } else {
        // Desktop layout
        const styles = getLinkedInStyling(detectTheme(), context);
        Object.assign(keyboard.style, styles);
      }
    };

    mediaQuery.addListener(handleResponsive);
    handleResponsive(mediaQuery);
  }

  function setupQuillIntegration(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: LinkedInComposeContext
  ): void {
    // Add Quill-specific attributes
    keyboard.setAttribute('data-quill-integration', 'true');
    
    // Position relative to Quill container
    const quillContainer = composeElement.closest('.ql-container') as HTMLElement;
    if (quillContainer) {
      keyboard.style.borderTop = 'none';
      keyboard.style.borderTopLeftRadius = '0';
      keyboard.style.borderTopRightRadius = '0';
    }
  }

  function setupModalIntegration(keyboard: HTMLElement, context: LinkedInComposeContext): void {
    // Add modal-specific styling
    keyboard.setAttribute('data-modal-integration', 'true');
    keyboard.style.zIndex = '9999';
    keyboard.style.position = 'relative';
    
    // Handle modal close events
    const modal = context.container.closest('.artdeco-modal');
    if (modal) {
      const closeButton = modal.querySelector('[data-test-modal-close-btn]');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          keyboard.remove();
        });
      }
    }
  }

  function setupFormIntegration(
    keyboard: HTMLElement,
    form: HTMLElement,
    context: LinkedInComposeContext
  ): void {
    // Add form-specific attributes
    keyboard.setAttribute('data-form-integration', 'true');
    
    // Handle form submission
    form.addEventListener('submit', () => {
      // Optionally hide keyboard on form submission
      if (context.type === 'comment' || context.type === 'message') {
        keyboard.style.opacity = '0.5';
        keyboard.style.pointerEvents = 'none';
      }
    });

    // Handle form reset
    form.addEventListener('reset', () => {
      keyboard.style.opacity = '1';
      keyboard.style.pointerEvents = 'auto';
    });
  }
}