/**
 * Platform Configuration System
 *
 * Centralized configuration for platform-specific injection behavior including:
 * - DOM selectors and targeting strategies
 * - Injection timing and retry logic
 * - Platform-specific styling and theming
 * - Error recovery and fallback strategies
 * - Feature flags and capabilities
 */

import {
  type Platform,
  type PlatformConfig,
  type PlatformSelectors,
  type PlatformFeatures,
  type InjectionTiming,
  type PlatformStyling,
  type ErrorRecoveryConfig,
  type PageType,
  type SelectorConfig,
  PlatformConstants,
  isPlatform,
} from './types.js';

/**
 * Default selector configuration factory
 */
export const createSelectorConfig = (
  primary: string,
  fallbacks: readonly string[] = [],
  options: Partial<SelectorConfig> = {}
): SelectorConfig => ({
  primary,
  fallbacks,
  excludeSelectors: [],
  validation: {
    minWidth: 50,
    minHeight: 20,
    mustBeVisible: true,
    mustBeInteractive: false,
  },
  ...options,
});

/**
 * Twitter/X Platform Configuration
 */
const TWITTER_CONFIG: PlatformConfig = {
  platform: 'twitter',
  displayName: 'Twitter / X',
  urlPatterns: PlatformConstants.URL_PATTERNS.twitter,

  features: {
    characterLimit: 280,
    supportsThreads: true,
    supportsRichText: false,
    supportsImages: true,
    supportsPolls: true,
    supportsScheduling: true,
    requiresAuth: true,
    hasDarkMode: true,
  },

  selectors: {
    textArea: createSelectorConfig(
      '[data-testid="tweetTextarea_0"]',
      [
        'div[contenteditable="true"][data-text="true"]',
        '.public-DraftEditor-content',
        '[role="textbox"]',
        '.tweet-box textarea',
      ],
      {
        validation: {
          minWidth: 100,
          minHeight: 30,
          mustBeVisible: true,
          mustBeInteractive: true,
        },
      }
    ),

    toolbar: createSelectorConfig('[data-testid="toolBar"]', [
      '.css-175oi2r.r-136c7rf.r-16y2uox',
      '.css-175oi2r.r-1awozwy .css-175oi2r.r-136c7rf',
      '[role="group"][aria-label*="formatting"]',
      '.tweet-compose-footer',
    ]),

    submitButton: createSelectorConfig('[data-testid="tweetButton"]', [
      '[data-testid="tweetButtonInline"]',
      'button[type="submit"]',
      '.tweet-action.tweet-btn',
    ]),

    container: createSelectorConfig('[data-testid="tweetComposer"]', [
      '[role="main"] form',
      '.tweet-compose',
      '.composer-container',
    ]),

    postContent: createSelectorConfig('[data-testid="tweetText"]', [
      '.tweet-text',
      '[role="article"] [lang]',
    ]),

    userProfile: createSelectorConfig('[data-testid="UserName"]', [
      '.profile-header-name',
      '[role="button"] span[dir="ltr"]',
    ]),
  },

  timing: {
    initialDelay: 500,
    retryInterval: 250,
    maxRetries: 15,
    timeout: 10000,
    observerThrottle: 100,
  },

  styling: {
    themeMode: 'auto',
    cssClasses: ['twitter-keyboard', 'x-keyboard'],
    zIndexBase: 1000,
    customCSS: `
      .twitter-keyboard {
        border-color: rgb(207, 217, 222);
        background: rgb(255, 255, 255);
        color: rgb(15, 20, 25);
      }
      
      [data-theme="dark"] .twitter-keyboard,
      @media (prefers-color-scheme: dark) {
        .twitter-keyboard {
          border-color: rgb(47, 51, 54);
          background: rgb(21, 24, 28);
          color: rgb(247, 249, 249);
        }
      }
    `,
    responsiveBreakpoints: {
      mobile: 480,
      tablet: 768,
      desktop: 1024,
    },
  },

  errorRecovery: {
    enableRetry: true,
    fallbackToManual: true,
    logErrors: true,
    notifyUser: false,
    gracefulDegradation: true,
  },

  pageTypes: {
    supported: ['feed', 'post', 'compose', 'profile', 'thread'] as const,
    detection: {
      feed: ['/home', '/'],
      post: ['/status/'],
      compose: ['/compose', '?compose=tweet'],
      profile: ['/[username]'],
      thread: ['/status/', '/thread/'],
      messages: ['/messages'],
      search: ['/search'],
      notifications: ['/notifications'],
      settings: ['/settings'],
      unknown: [],
    },
  },
} as const;

