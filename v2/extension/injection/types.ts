/**
 * Type definitions for platform detection and injection system
 *
 * Provides comprehensive typing for platform identification, URL patterns,
 * DOM selectors, and injection configurations across supported social media platforms.
 */

/**
 * Supported social media platforms with consistent naming
 */
export type Platform = 'twitter' | 'linkedin' | 'reddit';

/**
 * Legacy support for existing SiteType enum
 * @deprecated Use Platform type instead for new code
 */
export enum SiteType {
  Twitter = 'twitter',
  Reddit = 'reddit',
  LinkedIn = 'linkedin',
}

/**
 * Platform detection confidence levels
 */
export type DetectionConfidence = 'high' | 'medium' | 'low' | 'unknown';

/**
 * URL pattern types for different detection strategies
 */
export interface URLPattern {
  readonly hostname: readonly string[];
  readonly pathname?: readonly string[];
  readonly search?: readonly string[];
  readonly hash?: readonly string[];
}

/**
 * Platform detection result with metadata
 */
export interface PlatformDetectionResult {
  readonly platform: Platform | null;
  readonly confidence: DetectionConfidence;
  readonly matchedPattern: URLPattern | null;
  readonly timestamp: number;
  readonly url: string;
  readonly metadata: {
    readonly hostname: string;
    readonly pathname: string;
    readonly userAgent: string;
    readonly referrer: string;
  };
}

/**
 * Page type classifications for platform-specific features
 */
export type PageType =
  | 'feed' // Main timeline/feed
  | 'profile' // User profile page
  | 'post' // Individual post/tweet page
  | 'thread' // Comment thread/replies
  | 'compose' // New post creation
  | 'messages' // Direct messages
  | 'search' // Search results
  | 'notifications' // Notifications feed
  | 'settings' // Account settings
  | 'unknown'; // Unclassified page

/**
 * Platform feature flags for conditional functionality
 */
export interface PlatformFeatures {
  readonly characterLimit: number | null;
  readonly supportsThreads: boolean;
  readonly supportsRichText: boolean;
  readonly supportsImages: boolean;
  readonly supportsPolls: boolean;
  readonly supportsScheduling: boolean;
  readonly requiresAuth: boolean;
  readonly hasDarkMode: boolean;
}

/**
 * DOM selector configuration with fallback strategies
 */
export interface SelectorConfig {
  readonly primary: string;
  readonly fallbacks: readonly string[];
  readonly excludeSelectors?: readonly string[];
  readonly validation?: {
    readonly minWidth?: number;
    readonly minHeight?: number;
    readonly mustBeVisible?: boolean;
    readonly mustBeInteractive?: boolean;
  };
}

/**
 * Platform-specific DOM selectors for injection points
 */
export interface PlatformSelectors {
  readonly textArea: SelectorConfig;
  readonly toolbar: SelectorConfig;
  readonly submitButton: SelectorConfig;
  readonly container: SelectorConfig;
  readonly postContent?: SelectorConfig;
  readonly userProfile?: SelectorConfig;
}

/**
 * Injection timing and retry configuration
 */
export interface InjectionTiming {
  readonly initialDelay: number;
  readonly retryInterval: number;
  readonly maxRetries: number;
  readonly timeout: number;
  readonly observerThrottle: number;
}

/**
 * Platform-specific styling and appearance settings
 */
export interface PlatformStyling {
  readonly themeMode: 'auto' | 'light' | 'dark';
  readonly customCSS?: string;
  readonly cssClasses: readonly string[];
  readonly zIndexBase: number;
  readonly responsiveBreakpoints: {
    readonly mobile: number;
    readonly tablet: number;
    readonly desktop: number;
  };
}

/**
 * Error handling and recovery configuration
 */
export interface ErrorRecoveryConfig {
  readonly enableRetry: boolean;
  readonly fallbackToManual: boolean;
  readonly logErrors: boolean;
  readonly notifyUser: boolean;
  readonly gracefulDegradation: boolean;
}

/**
 * Complete platform configuration interface
 */
export interface PlatformConfig {
  readonly platform: Platform;
  readonly displayName: string;
  readonly urlPatterns: readonly URLPattern[];
  readonly features: PlatformFeatures;
  readonly selectors: PlatformSelectors;
  readonly timing: InjectionTiming;
  readonly styling: PlatformStyling;
  readonly errorRecovery: ErrorRecoveryConfig;
  readonly pageTypes: {
    readonly supported: readonly PageType[];
    readonly detection: Record<PageType, readonly string[]>;
  };
}

/**
 * Platform detection options and configuration
 */
export interface DetectionOptions {
  readonly enableCaching: boolean;
  readonly cacheTimeout: number;
  readonly strictMode: boolean;
  readonly fallbackToUserAgent: boolean;
  readonly customPatterns?: readonly URLPattern[];
}

/**
 * Navigation event types for SPA support
 */
export type NavigationEvent =
  | 'initial'
  | 'pushstate'
  | 'popstate'
  | 'hashchange'
  | 'beforeunload'
  | 'domcontentloaded';

/**
 * Navigation change event data
 */
export interface NavigationChangeEvent {
  readonly type: NavigationEvent;
  readonly from: string;
  readonly to: string;
  readonly platform: Platform | null;
  readonly pageType: PageType;
  readonly timestamp: number;
}

