/**
 * Reddit DOM Utilities - Comprehensive 2024 Implementation
 * 
 * Reddit-specific DOM manipulation utilities including theme detection,
 * positioning strategies, and integration with Reddit's UI patterns for
 * both new Reddit (redesign) and old Reddit interfaces.
 */

import { createPlatformDetectionError, type PlatformDetectionError } from '../types.js';

/**
 * Reddit theme detection result
 */
export interface RedditTheme {
  readonly isDark: boolean;
  readonly version: 'new' | 'old' | 'mobile';
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly accentColor: string;
  readonly cardBackgroundColor: string;
  readonly hoverColor: string;
  readonly focusColor: string;
  readonly upvoteColor: string;
  readonly downvoteColor: string;
}

/**
 * Reddit compose context information
 */
export interface RedditComposeContext {
  readonly type: 'post' | 'comment' | 'reply' | 'message' | 'unknown';
  readonly container: HTMLElement;
  readonly editor: HTMLElement;
  readonly form: HTMLElement | null;
  readonly subreddit: string | null;
  readonly redditVersion: 'new' | 'old' | 'mobile';
  readonly supportsMarkdown: boolean;
  readonly isInThread: boolean;
  readonly position: {
    readonly top: number;
    readonly left: number;
    readonly width: number;
    readonly height: number;
  };
}

/**
 * Reddit positioning strategy options
 */
export type RedditPositionStrategy = 
  | 'before_composer'
  | 'after_composer'
  | 'in_toolbar'
  | 'above_buttons'
  | 'beside_composer'
  | 'custom';

/**
 * Reddit positioning result
 */
export interface RedditPositionResult {
  readonly success: boolean;
  readonly strategy: RedditPositionStrategy;
  readonly finalPosition: DOMRect | null;
  readonly error?: PlatformDetectionError;
  readonly adjustments?: {
    readonly originalStrategy: RedditPositionStrategy;
    readonly appliedStrategy: RedditPositionStrategy;
    readonly reason: string;
  };
}

/**
 * Reddit DOM manipulation utilities namespace
 */
export namespace RedditDOM {

  /**
   * Detects current Reddit theme and version
   */
  export function detectTheme(): RedditTheme {
    try {
      const version = detectRedditVersion();
      const isDarkMode = detectDarkMode(version);

      // Reddit's color scheme varies by version
      if (version === 'old') {
        return createOldRedditTheme(isDarkMode);
      } else {
        return createNewRedditTheme(isDarkMode, version);
      }
    } catch (error) {
      // Fallback to new Reddit light theme
      return createNewRedditTheme(false, 'new');
    }
  }

