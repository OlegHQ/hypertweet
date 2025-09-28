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
  // LinkedIn and Reddit injectors would be added here when implemented
  // linkedin: { ... },
  // reddit: { ... },
} as const;

export type PlatformInjectorKey = keyof typeof PLATFORM_INJECTORS;