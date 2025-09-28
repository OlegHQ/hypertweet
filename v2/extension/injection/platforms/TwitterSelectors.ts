/**
 * Twitter/X Selector Strategies (2024)
 * 
 * Updated selectors for current Twitter/X implementation with comprehensive fallback strategies.
 * Addresses the broken selectors identified in the previous implementation.
 */

import type { SelectorConfig } from '../types.js';
import { createSelectorConfig } from '../platformConfig.js';

/**
 * Twitter compose area selector priorities
 * Updated for current Twitter/X UI as of 2024
 */
export const TWITTER_COMPOSE_SELECTORS = createSelectorConfig(
  // Primary: Current Twitter compose area (2024)
  '[data-testid="tweetTextarea_0"]',
  [
    // Fallback 1: Generic tweet textarea
    'div[contenteditable="true"][data-text="true"]',
    // Fallback 2: Compose area by role and contenteditable
    'div[role="textbox"][contenteditable="true"]',
    // Fallback 3: DraftJS editor (legacy support)
    '.public-DraftEditor-content',
    // Fallback 4: Generic contenteditable in compose context
    '[data-testid="tweet-compose-area"] div[contenteditable="true"]',
    // Fallback 5: By aria-label
    'div[aria-label*="Tweet text"]',
    'div[aria-label*="What is happening"]',
    // Fallback 6: By class patterns (fragile but sometimes necessary)
    '.public-DraftStyleDefault-block',
  ],
  {
    validation: {
      minWidth: 100,
      minHeight: 30,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Twitter reply compose selector strategies
 */
export const TWITTER_REPLY_SELECTORS = createSelectorConfig(
  '[data-testid="tweetTextarea_0"]',
  [
    // Fallback 1: Reply-specific textarea
    'div[contenteditable="true"][data-text="true"][aria-label*="Reply"]',
    // Fallback 2: Generic reply context
    '[data-testid="reply"] div[contenteditable="true"]',
    // Fallback 3: Tweet thread reply
    '[data-testid="tweet-reply"] div[role="textbox"]',
    // Fallback 4: Bottom compose in thread
    'article + div div[contenteditable="true"]',
  ],
  {
    validation: {
      minWidth: 80,
      minHeight: 25,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Twitter quote tweet selector strategies
 */
export const TWITTER_QUOTE_SELECTORS = createSelectorConfig(
  '[data-testid="tweetTextarea_0"]',
  [
    // Fallback 1: Quote tweet specific
    'div[contenteditable="true"][aria-label*="Add a comment"]',
    // Fallback 2: Quote context
    '[data-testid="quote-tweet"] div[contenteditable="true"]',
    // Fallback 3: Modal quote tweet
    '[role="dialog"] div[contenteditable="true"][data-text="true"]',
  ],
  {
    validation: {
      minWidth: 80,
      minHeight: 25,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Twitter main timeline compose button
 */
export const TWITTER_COMPOSE_BUTTON_SELECTORS = createSelectorConfig(
  '[data-testid="SideNav_NewTweet_Button"]',
  [
    // Fallback 1: Tweet button variations
    'a[href="/compose/tweet"]',
    'a[data-testid*="NewTweet"]',
    // Fallback 2: By aria-label
    'a[aria-label="Tweet"]',
    'button[aria-label="Tweet"]',
    // Fallback 3: By text content
    'a:has-text("Tweet")',
    'button:has-text("Tweet")',
    // Fallback 4: Floating action button
    '[data-testid="floatingActionButton"]',
  ],
  {
    validation: {
      minWidth: 50,
      minHeight: 20,
      mustBeVisible: true,
      mustBeInteractive: true,
    },
  }
);

/**
 * Twitter toolbar/action area selectors
 */
export const TWITTER_TOOLBAR_SELECTORS = createSelectorConfig(
  '[data-testid="toolBar"]',
  [
    // Fallback 1: Tweet button container
    '[data-testid="tweetButtonInline"]',
    // Fallback 2: Compose controls
    '[data-testid="tweet-compose-controls"]',
    // Fallback 3: Bottom toolbar in compose
    'div[role="group"][aria-label*="Tweet"]',
    // Fallback 4: Actions container
    'div[data-testid*="action"]',
    // Fallback 5: Generic toolbar by structure
    'div:has([data-testid="tweetButtonInline"])',
  ],
  {
    validation: {
      minWidth: 30,
      minHeight: 15,
      mustBeVisible: true,
      mustBeInteractive: false,
    },
  }
);

/**
 * Twitter navigation/container selectors for context detection
 */
export const TWITTER_NAVIGATION_SELECTORS = createSelectorConfig(
  '[data-testid="primaryColumn"]',
  [
    // Fallback 1: Main content area
    'main[role="main"]',
    // Fallback 2: Primary column variations
    '[data-testid="main-content"]',
    // Fallback 3: Timeline container
    '[data-testid="timeline"]',
    // Fallback 4: Generic main content
    'main',
    // Fallback 5: Body for last resort
    'body',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 100,
      mustBeVisible: false,
      mustBeInteractive: false,
    },
  }
);

/**
 * Twitter modal/dialog selectors
 */
export const TWITTER_MODAL_SELECTORS = createSelectorConfig(
  '[role="dialog"]',
  [
    // Fallback 1: Modal variations
    '[data-testid="modal"]',
    '[data-testid="dialog"]',
    // Fallback 2: Compose modal specifically
    '[data-testid="tweet-modal"]',
    '[data-testid="compose-modal"]',
    // Fallback 3: Generic overlay
    '.modal',
    '.dialog',
    // Fallback 4: By z-index (fragile)
    'div[style*="z-index"]',
  ],
  {
    validation: {
      minWidth: 200,
      minHeight: 100,
      mustBeVisible: true,
      mustBeInteractive: false,
    },
  }
);

/**
 * Twitter tweet/post content selectors for context
 */
export const TWITTER_TWEET_SELECTORS = createSelectorConfig(
  '[data-testid="tweet"]',
  [
    // Fallback 1: Article elements (tweets are often articles)
    'article[role="article"]',
    'article[data-testid*="tweet"]',
    // Fallback 2: Timeline items
    '[data-testid="timeline-item"]',
    // Fallback 3: Generic tweet containers
    'div[data-testid*="tweet"]',
    // Fallback 4: By structure (div containing tweet text)
    'div:has([data-testid="tweetText"])',
  ],
  {
    validation: {
      minWidth: 50,
      minHeight: 20,
      mustBeVisible: false,
      mustBeInteractive: false,
    },
  }
);

/**
 * Twitter user profile selectors
 */
export const TWITTER_PROFILE_SELECTORS = createSelectorConfig(
  '[data-testid="UserName"]',
  [
    // Fallback 1: Profile header variations
    '[data-testid="user-name"]',
    '[data-testid="profile-header"]',
    // Fallback 2: By structure
    'div:has([data-testid="UserAvatar"])',
    // Fallback 3: By aria-label
    'div[aria-label*="profile"]',
  ],
  {
    validation: {
      minWidth: 100,
      minHeight: 30,
      mustBeVisible: false,
      mustBeInteractive: false,
    },
  }
);

/**
 * Dynamic selector validation for Twitter's changing UI
 */
export namespace TwitterSelectorValidator {
  
  /**
   * Validates if a compose area is currently active and ready for injection
   */
  export function validateComposeArea(element: Element): boolean {
    if (!element) return false;
    
    // Check if element is contenteditable
    const isContentEditable = element.getAttribute('contenteditable') === 'true';
    if (!isContentEditable) return false;
    
    // Check if element is visible and enabled
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    // Check if element is not disabled
    const isDisabled = element.hasAttribute('disabled') || 
                      element.getAttribute('aria-disabled') === 'true';
    if (isDisabled) return false;
    
    // Check if element is in viewport (at least partially)
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    if (rect.bottom < 0 || rect.top > viewportHeight ||
        rect.right < 0 || rect.left > viewportWidth) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Determines the compose context (main, reply, quote, modal)
   */
  export function getComposeContext(element: Element): 'main' | 'reply' | 'quote' | 'modal' | 'unknown' {
    // Check for modal context
    if (element.closest('[role="dialog"]') || element.closest('.modal')) {
      return 'modal';
    }
    
    // Check for quote tweet context
    if (element.closest('[data-testid="quote-tweet"]') || 
        element.getAttribute('aria-label')?.includes('Add a comment')) {
      return 'quote';
    }
    
    // Check for reply context
    if (element.closest('[data-testid="reply"]') ||
        element.getAttribute('aria-label')?.includes('Reply') ||
        element.closest('article')?.nextElementSibling === element.closest('div')) {
      return 'reply';
    }
    
    // Check for main compose (usually in sidebar or top of timeline)
    if (element.closest('[data-testid="tweet-compose"]') ||
        element.closest('[data-testid="SideNav"]') ||
        (!element.closest('article') && !element.closest('[data-testid="timeline"]'))) {
      return 'main';
    }
    
    return 'unknown';
  }
  
  /**
   * Detects if Twitter is in dark mode for styling consistency
   */
  export function isDarkMode(): boolean {
    // Check for dark mode indicators
    const html = document.documentElement;
    const body = document.body;
    
    // Check data attributes
    if (html.getAttribute('data-theme') === 'dark' ||
        body.getAttribute('data-theme') === 'dark') {
      return true;
    }
    
    // Check class names
    if (html.classList.contains('dark') ||
        body.classList.contains('dark') ||
        html.classList.contains('theme-dark') ||
        body.classList.contains('theme-dark')) {
      return true;
    }
    
    // Check CSS custom properties (Twitter uses these)
    const computedStyle = getComputedStyle(document.documentElement);
    const backgroundColor = computedStyle.getPropertyValue('--background-color');
    const rgbValues = backgroundColor.match(/\d+/g);
    
    if (rgbValues && rgbValues.length >= 3) {
      const [r, g, b] = rgbValues.map(Number);
      // Dark if background is dark (low RGB values)
      return (r + g + b) / 3 < 128;
    }
    
    return false;
  }
  
  /**
   * Gets the current Twitter page type for context-aware injection
   */
  export function getPageType(): 'home' | 'profile' | 'tweet' | 'compose' | 'search' | 'unknown' {
    const pathname = window.location.pathname;
    
    if (pathname === '/' || pathname === '/home') {
      return 'home';
    }
    
    if (pathname.includes('/status/')) {
      return 'tweet';
    }
    
    if (pathname === '/compose/tweet' || pathname.includes('/compose/')) {
      return 'compose';
    }
    
    if (pathname.includes('/search')) {
      return 'search';
    }
    
    if (pathname.match(/^\/[^/]+$/)) {
      return 'profile';
    }
    
    return 'unknown';
  }
  
  /**
   * Checks if the current page context supports compose injection
   */
  export function supportsCompose(): boolean {
    const pageType = getPageType();
    
    // Most pages support compose except for some edge cases
    return pageType !== 'unknown';
  }
  
  /**
   * Gets priority score for selector based on current context
   */
  export function getSelectorPriority(selector: string, context: string): number {
    let priority = 0;
    
    // Higher priority for data-testid selectors (more stable)
    if (selector.includes('data-testid')) priority += 10;
    
    // Higher priority for context-specific selectors
    if (context === 'main' && selector.includes('tweetTextarea_0')) priority += 8;
    if (context === 'reply' && selector.includes('Reply')) priority += 8;
    if (context === 'quote' && selector.includes('comment')) priority += 8;
    
    // Higher priority for contenteditable + data-text combination
    if (selector.includes('contenteditable') && selector.includes('data-text')) priority += 6;
    
    // Lower priority for class-based selectors (more fragile)
    if (selector.includes('.') && !selector.includes('data-testid')) priority -= 5;
    
    // Lower priority for generic selectors
    if (selector === 'div' || selector === 'textarea') priority -= 10;
    
    return priority;
  }
}