/**
 * LinkedIn Platform Configuration
 */
const LINKEDIN_CONFIG: PlatformConfig = {
  platform: 'linkedin',
  displayName: 'LinkedIn',
  urlPatterns: PlatformConstants.URL_PATTERNS.linkedin,

  features: {
    characterLimit: 3000,
    supportsThreads: false,
    supportsRichText: true,
    supportsImages: true,
    supportsPolls: true,
    supportsScheduling: true,
    requiresAuth: true,
    hasDarkMode: false,
  },

  selectors: {
    textArea: createSelectorConfig(
      '.ql-editor[contenteditable="true"]',
      [
        '[data-test-ql-editor-contenteditable="true"]',
        '.editor-content[contenteditable="true"]',
        '.compose-publisher__editor',
        '[role="textbox"].ql-editor',
      ],
      {
        validation: {
          minWidth: 200,
          minHeight: 40,
          mustBeVisible: true,
          mustBeInteractive: true,
        },
      }
    ),

    toolbar: createSelectorConfig('.share-creation-state__bottom', [
      '.composer-submit-actions',
      '.ql-toolbar',
      '.share-actions-bar',
    ]),

    submitButton: createSelectorConfig(
      'button[type="submit"].share-actions-control-button',
      [
        '.share-actions-control-button--primary-text',
        'button.composer-submit__button',
      ]
    ),

    container: createSelectorConfig('.share-creation-state', [
      '.composer-container',
      '.share-box-content',
      '.ql-container',
    ]),

    postContent: createSelectorConfig('.update-components-text', [
      '.feed-shared-text',
      '.attributed-text-segment-list__content',
    ]),

    userProfile: createSelectorConfig('.update-components-actor__title', [
      '.profile-rail-card__actor-link',
      '.feed-identity-module__actor-meta',
    ]),
  },

  timing: {
    initialDelay: 300,
    retryInterval: 500,
    maxRetries: 12,
    timeout: 15000,
    observerThrottle: 150,
  },

  styling: {
    themeMode: 'light',
    cssClasses: ['linkedin-keyboard'],
    zIndexBase: 500,
    customCSS: `
      .linkedin-keyboard {
        border: 1px solid rgba(0,0,0,0.15);
        background: #ffffff;
        color: rgba(0,0,0,0.9);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
      }
    `,
    responsiveBreakpoints: {
      mobile: 480,
      tablet: 768,
      desktop: 1200,
    },
  },

  errorRecovery: {
    enableRetry: true,
    fallbackToManual: false,
    logErrors: true,
    notifyUser: true,
    gracefulDegradation: true,
  },

  pageTypes: {
    supported: ['feed', 'profile', 'messages', 'compose'] as const,
    detection: {
      feed: ['/feed'],
      profile: ['/in/'],
      messages: ['/messaging'],
      compose: ['/share'],
      post: ['/posts/'],
      thread: [],
      search: ['/search'],
      notifications: ['/notifications'],
      settings: ['/settings'],
      unknown: [],
    },
  },
} as const;

/**
 * Reddit Platform Configuration
 */
