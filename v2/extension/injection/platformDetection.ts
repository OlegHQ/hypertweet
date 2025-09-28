/**
 * Platform Detection Service
 *
 * Provides robust platform detection with support for:
 * - Hostname and URL pattern matching
 * - Single Page Application (SPA) navigation
 * - Caching for performance optimization
 * - Fallback detection strategies
 * - User agent analysis as fallback
 */

import {
  type Platform,
  type PlatformDetectionResult,
  type DetectionConfidence,
  type URLPattern,
  type DetectionOptions,
  type NavigationChangeEvent,
  type NavigationEvent,
  type PageType,
  type PlatformDetectionError,
  PlatformConstants,
  isPlatform,
  isPageType,
  isDetectionConfidence,
  isValidURLPattern,
  createPlatformDetectionError,
} from './types.js';

/**
 * Platform detection cache entry
 */
interface DetectionCacheEntry {
  readonly result: PlatformDetectionResult;
  readonly expiresAt: number;
}

/**
 * Navigation state tracker
 */
interface NavigationState {
  readonly currentURL: string;
  readonly previousURL: string | null;
  readonly platform: Platform | null;
  readonly pageType: PageType;
  readonly lastChange: number;
}

/**
 * Platform Detection Service - Singleton Implementation
 */
export class PlatformDetectionService {
  private static instance: PlatformDetectionService | null = null;

  private readonly cache = new Map<string, DetectionCacheEntry>();
  private readonly navigationListeners = new Set<
    (event: NavigationChangeEvent) => void
  >();
  private readonly options: Required<DetectionOptions>;
  private navigationState: NavigationState;
  private isInitialized = false;

  private constructor(options: Partial<DetectionOptions> = {}) {
    this.options = {
      enableCaching: options.enableCaching ?? true,
      cacheTimeout: options.cacheTimeout ?? 60000, // 1 minute
      strictMode: options.strictMode ?? false,
      fallbackToUserAgent: options.fallbackToUserAgent ?? true,
      customPatterns: options.customPatterns ?? [],
    };

    this.navigationState = {
      currentURL: window.location.href,
      previousURL: null,
      platform: null,
      pageType: 'unknown',
      lastChange: Date.now(),
    };
  }

  /**
   * Get singleton instance of PlatformDetectionService
   */
  public static getInstance(
    options?: Partial<DetectionOptions>
  ): PlatformDetectionService {
    PlatformDetectionService.instance ??= new PlatformDetectionService(options);
    return PlatformDetectionService.instance;
  }