  /**
   * Analyzes Reddit compose context for optimal integration
   */
  export function analyzeComposeContext(composeElement: HTMLElement): RedditComposeContext {
    const type = getComposeType(composeElement);
    const container = findContainer(composeElement);
    const form = composeElement.closest('form') as HTMLElement | null;
    const subreddit = getCurrentSubreddit();
    const redditVersion = detectRedditVersion();
    const supportsMarkdown = checkMarkdownSupport(composeElement);
    const isInThread = checkIfInThread();

    const rect = composeElement.getBoundingClientRect();

    return {
      type,
      container,
      editor: composeElement,
      form,
      subreddit,
      redditVersion,
      supportsMarkdown,
      isInThread,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  /**
   * Positions keyboard element optimally for Reddit context
   */
  export function positionKeyboard(
    keyboard: HTMLElement,
    context: RedditComposeContext,
    theme: RedditTheme,
    preferredStrategy: RedditPositionStrategy = 'before_composer'
  ): RedditPositionResult {
    try {
      const strategies: RedditPositionStrategy[] = getStrategiesForContext(context, preferredStrategy);

      for (const strategy of strategies) {
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
          `Reddit keyboard positioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { context: context.type, strategy: preferredStrategy, version: context.redditVersion }
        ),
      };
    }
  }

  /**
   * Gets Reddit-specific styling for keyboard integration
   */
  export function getRedditStyling(theme: RedditTheme, context: RedditComposeContext): Record<string, string> {
    const baseStyles = getBaseStyles(theme, context);

    // Version-specific adjustments
    if (theme.version === 'old') {
      return {
        ...baseStyles,
        fontFamily: 'Verdana, Geneva, sans-serif',
        fontSize: '12px',
        border: '1px solid #c7c7c7',
        borderRadius: '3px',
        backgroundColor: theme.isDark ? '#1a1a1b' : '#ffffff',
      };
    }

    // Context-specific adjustments for new Reddit
    switch (context.type) {
      case 'comment':
      case 'reply':
        return {
          ...baseStyles,
          marginLeft: '20px',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
        };

      case 'post':
        return {
          ...baseStyles,
          borderRadius: '12px',
          padding: '16px',
          margin: '16px 0',
          fontSize: '15px',
        };

      case 'message':
        return {
          ...baseStyles,
          borderRadius: '20px',
          padding: '8px 16px',
          margin: '8px 0',
          fontSize: '14px',
        };

      default:
        return baseStyles;
    }
  }

  /**
   * Integrates keyboard with Reddit's compose area
   */
  export function integrateWithCompose(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: RedditComposeContext
  ): void {
    try {
      // Add Reddit-specific attributes
      keyboard.setAttribute('data-reddit-integration', 'true');
      keyboard.setAttribute('data-compose-context', context.type);
      keyboard.setAttribute('data-reddit-version', context.redditVersion);

      if (context.subreddit) {
        keyboard.setAttribute('data-subreddit', context.subreddit);
      }

      // Set up responsive behavior for Reddit's layout
      setupResponsiveBehavior(keyboard, context);

      // Handle version-specific integration
      if (context.redditVersion === 'old') {
        setupOldRedditIntegration(keyboard, composeElement, context);
      } else {
        setupNewRedditIntegration(keyboard, composeElement, context);
      }

      // Handle markdown support
      if (context.supportsMarkdown) {
        setupMarkdownIntegration(keyboard, context);
      }

      // Set up form integration
      if (context.form) {
        setupFormIntegration(keyboard, context.form, context);
      }

    } catch (error) {
      console.warn('Reddit compose integration failed:', error);
    }
  }

  /**
   * Handles Reddit's dynamic layout changes and navigation
   */
  export function handleLayoutChange(keyboard: HTMLElement, context: RedditComposeContext): void {
    try {
      // Re-analyze context
      const updatedContext = analyzeComposeContext(context.editor);
      
      // Update positioning if needed
      const theme = detectTheme();
      const positioning = positionKeyboard(keyboard, updatedContext, theme);
      
      if (!positioning.success) {
        console.warn('Reddit layout change handling failed:', positioning.error);
      }

      // Update styling for new context
      const newStyles = getRedditStyling(theme, updatedContext);
      Object.assign(keyboard.style, newStyles);

    } catch (error) {
      console.warn('Reddit layout change handling failed:', error);
    }
  }

  // Private helper functions

  function detectRedditVersion(): 'new' | 'old' | 'mobile' {
    // Check for new Reddit indicators
    if (document.querySelector('shreddit-app') ||
        document.querySelector('[data-testid*="post"]') ||
        document.querySelector('.App__container')) {
      return window.innerWidth < 768 ? 'mobile' : 'new';
    }

    // Check for old Reddit indicators
    if (document.querySelector('#siteTable') ||
        document.querySelector('.content[role="main"]') ||
        document.querySelector('.thing.link')) {
      return 'old';
    }

    // Default to new Reddit
    return window.innerWidth < 768 ? 'mobile' : 'new';
  }

  function detectDarkMode(version: 'new' | 'old' | 'mobile'): boolean {
    if (version === 'old') {
      // Old Reddit dark mode detection
      return document.body.classList.contains('dark') ||
             document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // New Reddit dark mode detection
    return document.documentElement.classList.contains('theme-dark') ||
           document.body.classList.contains('theme-dark') ||
           getComputedStyle(document.body).getPropertyValue('--color-tone-1') === 'dark' ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function createOldRedditTheme(isDark: boolean): RedditTheme {
    if (isDark) {
      return {
        isDark: true,
        version: 'old',
        backgroundColor: '#1a1a1b',
        textColor: '#d7dadc',
        borderColor: '#343536',
        accentColor: '#ff4500',
        cardBackgroundColor: '#1a1a1b',
        hoverColor: 'rgba(255, 69, 0, 0.1)',
        focusColor: 'rgba(255, 69, 0, 0.2)',
        upvoteColor: '#ff8b60',
        downvoteColor: '#9494ff',
      };
    } else {
      return {
        isDark: false,
        version: 'old',
        backgroundColor: '#ffffff',
        textColor: '#222222',
        borderColor: '#c7c7c7',
        accentColor: '#ff4500',
        cardBackgroundColor: '#ffffff',
        hoverColor: 'rgba(255, 69, 0, 0.1)',
        focusColor: 'rgba(255, 69, 0, 0.2)',
        upvoteColor: '#ff4500',
        downvoteColor: '#7193ff',
      };
    }
  }

  function createNewRedditTheme(isDark: boolean, version: 'new' | 'mobile'): RedditTheme {
    if (isDark) {
      return {
        isDark: true,
        version,
        backgroundColor: '#1a1a1b',
        textColor: '#d7dadc',
        borderColor: '#343536',
        accentColor: '#ff4500',
        cardBackgroundColor: '#1a1a1b',
        hoverColor: 'rgba(255, 69, 0, 0.1)',
        focusColor: 'rgba(255, 69, 0, 0.2)',
        upvoteColor: '#ff8b60',
        downvoteColor: '#9494ff',
      };
    } else {
      return {
        isDark: false,
        version,
        backgroundColor: '#ffffff',
        textColor: '#1c1c1c',
        borderColor: '#edeff1',
        accentColor: '#ff4500',
        cardBackgroundColor: '#ffffff',
        hoverColor: 'rgba(255, 69, 0, 0.1)',
        focusColor: 'rgba(255, 69, 0, 0.2)',
        upvoteColor: '#ff4500',
        downvoteColor: '#7193ff',
      };
    }
  }

  function getBaseStyles(theme: RedditTheme, context: RedditComposeContext): Record<string, string> {
    return {
      fontFamily: theme.version === 'old' 
        ? 'Verdana, Geneva, sans-serif'
        : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: theme.version === 'old' ? '12px' : '14px',
      lineHeight: theme.version === 'old' ? '1.3' : '1.5',
      color: theme.textColor,
      backgroundColor: theme.cardBackgroundColor,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: theme.version === 'old' ? '3px' : '8px',
      padding: theme.version === 'old' ? '8px' : '12px',
      margin: '8px 0',
      boxShadow: theme.version === 'old' 
        ? 'none' 
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease',
    };
  }

  function getComposeType(element: HTMLElement): RedditComposeContext['type'] {
    // Check element and its ancestors for context clues
    if (element.closest('shreddit-post-composer') || 
        element.closest('[data-testid="post-submission-form"]') ||
        element.closest('.Submit__container')) {
      return 'post';
    }

    if (element.closest('shreddit-comment-composer') || 
        element.closest('[data-testid="reply-form"]') ||
        element.closest('.reply-form')) {
      return 'reply';
    }

    if (element.closest('shreddit-composer') || 
        element.closest('[data-testid="comment-submission-form"]') ||
        element.closest('.CommentBox')) {
      return 'comment';
    }

    if (element.closest('[data-testid="chat-composer"]') ||
        element.closest('.Chat__inputContainer')) {
      return 'message';
    }

    return 'unknown';
  }

  function findContainer(element: HTMLElement): HTMLElement {
    // Try to find the most appropriate container
    const containers = [
      'shreddit-composer-host',
      'shreddit-composer',
      '[data-testid*="submission-form"]',
      '.CommentBox',
      '.Submit__container',
      '.usertext',
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

  function getCurrentSubreddit(): string | null {
    // Try new Reddit selectors
    const subredditElement = document.querySelector('[data-subreddit-name]');
    if (subredditElement) {
      return subredditElement.getAttribute('data-subreddit-name');
    }

    // Try extracting from URL
    const urlMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }

    return null;
  }

  function checkMarkdownSupport(element: HTMLElement): boolean {
    const version = detectRedditVersion();
    
    // Old Reddit always supports markdown
    if (version === 'old') {
      return true;
    }

    // New Reddit markdown support varies
    const container = findContainer(element);
    return container.querySelector('.RichTextEditor-root') !== null ||
           container.querySelector('[data-testid*="markdown"]') !== null;
  }

  function checkIfInThread(): boolean {
    return window.location.pathname.includes('/comments/') ||
           document.querySelector('shreddit-post') !== null ||
           document.querySelector('.Post') !== null;
  }

  function getStrategiesForContext(
    context: RedditComposeContext, 
    preferred: RedditPositionStrategy
  ): RedditPositionStrategy[] {
    const strategies: RedditPositionStrategy[] = [preferred];

    // Add context-specific strategies
    if (context.redditVersion === 'old') {
      strategies.push('above_buttons', 'after_composer', 'custom');
    } else {
      strategies.push('before_composer', 'after_composer', 'in_toolbar', 'custom');
    }

    // Remove duplicates while preserving order
    return Array.from(new Set(strategies));
  }

  function applyPositioningStrategy(
    keyboard: HTMLElement,
    context: RedditComposeContext,
    strategy: RedditPositionStrategy,
    theme: RedditTheme
  ): RedditPositionResult {
    try {
      let targetElement: HTMLElement | null = null;
      let insertPosition: 'before' | 'after' | 'inside' = 'before';

      switch (strategy) {
        case 'before_composer':
          targetElement = context.editor;
          insertPosition = 'before';
          break;

        case 'after_composer':
          targetElement = context.editor;
          insertPosition = 'after';
          break;

        case 'in_toolbar':
          targetElement = findToolbar(context.container);
          insertPosition = 'inside';
          break;

        case 'above_buttons':
          targetElement = findButtonArea(context.container);
          insertPosition = 'before';
          break;

        case 'beside_composer':
          targetElement = context.container;
          insertPosition = 'inside';
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
      const styles = getRedditStyling(theme, context);
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
          { strategy, context: context.type, version: context.redditVersion }
        ),
      };
    }
  }

  function applyCustomPositioning(
    keyboard: HTMLElement,
    context: RedditComposeContext,
    theme: RedditTheme
  ): RedditPositionResult {
    try {
      // Fallback: append to container
      context.container.appendChild(keyboard);
      
      // Apply basic styling
      const styles = getRedditStyling(theme, context);
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
          originalStrategy: 'before_composer',
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
          { context: context.type, version: context.redditVersion }
        ),
      };
    }
  }

  function findToolbar(container: HTMLElement): HTMLElement | null {
    const selectors = [
      'shreddit-composer-toolbar',
      '.RichTextEditor-controls',
      '.CommentBox__toolbar',
      '.Submit__toolbar',
      '.usertext-buttons',
      '.bottom-area',
    ];

    for (const selector of selectors) {
      const toolbar = container.querySelector(selector) as HTMLElement;
      if (toolbar) return toolbar;
    }

    return null;
  }

  function findButtonArea(container: HTMLElement): HTMLElement | null {
    const selectors = [
      '.usertext-buttons',
      '.bottom-area',
      '.save-button',
      '.btn-group',
      '[type="submit"]',
    ];

    for (const selector of selectors) {
      const buttons = container.querySelector(selector) as HTMLElement;
      if (buttons) return buttons;
    }

    return null;
  }

  function setupResponsiveBehavior(keyboard: HTMLElement, context: RedditComposeContext): void {
    keyboard.classList.add('reddit-keyboard-responsive');
    
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResponsive = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        // Mobile layout
        keyboard.style.padding = '8px';
        keyboard.style.margin = '4px 0';
        keyboard.style.fontSize = '13px';
      } else {
        // Desktop layout
        const styles = getRedditStyling(detectTheme(), context);
        Object.assign(keyboard.style, styles);
      }
    };

    mediaQuery.addListener(handleResponsive);
    handleResponsive(mediaQuery);
  }

  function setupOldRedditIntegration(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: RedditComposeContext
  ): void {
    keyboard.setAttribute('data-old-reddit', 'true');
    
    // Old Reddit specific styling
    keyboard.style.fontFamily = 'Verdana, Geneva, sans-serif';
    keyboard.style.fontSize = '12px';
    keyboard.style.border = '1px solid #c7c7c7';
    keyboard.style.borderRadius = '3px';
  }

  function setupNewRedditIntegration(
    keyboard: HTMLElement,
    composeElement: HTMLElement,
    context: RedditComposeContext
  ): void {
    keyboard.setAttribute('data-new-reddit', 'true');
    
    // New Reddit specific styling
    keyboard.style.borderRadius = '8px';
    keyboard.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  }

  function setupMarkdownIntegration(keyboard: HTMLElement, context: RedditComposeContext): void {
    keyboard.setAttribute('data-supports-markdown', 'true');
    
    // Add markdown indicator or helper text
    const markdownNote = document.createElement('div');
    markdownNote.style.fontSize = '11px';
    markdownNote.style.color = '#999';
    markdownNote.style.marginTop = '4px';
    markdownNote.textContent = 'Supports Markdown formatting';
    keyboard.appendChild(markdownNote);
  }

  function setupFormIntegration(
    keyboard: HTMLElement,
    form: HTMLElement,
    context: RedditComposeContext
  ): void {
    keyboard.setAttribute('data-form-integration', 'true');
    
    // Handle form submission
    form.addEventListener('submit', () => {
      keyboard.style.opacity = '0.5';
      keyboard.style.pointerEvents = 'none';
    });

    // Handle form reset
    form.addEventListener('reset', () => {
      keyboard.style.opacity = '1';
      keyboard.style.pointerEvents = 'auto';
    });
  }
}