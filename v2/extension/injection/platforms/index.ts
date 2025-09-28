/**
 * Platform-Specific Injection Systems
 * 
 * Exports for all platform-specific injection engines with their selectors,
 * DOM utilities, and injection strategies.
 */

// Twitter/X Platform
import { 
  injectTwitterKeyboard, 
  shutdownTwitterInjection 
} from './TwitterInjector.js';

import {
  TWITTER_COMPOSE_SELECTORS,
  TWITTER_REPLY_SELECTORS,
  TWITTER_QUOTE_SELECTORS,
  TWITTER_COMPOSE_BUTTON_SELECTORS,
  TWITTER_TOOLBAR_SELECTORS,
  TWITTER_NAVIGATION_SELECTORS,
  TWITTER_MODAL_SELECTORS,
  TWITTER_TWEET_SELECTORS,
  TWITTER_PROFILE_SELECTORS,
  TwitterSelectorValidator,
} from './TwitterSelectors.js';

import {
  TwitterDOM,
  type TwitterPositionStrategy,
  type TwitterTheme,
  type TwitterComposeContext,
  type TwitterPositionResult,
} from './TwitterDOM.js';

// LinkedIn Platform
import {
  injectLinkedInKeyboard,
  shutdownLinkedInInjection
} from './LinkedInInjector.js';

import {
  LINKEDIN_COMPOSE_SELECTORS,
  LINKEDIN_COMMENT_SELECTORS,
  LINKEDIN_MESSAGE_SELECTORS,
  LINKEDIN_ARTICLE_SELECTORS,
  LINKEDIN_COMPANY_SELECTORS,
  LINKEDIN_FORM_SELECTORS,
  LINKEDIN_TOOLBAR_SELECTORS,
  LINKEDIN_NAVIGATION_SELECTORS,
  LINKEDIN_FEED_SELECTORS,
  LINKEDIN_PROFILE_SELECTORS,
  LinkedInSelectorValidator,
} from './LinkedInSelectors.js';

import {
  LinkedInDOM,
  type LinkedInTheme,
  type LinkedInComposeContext,
  type LinkedInPositionStrategy,
  type LinkedInPositionResult,
} from './LinkedInDOM.js';

// Re-export all Twitter functionality
export { 
  injectTwitterKeyboard, 
  shutdownTwitterInjection 
};

export {
  TWITTER_COMPOSE_SELECTORS,
  TWITTER_REPLY_SELECTORS,
  TWITTER_QUOTE_SELECTORS,
  TWITTER_COMPOSE_BUTTON_SELECTORS,
  TWITTER_TOOLBAR_SELECTORS,
  TWITTER_NAVIGATION_SELECTORS,
  TWITTER_MODAL_SELECTORS,
  TWITTER_TWEET_SELECTORS,
  TWITTER_PROFILE_SELECTORS,
  TwitterSelectorValidator,
};

export {
  TwitterDOM,
  type TwitterPositionStrategy,
  type TwitterTheme,
  type TwitterComposeContext,
  type TwitterPositionResult,
};

// Re-export all LinkedIn functionality
export {
  injectLinkedInKeyboard,
  shutdownLinkedInInjection
};

export {
  LINKEDIN_COMPOSE_SELECTORS,
  LINKEDIN_COMMENT_SELECTORS,
  LINKEDIN_MESSAGE_SELECTORS,
  LINKEDIN_ARTICLE_SELECTORS,
  LINKEDIN_COMPANY_SELECTORS,
  LINKEDIN_FORM_SELECTORS,
  LINKEDIN_TOOLBAR_SELECTORS,
  LINKEDIN_NAVIGATION_SELECTORS,
  LINKEDIN_FEED_SELECTORS,
  LINKEDIN_PROFILE_SELECTORS,
  LinkedInSelectorValidator,
};

export {
  LinkedInDOM,
  type LinkedInTheme,
  type LinkedInComposeContext,
  type LinkedInPositionStrategy,
  type LinkedInPositionResult,
};

// Platform injection registry
export const PLATFORM_INJECTORS = {
  twitter: {
    inject: injectTwitterKeyboard,
    shutdown: shutdownTwitterInjection,
    name: 'Twitter/X',
    selectors: {
      compose: TWITTER_COMPOSE_SELECTORS,
      reply: TWITTER_REPLY_SELECTORS,
      quote: TWITTER_QUOTE_SELECTORS,
    },
  },
  linkedin: {
    inject: injectLinkedInKeyboard,
    shutdown: shutdownLinkedInInjection,
    name: 'LinkedIn',
    selectors: {
      compose: LINKEDIN_COMPOSE_SELECTORS,
      comment: LINKEDIN_COMMENT_SELECTORS,
      message: LINKEDIN_MESSAGE_SELECTORS,
      article: LINKEDIN_ARTICLE_SELECTORS,
      company: LINKEDIN_COMPANY_SELECTORS,
    },
  },
  // Reddit injector would be added here when implemented
  // reddit: { ... },
} as const;

export type PlatformInjectorKey = keyof typeof PLATFORM_INJECTORS;