  /**
   * Initialize the detection service with event listeners
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.setupNavigationListeners();
    this.detectInitialPlatform();
    this.isInitialized = true;
  }

  /**
   * Detect current platform with caching support
   */
  public detectPlatform(
    url: string = window.location.href
  ): PlatformDetectionResult {
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getCachedResult(url);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = this.performDetection(url);

      // Cache the result
      if (this.options.enableCaching) {
        this.setCachedResult(url, result);
      }

      return result;
    } catch (error) {
      const detectionError = createPlatformDetectionError(
        'DETECTION_TIMEOUT',
        `Platform detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        url,
        undefined,
        error instanceof Error ? error : undefined
      );

      return {
        platform: null,
        confidence: 'unknown',
        matchedPattern: null,
        timestamp: Date.now(),
        url,
        metadata: this.extractMetadata(url),
      };
    }
  }

  /**
   * Get current platform with confidence level
   */
  public getCurrentPlatform(): {
    platform: Platform | null;
    confidence: DetectionConfidence;
  } {
    const result = this.detectPlatform();
    return {
      platform: result.platform,
      confidence: result.confidence,
    };
  }

  /**
   * Detect page type for the current platform
   */
  public detectPageType(url: string = window.location.href): PageType {
    const { platform } = this.getCurrentPlatform();
    if (!platform) {
      return 'unknown';
    }

    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();

    switch (platform) {
      case 'twitter':
        return this.detectTwitterPageType(pathname, search);
      case 'linkedin':
        return this.detectLinkedInPageType(pathname, search);
      case 'reddit':
        return this.detectRedditPageType(pathname, search);
      default:
        return 'unknown';
    }
  }

  /**
   * Check if current platform is supported
   */
  public isPlatformSupported(platform?: Platform): boolean {
    const targetPlatform = platform ?? this.getCurrentPlatform().platform;
    return targetPlatform !== null && isPlatform(targetPlatform);
  }

  /**
   * Add navigation change listener
   */
  public addNavigationListener(
    listener: (event: NavigationChangeEvent) => void
  ): void {
    this.navigationListeners.add(listener);
  }

  /**
   * Remove navigation change listener
   */
  public removeNavigationListener(
    listener: (event: NavigationChangeEvent) => void
  ): void {
    this.navigationListeners.delete(listener);
  }

  /**
   * Clear detection cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    // Simple implementation - could be enhanced with actual hit/miss tracking
    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss counters for accurate rate
    };
  }

  /**
   * Dispose of the service and clean up listeners
   */
  public dispose(): void {
    this.removeNavigationListeners();
    this.clearCache();
    this.navigationListeners.clear();
    this.isInitialized = false;
  }

  /**
   * Core detection logic
   */
  private performDetection(url: string): PlatformDetectionResult {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const metadata = this.extractMetadata(url);

    // Primary detection: URL pattern matching
    for (const [platform, patterns] of Object.entries(
      PlatformConstants.URL_PATTERNS
    )) {
      for (const pattern of patterns) {
        const match = this.matchURLPattern(urlObj, pattern);
        if (match.isMatch) {
          return {
            platform: platform as Platform,
            confidence: match.confidence,
            matchedPattern: pattern,
            timestamp: Date.now(),
            url,
            metadata,
          };
        }
      }
    }

    // Custom patterns (if provided)
    if (this.options.customPatterns.length > 0) {
      for (const pattern of this.options.customPatterns) {
        if (isValidURLPattern(pattern)) {
          const match = this.matchURLPattern(urlObj, pattern);
          if (match.isMatch) {
            // Try to infer platform from hostname
            const inferredPlatform = this.inferPlatformFromHostname(hostname);
            if (inferredPlatform) {
              return {
                platform: inferredPlatform,
                confidence: 'medium',
                matchedPattern: pattern,
                timestamp: Date.now(),
                url,
                metadata,
              };
            }
          }
        }
      }
    }

    // Fallback: User agent analysis
    if (this.options.fallbackToUserAgent) {
      const platformFromUA = this.detectFromUserAgent();
      if (platformFromUA) {
        return {
          platform: platformFromUA,
          confidence: 'low',
          matchedPattern: null,
          timestamp: Date.now(),
          url,
          metadata,
        };
      }
    }

    // No platform detected
    return {
      platform: null,
      confidence: 'unknown',
      matchedPattern: null,
      timestamp: Date.now(),
      url,
      metadata,
    };
  }

  /**
   * Match URL against pattern with confidence scoring
   */
  private matchURLPattern(
    url: URL,
    pattern: URLPattern
  ): { isMatch: boolean; confidence: DetectionConfidence } {
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    const search = url.search.toLowerCase();
    const hash = url.hash.toLowerCase();

    // Check hostname (required)
    const hostnameMatch = pattern.hostname.some(h =>
      hostname.includes(h.toLowerCase())
    );
    if (!hostnameMatch) {
      return { isMatch: false, confidence: 'unknown' };
    }

    let confidence: DetectionConfidence = 'high';

    // Check pathname (optional but increases confidence)
    if (pattern.pathname) {
      const pathnameMatch = pattern.pathname.some(p => {
        if (p.includes(':')) {
          // Dynamic segment (e.g., /:username)
          const regex = new RegExp(p.replace(/:[^/]+/g, '[^/]+'));
          return regex.test(pathname);
        }
        return pathname.includes(p.toLowerCase());
      });

      if (!pathnameMatch) {
        confidence = 'medium';
      }
    }

    // Check search parameters (optional)
    if (pattern.search) {
      const searchMatch = pattern.search.some(s =>
        search.includes(s.toLowerCase())
      );
      if (!searchMatch) {
        confidence = confidence === 'high' ? 'medium' : 'low';
      }
    }

    // Check hash (optional)
    if (pattern.hash) {
      const hashMatch = pattern.hash.some(h => hash.includes(h.toLowerCase()));
      if (!hashMatch) {
        confidence = confidence === 'high' ? 'medium' : 'low';
      }
    }

    return { isMatch: true, confidence };
  }

  /**
   * Infer platform from hostname patterns
   */
  private inferPlatformFromHostname(hostname: string): Platform | null {
    const lowerHostname = hostname.toLowerCase();

    if (lowerHostname.includes('twitter') || lowerHostname.includes('x.com')) {
      return 'twitter';
    }
    if (lowerHostname.includes('linkedin')) {
      return 'linkedin';
    }
    if (lowerHostname.includes('reddit')) {
      return 'reddit';
    }

    return null;
  }

  /**
   * Fallback detection using user agent
   */
  private detectFromUserAgent(): Platform | null {
    const userAgent = navigator.userAgent.toLowerCase();

    // This is a weak detection method, primarily for mobile apps
    if (userAgent.includes('twitter')) {
      return 'twitter';
    }
    if (userAgent.includes('linkedin')) {
      return 'linkedin';
    }
    if (userAgent.includes('reddit')) {
      return 'reddit';
    }

    return null;
  }

  /**
   * Detect Twitter page types
   */
  private detectTwitterPageType(pathname: string, search: string): PageType {
    if (pathname === '/' || pathname === '/home') return 'feed';
    if (pathname === '/compose' || search.includes('compose=tweet'))
      return 'compose';
    if (pathname.includes('/status/')) return 'post';
    if (pathname.includes('/messages')) return 'messages';
    if (pathname.includes('/notifications')) return 'notifications';
    if (pathname.includes('/settings')) return 'settings';
    if (pathname.includes('/search')) return 'search';
    if (pathname.match(/^\/[^/]+$/)) return 'profile'; // Single segment likely username
    return 'unknown';
  }

  /**
   * Detect LinkedIn page types
   */
  private detectLinkedInPageType(pathname: string, search: string): PageType {
    if (pathname.includes('/feed')) return 'feed';
    if (pathname.includes('/in/')) return 'profile';
    if (pathname.includes('/messaging')) return 'messages';
    if (pathname.includes('/notifications')) return 'notifications';
    if (pathname.includes('/settings')) return 'settings';
    if (search.includes('search') || pathname.includes('/search'))
      return 'search';
    return 'unknown';
  }

  /**
   * Detect Reddit page types
   */
  private detectRedditPageType(pathname: string, search: string): PageType {
    if (
      pathname === '/' ||
      pathname.includes('/r/all') ||
      pathname.includes('/r/popular')
    )
      return 'feed';
    if (pathname.includes('/r/') && !pathname.includes('/comments/'))
      return 'feed';
    if (pathname.includes('/comments/')) return 'post';
    if (pathname.includes('/user/')) return 'profile';
    if (pathname.includes('/message/')) return 'messages';
    if (pathname.includes('/submit')) return 'compose';
    if (search.includes('q=') || pathname.includes('/search')) return 'search';
    return 'unknown';
  }

  /**
   * Extract metadata for detection result
   */
  private extractMetadata(url: string) {
    return {
      hostname: new URL(url).hostname,
      pathname: new URL(url).pathname,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };
  }

  /**
   * Get cached detection result
   */
  private getCachedResult(url: string): PlatformDetectionResult | null {
    const entry = this.cache.get(url);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }

    return entry.result;
  }

  /**
   * Cache detection result
   */
  private setCachedResult(url: string, result: PlatformDetectionResult): void {
    const expiresAt = Date.now() + this.options.cacheTimeout;
    this.cache.set(url, { result, expiresAt });

    // Cleanup old entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Setup navigation listeners for SPA support
   */
  private setupNavigationListeners(): void {
    // Listen for pushstate/popstate navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleNavigationChange('pushstate');
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleNavigationChange('pushstate');
    };

    window.addEventListener('popstate', () => {
      this.handleNavigationChange('popstate');
    });

    window.addEventListener('hashchange', () => {
      this.handleNavigationChange('hashchange');
    });

    window.addEventListener('beforeunload', () => {
      this.handleNavigationChange('beforeunload');
    });
  }

  /**
   * Handle navigation change events
   */
  private handleNavigationChange(type: NavigationEvent): void {
    const currentURL = window.location.href;

    if (currentURL === this.navigationState.currentURL) {
      return; // No actual navigation
    }

    const previousURL = this.navigationState.currentURL;
    const previousPlatform = this.navigationState.platform;

    // Detect new platform and page type
    const detection = this.detectPlatform(currentURL);
    const pageType = this.detectPageType(currentURL);

    // Update navigation state
    this.navigationState = {
      currentURL,
      previousURL,
      platform: detection.platform,
      pageType,
      lastChange: Date.now(),
    };

    // Notify listeners if platform changed
    if (detection.platform !== previousPlatform) {
      const event: NavigationChangeEvent = {
        type,
        from: previousURL,
        to: currentURL,
        platform: detection.platform,
        pageType,
        timestamp: Date.now(),
      };

      this.notifyNavigationListeners(event);
    }
  }

  /**
   * Notify all navigation listeners
   */
  private notifyNavigationListeners(event: NavigationChangeEvent): void {
    for (const listener of this.navigationListeners) {
      try {
        listener(event);
      } catch (error) {
        // Silently continue if listener throws
        if (process.env['NODE_ENV'] === 'development') {
          console.warn('Navigation listener error:', error);
        }
      }
    }
  }

  /**
   * Remove navigation event listeners
   */
  private removeNavigationListeners(): void {
    // Note: We can't easily restore the original pushState/replaceState
    // This is a limitation of this approach, but in practice it's rarely an issue
    // since the extension lifecycle manages this service
  }

  /**
   * Detect initial platform on service initialization
   */
  private detectInitialPlatform(): void {
    const detection = this.detectPlatform();
    const pageType = this.detectPageType();

    this.navigationState = {
      currentURL: window.location.href,
      previousURL: null,
      platform: detection.platform,
      pageType,
      lastChange: Date.now(),
    };
  }
}

/**
 * Convenient namespace for platform detection utilities
 */
export namespace PlatformDetection {
  /**
   * Quick platform detection for current page
   */
  export const detectCurrent = (): Platform | null => {
    const service = PlatformDetectionService.getInstance();
    return service.getCurrentPlatform().platform;
  };

  /**
   * Check if current platform is supported
   */
  export const isSupported = (): boolean => {
    const service = PlatformDetectionService.getInstance();
    return service.isPlatformSupported();
  };

  /**
   * Get current page type
   */
  export const getPageType = (): PageType => {
    const service = PlatformDetectionService.getInstance();
    return service.detectPageType();
  };

  /**
   * Initialize platform detection with options
   */
  export const initialize = (
    options?: Partial<DetectionOptions>
  ): PlatformDetectionService => {
    const service = PlatformDetectionService.getInstance(options);
    service.initialize();
    return service;
  };
}