const REDDIT_CONFIG: PlatformConfig = {
  platform: 'reddit',
  displayName: 'Reddit',
  urlPatterns: PlatformConstants.URL_PATTERNS.reddit,

  features: {
    characterLimit: 40000,
    supportsThreads: true,
    supportsRichText: true,
    supportsImages: true,
    supportsPolls: true,
    supportsScheduling: false,
    requiresAuth: false,
    hasDarkMode: true,
  },

  selectors: {
    textArea: createSelectorConfig(
      'div[contenteditable="true"][role="textbox"]',
      [
        '.DraftEditor-root .public-DraftEditor-content',
        '.usertext-edit textarea',
        'shreddit-composer [contenteditable="true"]',
      ],
      {
        validation: {
          minWidth: 200,
          minHeight: 60,
          mustBeVisible: true,
          mustBeInteractive: true,
        },
      }
    ),

    toolbar: createSelectorConfig('.s172n2p-1.eXwvgH', [
      '.usertext-buttons',
      '.bottom-area .usertext-buttons',
      '.RichTextJSON-toolbar',
    ]),

    submitButton: createSelectorConfig('button[type="submit"]', [
      '.save-button',
      '.usertext-buttons .save',
      'button[form*="submit"]',
    ]),

    container: createSelectorConfig('shreddit-composer', [
      '.usertext-edit',
      '.Comment',
      '.submit-page-container',
    ]),

    postContent: createSelectorConfig('.md', [
      '.usertext-body',
      '[data-test-id="post-content"]',
    ]),

    userProfile: createSelectorConfig('.author', [
      '[data-testid="comment_author_link"]',
      '.comment-author-link',
    ]),
  },

  timing: {
    initialDelay: 200,
    retryInterval: 300,
    maxRetries: 20,
    timeout: 12000,
    observerThrottle: 80,
  },

  styling: {
    themeMode: 'auto',
    cssClasses: ['reddit-keyboard'],
    zIndexBase: 1500,
    customCSS: `
      .reddit-keyboard {
        border: 1px solid #edeff1;
        background: #ffffff;
        color: #1c1c1c;
        font-family: IBMPlexSans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
      }
      
      [data-theme="dark"] .reddit-keyboard,
      body.dark .reddit-keyboard,
      @media (prefers-color-scheme: dark) {
        .reddit-keyboard {
          border-color: #343536;
          background: #1a1a1b;
          color: #d7dadc;
        }
      }
    `,
    responsiveBreakpoints: {
      mobile: 414,
      tablet: 768,
      desktop: 960,
    },
  },

  errorRecovery: {
    enableRetry: true,
    fallbackToManual: true,
    logErrors: true,
    notifyUser: false,
    gracefulDegradation: true,
  },

  pageTypes: {
    supported: ['feed', 'post', 'thread', 'compose', 'profile'] as const,
    detection: {
      feed: ['/r/', '/'],
      post: ['/comments/'],
      thread: ['/comments/'],
      compose: ['/submit'],
      profile: ['/user/'],
      messages: ['/message/'],
      search: ['/search'],
      notifications: [],
      settings: ['/prefs'],
      unknown: [],
    },
  },
} as const;

/**
 * Platform configuration registry
 */
const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  twitter: TWITTER_CONFIG,
  linkedin: LINKEDIN_CONFIG,
  reddit: REDDIT_CONFIG,
} as const;

/**
 * Platform Configuration Manager
 */
export class PlatformConfigManager {
  private static instance: PlatformConfigManager | null = null;
  private readonly configOverrides = new Map<
    Platform,
    Partial<PlatformConfig>
  >();

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PlatformConfigManager {
    PlatformConfigManager.instance ??= new PlatformConfigManager();
    return PlatformConfigManager.instance;
  }

