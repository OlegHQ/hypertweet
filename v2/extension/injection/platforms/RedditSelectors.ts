/**
 * Reddit DOM Selectors - Comprehensive 2024 Implementation
 * 
 * Updated selectors for Reddit's current DOM structure with robust fallback strategies.
 * Supports both new Reddit (redesign) and old Reddit, post creation, comment composition,
 * and various Reddit interfaces including mobile responsiveness.
 */

import { createSelectorConfig, type SelectorConfig } from '../platformConfig.js';

/**
 * Reddit comment composer selectors for new Reddit
 */
export const REDDIT_COMMENT_SELECTORS = createSelectorConfig(
  'shreddit-composer',
  [
    'shreddit-composer [contenteditable="true"]',
    '.CommentBox__draftEditor [contenteditable="true"]',
    '[data-testid="comment-submission-form"] [contenteditable="true"]',
    '.RichTextEditor-root [contenteditable="true"]',
    'div[role="textbox"][contenteditable="true"]',
    '.public-DraftEditor-content',
    '.notranslate.public-DraftEditor-content',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 40,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Reddit post submission selectors for new Reddit
 */
export const REDDIT_POST_SELECTORS = createSelectorConfig(
  'shreddit-post-composer',
  [
    '[data-testid="post-submission-form"] [contenteditable="true"]',
    '.Submit__textEditor [contenteditable="true"]',
    '.SubmitPage .RichTextEditor-root [contenteditable="true"]',
    '[data-click-id="text"] [contenteditable="true"]',
    'div[role="textbox"][aria-label*="Text"]',
    '.public-DraftEditor-content[aria-label*="Text"]',
  ],
  {
    validation: {
      minWidth: 300,
      minHeight: 100,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Old Reddit comment selectors
 */
export const REDDIT_OLD_COMMENT_SELECTORS = createSelectorConfig(
  'textarea[name="text"]',
  [
    '.usertext-edit textarea',
    'form.usertext textarea',
    '.commentarea textarea[name="text"]',
    '.comment textarea[name="text"]',
    'textarea.gray',
    '.reply textarea',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 60,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Old Reddit post submission selectors
 */
export const REDDIT_OLD_POST_SELECTORS = createSelectorConfig(
  '#text-desc',
  [
    'textarea[name="text"]',
    '.usertext-edit textarea',
    '#text',
    '.content textarea',
    'form textarea[rows]',
  ],
  {
    validation: {
      minWidth: 300,
      minHeight: 100,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Reddit message/chat selectors
 */
export const REDDIT_MESSAGE_SELECTORS = createSelectorConfig(
  '[data-testid="chat-composer"] [contenteditable="true"]',
  [
    '.Chat__inputContainer [contenteditable="true"]',
    '.ThreadMessages__input [contenteditable="true"]',
    'shreddit-chat-composer [contenteditable="true"]',
    '[role="textbox"][aria-label*="message"]',
    'textarea[placeholder*="message" i]',
    '.message-compose textarea',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 30,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Reddit reply form selectors (nested comments)
 */
export const REDDIT_REPLY_SELECTORS = createSelectorConfig(
  'shreddit-comment-composer',
  [
    '[data-testid="reply-form"] [contenteditable="true"]',
    '.Comment__replyForm [contenteditable="true"]', 
    '.reply-form [contenteditable="true"]',
    'form[action*="comment"] [contenteditable="true"]',
    '.thing .reply textarea',
    '.comment .usertext-edit textarea',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 40,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Reddit form container selectors (for positioning)
 */
export const REDDIT_FORM_SELECTORS = createSelectorConfig(
  'shreddit-composer-host',
  [
    '[data-testid="comment-submission-form"]',
    '[data-testid="post-submission-form"]',
    '.CommentBox',
    '.Submit__container',
    '.usertext',
    'form.usertext',
    '.reply-form',
    '.comment-form',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 50,
      mustBeVisible: true,
    },
  }
);

/**
 * Reddit toolbar/action selectors
 */
export const REDDIT_TOOLBAR_SELECTORS = createSelectorConfig(
  'shreddit-composer-toolbar',
  [
    '.RichTextEditor-controls',
    '.CommentBox__toolbar',
    '.Submit__toolbar',
    '.usertext-buttons',
    '.bottom-area',
    '.save-button',
    '.btn-group',
  ],
  {
    validation: {
      minWidth: 100,
      mustBeVisible: true,
    },
  }
);

/**
 * Reddit navigation and modal selectors
 */
export const REDDIT_NAVIGATION_SELECTORS = createSelectorConfig(
  'shreddit-app',
  [
    '#AppRouter-main',
    '.App',
    '#siteTable',
    '.content',
    '.Post',
    '.thing',
    'reddit-feed',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * Reddit thread/post context selectors
 */
export const REDDIT_THREAD_SELECTORS = createSelectorConfig(
  'shreddit-post',
  [
    '[data-testid="post-container"]',
    '.Post',
    '.thing.link',
    '.submission',
    '.post-container',
    'article[role="article"]',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * Reddit subreddit context selectors
 */
export const REDDIT_SUBREDDIT_SELECTORS = createSelectorConfig(
  '[data-subreddit-name]',
  [
    '.subreddit-name',
    '.subreddit',
    '[data-click-id="subreddit"]',
    'a[href*="/r/"]',
    '.hover.may-blank',
  ],
  {
    validation: {
      mustBeVisible: true,
    },
  }
);

/**
 * Simple validation context interface for Reddit selectors
 */
interface SelectorValidationContext {
  readonly expectedContext?: string;
  readonly redditVersion?: 'new' | 'old' | 'mobile';
}

/**
 * Reddit-specific selector validation with enhanced context detection
 */
export namespace RedditSelectorValidator {
  
  /**
   * Validates if an element is a valid Reddit compose area
   */
  export function validateComposeArea(element: Element): boolean {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    // Check for new Reddit web components
    if (element.tagName.toLowerCase().includes('shreddit')) {
      return true;
    }

    // Check for contenteditable elements (new Reddit)
    if (element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') === 'true') {
      // Ensure it's in a Reddit context
      const hasRedditContext = 
        element.closest('shreddit-composer') !== null ||
        element.closest('[data-testid*="submission-form"]') !== null ||
        element.closest('.CommentBox') !== null ||
        element.closest('.RichTextEditor-root') !== null ||
        element.closest('.public-DraftEditor-content') !== null;

      if (hasRedditContext) {
        return true;
      }
    }

    // Check for old Reddit textareas
    if (element.tagName.toLowerCase() === 'textarea') {
      const hasOldRedditContext = 
        element.hasAttribute('name') && element.getAttribute('name') === 'text' ||
        element.closest('.usertext-edit') !== null ||
        element.closest('form.usertext') !== null ||
        element.closest('.commentarea') !== null;

      if (hasOldRedditContext) {
        return true;
      }
    }

    // Check visibility and dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width < 100 || rect.height < 20) {
      return false;
    }

    // Check if element is actually visible
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }

    return false;
  }

  /**
   * Determines the compose context for a Reddit element
   */
  export function getComposeContext(element: Element): 'post' | 'comment' | 'reply' | 'message' | 'unknown' {
    if (!element) return 'unknown';

    // Check for post submission
    if (element.closest('shreddit-post-composer') ||
        element.closest('[data-testid="post-submission-form"]') ||
        element.closest('.Submit__container') ||
        element.getAttribute('aria-label')?.toLowerCase().includes('text') ||
        element.closest('#text-desc')) {
      return 'post';
    }

    // Check for comment composition
    if (element.closest('shreddit-composer') ||
        element.closest('[data-testid="comment-submission-form"]') ||
        element.closest('.CommentBox') ||
        (element.tagName.toLowerCase() === 'textarea' && element.getAttribute('name') === 'text')) {
      return 'comment';
    }

    // Check for reply composition (nested comments)
    if (element.closest('shreddit-comment-composer') ||
        element.closest('[data-testid="reply-form"]') ||
        element.closest('.Comment__replyForm') ||
        element.closest('.reply-form') ||
        element.closest('.thing .reply')) {
      return 'reply';
    }

    // Check for messaging/chat
    if (element.closest('[data-testid="chat-composer"]') ||
        element.closest('.Chat__inputContainer') ||
        element.closest('.ThreadMessages__input') ||
        element.closest('shreddit-chat-composer')) {
      return 'message';
    }

    return 'unknown';
  }

  /**
   * Detects Reddit version (new, old, mobile)
   */
  export function detectRedditVersion(): 'new' | 'old' | 'mobile' {
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

  /**
   * Gets the current subreddit name
   */
  export function getCurrentSubreddit(): string | null {
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

    // Try old Reddit selectors
    const oldRedditElement = document.querySelector('.subreddit .hover');
    if (oldRedditElement?.textContent) {
      return oldRedditElement.textContent.replace(/^\/r\//, '');
    }

    return null;
  }

  /**
   * Checks if current page is a post/comments page
   */
  export function isPostPage(): boolean {
    return window.location.pathname.includes('/comments/') ||
           document.querySelector('shreddit-post') !== null ||
           document.querySelector('.Post') !== null ||
           document.querySelector('.thing.link.self') !== null;
  }

  /**
   * Checks if current page is a submit/create post page
   */
  export function isSubmitPage(): boolean {
    return window.location.pathname.includes('/submit') ||
           document.querySelector('shreddit-post-composer') !== null ||
           document.querySelector('[data-testid="post-submission-form"]') !== null ||
           document.querySelector('.Submit__container') !== null;
  }

  /**
   * Validates selectors with Reddit-specific criteria
   */
  export function validateWithContext(
    element: Element,
    context: SelectorValidationContext
  ): { readonly isValid: boolean; readonly confidence: number; readonly issues: readonly string[] } {
    const issues: string[] = [];
    let confidence = 1.0;

    // Basic validation
    if (!validateComposeArea(element)) {
      issues.push('Element is not a valid Reddit compose area');
      confidence -= 0.5;
    }

    // Context-specific validation
    const detectedContext = getComposeContext(element);
    if (context.expectedContext && detectedContext !== context.expectedContext) {
      issues.push(`Expected context '${context.expectedContext}' but detected '${detectedContext}'`);
      confidence -= 0.3;
    }

    // Reddit version validation
    const detectedVersion = detectRedditVersion();
    if (context.redditVersion && detectedVersion !== context.redditVersion) {
      issues.push(`Expected Reddit version '${context.redditVersion}' but detected '${detectedVersion}'`);
      confidence -= 0.2;
    }

    // Check for Reddit-specific DOM structure
    const hasRedditStructure = 
      document.querySelector('shreddit-app') !== null ||
      document.querySelector('#siteTable') !== null ||
      document.querySelector('.App') !== null ||
      window.location.hostname.includes('reddit.com');

    if (!hasRedditStructure) {
      issues.push('Reddit DOM structure not detected');
      confidence -= 0.4;
    }

    // Check for appropriate page context
    const pageContext = getPageContext();
    if (pageContext === 'unknown') {
      issues.push('Unknown Reddit page context');
      confidence -= 0.1;
    }

    return {
      isValid: issues.length === 0 || confidence > 0.5,
      confidence: Math.max(0, confidence),
      issues,
    };
  }

  /**
   * Gets the current page context
   */
  function getPageContext(): 'post' | 'submit' | 'subreddit' | 'profile' | 'home' | 'unknown' {
    const pathname = window.location.pathname;

    if (pathname.includes('/comments/')) return 'post';
    if (pathname.includes('/submit')) return 'submit';
    if (pathname.match(/\/r\/[^/]+\/?$/)) return 'subreddit';
    if (pathname.includes('/user/') || pathname.includes('/u/')) return 'profile';
    if (pathname === '/' || pathname === '/home') return 'home';

    return 'unknown';
  }

  /**
   * Finds the best injection target near a compose element
   */
  export function findInjectionTarget(composeElement: HTMLElement): HTMLElement | null {
    // Try to find shreddit composer host
    const shredditHost = composeElement.closest('shreddit-composer-host') as HTMLElement;
    if (shredditHost) {
      return shredditHost;
    }

    // Try to find form container
    const formContainer = composeElement.closest('form') as HTMLElement;
    if (formContainer) {
      return formContainer;
    }

    // Try to find Reddit-specific containers
    const containers = [
      '.CommentBox',
      '.Submit__container',
      '.usertext',
      '.reply-form',
      '[data-testid*="submission-form"]',
    ];

    for (const selector of containers) {
      const container = composeElement.closest(selector) as HTMLElement;
      if (container) {
        return container;
      }
    }

    // Fall back to parent element
    return composeElement.parentElement;
  }

  /**
   * Checks if an element is ready for injection (not in a loading state)
   */
  export function isReadyForInjection(element: HTMLElement): boolean {
    // Check if element is in a loading state
    if (element.hasAttribute('aria-busy') && element.getAttribute('aria-busy') === 'true') {
      return false;
    }

    // Check for loading indicators
    if (element.querySelector('.loading') || 
        element.querySelector('.spinner') ||
        element.querySelector('[data-testid*="loading"]')) {
      return false;
    }

    // Check if form is disabled
    const form = element.closest('form');
    if (form?.hasAttribute('disabled')) {
      return false;
    }

    // Check if Reddit is still loading content
    if (document.querySelector('.loading-screen') ||
        document.querySelector('[data-testid="loading"]')) {
      return false;
    }

    // For new Reddit, ensure web components are fully loaded
    if (element.tagName.toLowerCase().includes('shreddit') && !element.shadowRoot) {
      // Web component might not be fully initialized
      return false;
    }

    return true;
  }

  /**
   * Checks if element supports markdown (old Reddit or certain new Reddit contexts)
   */
  export function supportsMarkdown(element: HTMLElement): boolean {
    // Old Reddit always supports markdown
    if (detectRedditVersion() === 'old') {
      return true;
    }

    // New Reddit markdown support detection
    const container = findInjectionTarget(element);
    if (container) {
      // Check for markdown editor indicators
      return container.querySelector('.RichTextEditor-root') !== null ||
             container.querySelector('[data-testid*="markdown"]') !== null ||
             container.textContent?.toLowerCase().includes('markdown') === true;
    }

    return false;
  }
}