/**
 * Platform detection error types
 */
export interface PlatformDetectionError {
  readonly code:
    | 'UNSUPPORTED_PLATFORM'
    | 'INVALID_URL'
    | 'DETECTION_TIMEOUT'
    | 'NETWORK_ERROR'
    | 'CONFIGURATION_ERROR';
  readonly message: string;
  readonly url: string;
  readonly timestamp: number;
  readonly platform?: Platform;
  readonly cause?: Error;
}

/**
 * Namespace for platform detection constants and utilities
 */
export namespace PlatformConstants {
  /**
   * Default URL patterns for supported platforms
   */
  export const URL_PATTERNS: Record<Platform, readonly URLPattern[]> = {
    twitter: [
      {
        hostname: [
          'twitter.com',
          'x.com',
          'mobile.twitter.com',
          'mobile.x.com',
        ],
        pathname: ['/home', '/compose', '/status/', '/messages', '/:username'],
      },
      {
        hostname: ['tweetdeck.twitter.com'],
        pathname: ['/'],
      },
    ],
    linkedin: [
      {
        hostname: ['linkedin.com', 'www.linkedin.com', 'm.linkedin.com'],
        pathname: ['/feed', '/in/', '/company/', '/jobs/', '/messaging/'],
      },
    ],
    reddit: [
      {
        hostname: [
          'reddit.com',
          'www.reddit.com',
          'old.reddit.com',
          'new.reddit.com',
          'np.reddit.com',
        ],
        pathname: ['/r/', '/user/', '/comments/', '/submit', '/message/'],
      },
    ],
  } as const;

  /**
   * Default timing configurations
   */
  export const DEFAULT_TIMING: InjectionTiming = {
    initialDelay: 100,
    retryInterval: 500,
    maxRetries: 10,
    timeout: 30000,
    observerThrottle: 100,
  } as const;

  /**
   * Default error recovery configuration
   */
  export const DEFAULT_ERROR_RECOVERY: ErrorRecoveryConfig = {
    enableRetry: true,
    fallbackToManual: true,
    logErrors: true,
    notifyUser: false,
    gracefulDegradation: true,
  } as const;
}

/**
 * Type guard to check if a value is a valid Platform
 */
export const isPlatform = (value: unknown): value is Platform => {
  return (
    typeof value === 'string' &&
    (['twitter', 'linkedin', 'reddit'] as const).includes(value as Platform)
  );
};

/**
 * Type guard to check if a value is a valid PageType
 */
export const isPageType = (value: unknown): value is PageType => {
  return (
    typeof value === 'string' &&
    (
      [
        'feed',
        'profile',
        'post',
        'thread',
        'compose',
        'messages',
        'search',
        'notifications',
        'settings',
        'unknown',
      ] as const
    ).includes(value as PageType)
  );
};

/**
 * Type guard to check if a value is a valid DetectionConfidence
 */
export const isDetectionConfidence = (
  value: unknown
): value is DetectionConfidence => {
  return (
    typeof value === 'string' &&
    (['high', 'medium', 'low', 'unknown'] as const).includes(
      value as DetectionConfidence
    )
  );
};

/**
 * Convert legacy SiteType to Platform
 */
export const siteTypeToPlatform = (siteType: SiteType): Platform => {
  switch (siteType) {
    case SiteType.Twitter:
      return 'twitter';
    case SiteType.Reddit:
      return 'reddit';
    case SiteType.LinkedIn:
      return 'linkedin';
    default:
      throw new Error(`Unsupported SiteType: ${siteType}`);
  }
};

/**
 * Convert Platform to legacy SiteType
 */
export const platformToSiteType = (platform: Platform): SiteType => {
  switch (platform) {
    case 'twitter':
      return SiteType.Twitter;
    case 'reddit':
      return SiteType.Reddit;
    case 'linkedin':
      return SiteType.LinkedIn;
    default:
      throw new Error(`Unsupported Platform: ${platform}`);
  }
};

/**
 * Create a PlatformDetectionError with current timestamp
 */
export const createPlatformDetectionError = (
  code: PlatformDetectionError['code'],
  message: string,
  url: string = window.location.href,
  platform?: Platform,
  cause?: Error
): PlatformDetectionError => ({
  code,
  message,
  url,
  timestamp: Date.now(),
  platform,
  cause,
});

/**
 * Validate URL pattern structure
 */
export const isValidURLPattern = (pattern: unknown): pattern is URLPattern => {
  if (typeof pattern !== 'object' || pattern === null) {
    return false;
  }

  const p = pattern as Record<string, unknown>;

  // hostname is required and must be a non-empty array of strings
  if (!Array.isArray(p.hostname) || p.hostname.length === 0) {
    return false;
  }

  if (
    !p.hostname.every((h: unknown) => typeof h === 'string' && h.length > 0)
  ) {
    return false;
  }

  // Optional arrays must be arrays of strings if present
  const optionalArrays = ['pathname', 'search', 'hash'] as const;
  for (const key of optionalArrays) {
    if (p[key] !== undefined) {
      if (
        !Array.isArray(p[key]) ||
        !(p[key] as unknown[]).every(
          (item: unknown) => typeof item === 'string'
        )
      ) {
        return false;
      }
    }
  }

  return true;
};