  /**
   * Get complete configuration for a platform
   */
  public getConfig(platform: Platform): PlatformConfig {
    if (!isPlatform(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }

    const baseConfig = PLATFORM_CONFIGS[platform];
    const overrides = this.configOverrides.get(platform);

    if (!overrides) {
      return baseConfig;
    }

    // Deep merge configuration with overrides
    return this.mergeConfigs(baseConfig, overrides);
  }

  /**
   * Get selectors configuration for a platform
   */
  public getSelectors(platform: Platform): PlatformSelectors {
    return this.getConfig(platform).selectors;
  }

  /**
   * Get platform features
   */
  public getFeatures(platform: Platform): PlatformFeatures {
    return this.getConfig(platform).features;
  }

  /**
   * Get timing configuration
   */
  public getTiming(platform: Platform): InjectionTiming {
    return this.getConfig(platform).timing;
  }

  /**
   * Get styling configuration
   */
  public getStyling(platform: Platform): PlatformStyling {
    return this.getConfig(platform).styling;
  }

  /**
   * Get error recovery configuration
   */
  public getErrorRecovery(platform: Platform): ErrorRecoveryConfig {
    return this.getConfig(platform).errorRecovery;
  }

  /**
   * Check if page type is supported for platform
   */
  public isPageTypeSupported(platform: Platform, pageType: PageType): boolean {
    const config = this.getConfig(platform);
    return config.pageTypes.supported.includes(pageType);
  }

  /**
   * Get supported page types for platform
   */
  public getSupportedPageTypes(platform: Platform): readonly PageType[] {
    return this.getConfig(platform).pageTypes.supported;
  }

  /**
   * Set configuration override for a platform
   */
  public setConfigOverride(
    platform: Platform,
    override: Partial<PlatformConfig>
  ): void {
    if (!isPlatform(platform)) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    this.configOverrides.set(platform, override);
  }

  /**
   * Clear configuration override for a platform
   */
  public clearConfigOverride(platform: Platform): void {
    this.configOverrides.delete(platform);
  }

  /**
   * Clear all configuration overrides
   */
  public clearAllOverrides(): void {
    this.configOverrides.clear();
  }

  /**
   * Get all supported platforms
   */
  public getSupportedPlatforms(): readonly Platform[] {
    return Object.keys(PLATFORM_CONFIGS) as Platform[];
  }

  /**
   * Validate selector configuration
   */
  public validateSelector(selector: SelectorConfig): boolean {
    if (!selector.primary || typeof selector.primary !== 'string') {
      return false;
    }

    if (!Array.isArray(selector.fallbacks)) {
      return false;
    }

    return selector.fallbacks.every(fallback => typeof fallback === 'string');
  }

  /**
   * Test selector against current DOM
   */
  public testSelector(selector: SelectorConfig): {
    found: boolean;
    element: HTMLElement | null;
    matchedSelector: string | null;
  } {
    // Try primary selector first
    let element = document.querySelector<HTMLElement>(selector.primary);
    if (element && this.validateElement(element, selector.validation)) {
      return {
        found: true,
        element,
        matchedSelector: selector.primary,
      };
    }

    // Try fallback selectors
    for (const fallback of selector.fallbacks) {
      element = document.querySelector<HTMLElement>(fallback);
      if (element && this.validateElement(element, selector.validation)) {
        return {
          found: true,
          element,
          matchedSelector: fallback,
        };
      }
    }

    return {
      found: false,
      element: null,
      matchedSelector: null,
    };
  }

  /**
   * Deep merge two configuration objects
   */
  private mergeConfigs(
    base: PlatformConfig,
    override: Partial<PlatformConfig>
  ): PlatformConfig {
    const merged = { ...base } as unknown as Record<string, unknown>;

    for (const [key, value] of Object.entries(override)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Deep merge nested objects
        merged[key] = {
          ...((base as unknown as Record<string, unknown>)[key] as object),
          ...value,
        };
      } else {
        // Direct assignment for primitives and arrays
        merged[key] = value;
      }
    }

    return merged as unknown as PlatformConfig;
  }

  /**
   * Validate DOM element against selector validation rules
   */
  private validateElement(
    element: HTMLElement,
    validation?: SelectorConfig['validation']
  ): boolean {
    if (!validation) {
      return true;
    }

    // Check visibility
    if (validation.mustBeVisible) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      if (
        rect.width === 0 ||
        rect.height === 0 ||
        style.visibility === 'hidden' ||
        style.display === 'none'
      ) {
        return false;
      }
    }

    // Check minimum dimensions
    if (validation.minWidth || validation.minHeight) {
      const rect = element.getBoundingClientRect();

      if (validation.minWidth && rect.width < validation.minWidth) {
        return false;
      }

      if (validation.minHeight && rect.height < validation.minHeight) {
        return false;
      }
    }

    // Check interactivity
    if (validation.mustBeInteractive) {
      if (
        element.hasAttribute('disabled') ||
        element.hasAttribute('readonly') ||
        (!element.isContentEditable &&
          !['input', 'textarea', 'button'].includes(
            element.tagName.toLowerCase()
          ))
      ) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Convenient namespace for platform configuration utilities
 */
export namespace PlatformConfigUtils {
  /**
   * Get configuration for a platform
   */
  export const get = (platform: Platform): PlatformConfig => {
    const manager = PlatformConfigManager.getInstance();
    return manager.getConfig(platform);
  };

  /**
   * Get selectors for a platform
   */
  export const getSelectors = (platform: Platform): PlatformSelectors => {
    const manager = PlatformConfigManager.getInstance();
    return manager.getSelectors(platform);
  };

  /**
   * Test if a selector works on current page
   */
  export const testSelector = (selector: SelectorConfig) => {
    const manager = PlatformConfigManager.getInstance();
    return manager.testSelector(selector);
  };

  /**
   * Get all supported platforms
   */
  export const getSupportedPlatforms = (): readonly Platform[] => {
    const manager = PlatformConfigManager.getInstance();
    return manager.getSupportedPlatforms();
  };

  /**
   * Check if platform supports page type
   */
  export const supportsPageType = (
    platform: Platform,
    pageType: PageType
  ): boolean => {
    const manager = PlatformConfigManager.getInstance();
    return manager.isPageTypeSupported(platform, pageType);
  };
}

/**
 * Export default configurations for external access
 */
export { TWITTER_CONFIG, LINKEDIN_CONFIG, REDDIT_CONFIG, PLATFORM_CONFIGS };
