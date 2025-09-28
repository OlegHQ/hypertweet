/**
 * Central Injection Management System
 * 
 * Coordinates injection across all platforms with state management, cleanup,
 * error handling, retry logic, and performance monitoring.
 */

import { 
  createPlatformDetectionError,
  type Platform, 
  type PlatformDetectionResult, 
  type PlatformDetectionError,
  type PlatformConfig 
} from './types.js';
import { PlatformDetectionService } from './platformDetection.js';
import { PlatformConfigManager } from './platformConfig.js';
import { MutationObserverManager } from './mutationObserver.js';
import { DOMUtils } from './domUtils.js';

/**
 * Injection state enumeration
 */
export type InjectionState = 'pending' | 'injecting' | 'active' | 'failed' | 'cleanup';

/**
 * Injection configuration
 */
export interface InjectionConfig {
  readonly platform: Platform;
  readonly targetSelector: string;
  readonly fallbackSelectors?: readonly string[];
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
  readonly priority?: 'low' | 'medium' | 'high';
  readonly performanceMonitoring?: boolean;
  readonly autoCleanup?: boolean;
  readonly collisionHandling?: 'skip' | 'replace' | 'offset' | 'merge';
}

/**
 * Injection result
 */
export interface InjectionResult {
  readonly success: boolean;
  readonly injectionId: string;
  readonly element?: HTMLElement;
  readonly error?: PlatformDetectionError;
  readonly performanceMetrics?: PerformanceMetrics;
  readonly retryCount?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  readonly injectionTime: number;
  readonly domReadyTime: number;
  readonly elementCreationTime: number;
  readonly positioningTime: number;
  readonly observerSetupTime: number;
  readonly totalTime: number;
}

/**
 * Injection status information
 */
export interface InjectionStatus {
  readonly id: string;
  readonly platform: Platform;
  readonly state: InjectionState;
  readonly config: InjectionConfig;
  readonly element: HTMLElement | null;
  readonly createdAt: number;
  readonly lastUpdated: number;
  readonly retryCount: number;
  readonly error?: PlatformDetectionError;
  readonly performanceMetrics?: PerformanceMetrics;
  readonly observerId?: string;
}

/**
 * Navigation change event
 */
export interface NavigationChangeEvent {
  readonly oldUrl: string;
  readonly newUrl: string;
  readonly platform: Platform | null;
  readonly timestamp: number;
}

/**
 * Global injection statistics
 */
export interface GlobalInjectionStats {
  readonly totalInjections: number;
  readonly activeInjections: number;
  readonly failedInjections: number;
  readonly byPlatform: Record<Platform, {
    readonly active: number;
    readonly failed: number;
    readonly total: number;
  }>;
  readonly averageInjectionTime: number;
  readonly performanceStats: {
    readonly totalExecutionTime: number;
    readonly averageRetryCount: number;
    readonly successRate: number;
  };
}

/**
 * Injection event listeners
 */
export interface InjectionEventListeners {
  readonly onInjectionStart?: (injectionId: string, config: InjectionConfig) => void;
  readonly onInjectionSuccess?: (injectionId: string, element: HTMLElement) => void;
  readonly onInjectionFailure?: (injectionId: string, error: PlatformDetectionError) => void;
  readonly onInjectionCleanup?: (injectionId: string) => void;
  readonly onNavigationChange?: (event: NavigationChangeEvent) => void;
  readonly onPerformanceAlert?: (metrics: PerformanceMetrics, threshold: number) => void;
}

/**
 * Central Injection Management System
 */
export namespace InjectionManager {
  
  // Constants
  const DEFAULT_RETRY_ATTEMPTS = 3;
  const DEFAULT_RETRY_DELAY = 1000;
  const PERFORMANCE_ALERT_THRESHOLD = 500; // milliseconds
  const MAX_CONCURRENT_INJECTIONS = 5;
  const CLEANUP_CHECK_INTERVAL = 30000; // 30 seconds
  const NAVIGATION_DEBOUNCE = 250; // milliseconds
  
  // State management
  const injectionRegistry = new Map<string, InjectionStatus>();
  const eventListeners: InjectionEventListeners = {};
  
  // Services
  let platformDetection: PlatformDetectionService | null = null;
  let configManager: PlatformConfigManager | null = null;
  
  // Global state
  let injectionIdCounter = 0;
  let isInitialized = false;
  let currentUrl = '';
  let currentPlatform: Platform | null = null;
  let cleanupTimer: number | null = null;
  let navigationTimeout: number | null = null;
  
  /**
   * Initializes the injection management system
   */
  export function initialize(listeners?: InjectionEventListeners): boolean {
    try {
      if (isInitialized) {
        return true;
      }
      
      // Initialize services
      platformDetection = PlatformDetectionService.getInstance();
      configManager = PlatformConfigManager.getInstance();
      
      // Set up event listeners
      if (listeners) {
        Object.assign(eventListeners, listeners);
      }
      
      // Initialize current state
      currentUrl = window.location.href;
      const detectionResult = platformDetection.detectPlatform();
      currentPlatform = detectionResult.platform;
      
      // Set up navigation monitoring
      setupNavigationMonitoring();
      
      // Start cleanup timer
      startCleanupTimer();
      
      isInitialized = true;
      return true;
      
    } catch (error) {
      console.error('Failed to initialize InjectionManager:', error);
      return false;
    }
  }
  
  /**
   * Injects an element with the specified configuration
   */
  export async function inject(
    config: InjectionConfig,
    elementFactory: () => HTMLElement | Promise<HTMLElement>
  ): Promise<InjectionResult> {
    if (!isInitialized) {
      return {
        success: false,
        injectionId: '',
        error: createPlatformDetectionError(
          'NOT_INITIALIZED',
          'InjectionManager not initialized',
          {}
        ),
      };
    }
    
    // Generate injection ID
    const injectionId = `injection-${++injectionIdCounter}`;
    const startTime = performance.now();
    
    // Check concurrent injection limit
    const activeInjections = Array.from(injectionRegistry.values())
      .filter(status => status.state === 'injecting').length;
    
    if (activeInjections >= MAX_CONCURRENT_INJECTIONS) {
      return {
        success: false,
        injectionId,
        error: createPlatformDetectionError(
          'INJECTION_LIMIT_EXCEEDED',
          'Maximum concurrent injections exceeded',
          { maxConcurrent: MAX_CONCURRENT_INJECTIONS }
        ),
      };
    }
    
    // Create initial status
    const status: InjectionStatus = {
      id: injectionId,
      platform: config.platform,
      state: 'pending',
      config,
      element: null,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      retryCount: 0,
    };
    
    injectionRegistry.set(injectionId, status);
    
    // Notify injection start
    eventListeners.onInjectionStart?.(injectionId, config);
    
    try {
      // Attempt injection with retries
      const result = await attemptInjectionWithRetries(
        injectionId,
        config,
        elementFactory,
        startTime
      );
      
      return result;
      
    } catch (error) {
      const finalError = createPlatformDetectionError(
        'INJECTION_FAILED',
        `Injection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { injectionId, config }
      );
      
      // Update status
      updateInjectionStatus(injectionId, {
        state: 'failed',
        error: finalError,
      });
      
      // Notify failure
      eventListeners.onInjectionFailure?.(injectionId, finalError);
      
      return {
        success: false,
        injectionId,
        error: finalError,
      };
    }
  }
  
  /**
   * Removes a specific injection
   */
  export function removeInjection(injectionId: string): boolean {
    const status = injectionRegistry.get(injectionId);
    if (!status) {
      return false;
    }
    
    try {
      // Update state
      updateInjectionStatus(injectionId, { state: 'cleanup' });
      
      // Perform cleanup
      if (status.element) {
        DOMUtils.safeRemoveElement(status.element);
      }
      
      // Stop observer if exists
      if (status.observerId) {
        MutationObserverManager.stopObserving(status.observerId);
      }
      
      // Remove from registry
      injectionRegistry.delete(injectionId);
      
      // Notify cleanup
      eventListeners.onInjectionCleanup?.(injectionId);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to remove injection ${injectionId}:`, error);
      return false;
    }
  }
  
  /**
   * Removes all injections for a specific platform
   */
  export function removePlatformInjections(platform: Platform): number {
    let removedCount = 0;
    
    for (const [injectionId, status] of injectionRegistry.entries()) {
      if (status.platform === platform) {
        if (removeInjection(injectionId)) {
          removedCount++;
        }
      }
    }
    
    return removedCount;
  }
  
  /**
   * Removes all active injections
   */
  export function removeAllInjections(): number {
    let removedCount = 0;
    
    for (const injectionId of injectionRegistry.keys()) {
      if (removeInjection(injectionId)) {
        removedCount++;
      }
    }
    
    return removedCount;
  }
  
  /**
   * Gets the status of a specific injection
   */
  export function getInjectionStatus(injectionId: string): InjectionStatus | null {
    return injectionRegistry.get(injectionId) ?? null;
  }
  
  /**
   * Gets all injection statuses
   */
  export function getAllInjectionStatuses(): readonly InjectionStatus[] {
    return Array.from(injectionRegistry.values());
  }
  
  /**
   * Gets injections for a specific platform
   */
  export function getPlatformInjections(platform: Platform): readonly InjectionStatus[] {
    return Array.from(injectionRegistry.values())
      .filter(status => status.platform === platform);
  }
  
  /**
   * Gets global injection statistics
   */
  export function getGlobalStats(): GlobalInjectionStats {
    const allStatuses = Array.from(injectionRegistry.values());
    const totalInjections = allStatuses.length;
    const activeInjections = allStatuses.filter(s => s.state === 'active').length;
    const failedInjections = allStatuses.filter(s => s.state === 'failed').length;
    
    // Calculate by-platform stats
    const byPlatformMutable = {
      twitter: { active: 0, failed: 0, total: 0 },
      linkedin: { active: 0, failed: 0, total: 0 },
      reddit: { active: 0, failed: 0, total: 0 },
    };
    
    for (const status of allStatuses) {
      const platformStats = byPlatformMutable[status.platform];
      platformStats.total++;
      if (status.state === 'active') platformStats.active++;
      if (status.state === 'failed') platformStats.failed++;
    }
    
    const byPlatform: GlobalInjectionStats['byPlatform'] = byPlatformMutable;
    
    // Calculate performance stats
    const metricsArray = allStatuses
      .map(s => s.performanceMetrics)
      .filter((m): m is PerformanceMetrics => m !== undefined);
    
    const averageInjectionTime = metricsArray.length > 0
      ? metricsArray.reduce((sum, m) => sum + m.totalTime, 0) / metricsArray.length
      : 0;
    
    const totalExecutionTime = metricsArray.reduce((sum, m) => sum + m.totalTime, 0);
    const averageRetryCount = allStatuses.reduce((sum, s) => sum + s.retryCount, 0) / Math.max(totalInjections, 1);
    const successRate = totalInjections > 0 ? activeInjections / totalInjections : 0;
    
    return {
      totalInjections,
      activeInjections,
      failedInjections,
      byPlatform,
      averageInjectionTime,
      performanceStats: {
        totalExecutionTime,
        averageRetryCount,
        successRate,
      },
    };
  }
  
  /**
   * Forces cleanup of stale injections
   */
  export function forceCleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes
    
    for (const [injectionId, status] of injectionRegistry.entries()) {
      // Clean up very old injections
      if (now - status.lastUpdated > staleThreshold) {
        if (removeInjection(injectionId)) {
          cleanedCount++;
        }
      }
      // Clean up elements that are no longer in DOM
      else if (status.element && !document.contains(status.element)) {
        if (removeInjection(injectionId)) {
          cleanedCount++;
        }
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * Shuts down the injection manager
   */
  export function shutdown(): void {
    // Remove all injections
    removeAllInjections();
    
    // Stop mutation observers
    MutationObserverManager.stopAllObservers();
    
    // Clear timers
    if (cleanupTimer !== null) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    
    if (navigationTimeout !== null) {
      clearTimeout(navigationTimeout);
      navigationTimeout = null;
    }
    
    // Reset state
    injectionRegistry.clear();
    isInitialized = false;
    platformDetection = null;
    configManager = null;
  }
  
  // Internal helper functions
  
  /**
   * Attempts injection with retry logic
   */
  async function attemptInjectionWithRetries(
    injectionId: string,
    config: InjectionConfig,
    elementFactory: () => HTMLElement | Promise<HTMLElement>,
    startTime: number
  ): Promise<InjectionResult> {
    const maxRetries = config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
    const retryDelay = config.retryDelay ?? DEFAULT_RETRY_DELAY;
    let lastError: PlatformDetectionError | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        updateInjectionStatus(injectionId, {
          state: 'injecting',
          retryCount: attempt,
        });
        
        const result = await performSingleInjection(injectionId, config, elementFactory, startTime);
        
        if (result.success) {
          return result;
        }
        
        lastError = result.error ?? null;
        
        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
        
      } catch (error) {
        lastError = createPlatformDetectionError(
          'INJECTION_RETRY_FAILED',
          `Retry ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { attempt, injectionId }
        );
      }
    }
    
    // All retries failed
    const finalError = lastError ?? createPlatformDetectionError(
      'INJECTION_FAILED',
      'All retry attempts exhausted',
      { maxRetries, injectionId }
    );
    
    updateInjectionStatus(injectionId, {
      state: 'failed',
      error: finalError,
    });
    
    return {
      success: false,
      injectionId,
      error: finalError,
      retryCount: maxRetries,
    };
  }
  
  /**
   * Performs a single injection attempt
   */
  async function performSingleInjection(
    injectionId: string,
    config: InjectionConfig,
    elementFactory: () => HTMLElement | Promise<HTMLElement>,
    startTime: number
  ): Promise<InjectionResult> {
    const metrics: Partial<{ -readonly [K in keyof PerformanceMetrics]: PerformanceMetrics[K] }> = {};
    
    // Wait for DOM ready
    const domReadyStart = performance.now();
    await waitForDOMReady();
    metrics.domReadyTime = performance.now() - domReadyStart;
    
    // Validate target selector
    const selectorResult = DOMUtils.validateSelector(
      config.targetSelector,
      config.fallbackSelectors ?? []
    );
    
    if (!selectorResult.isValid || !selectorResult.element) {
      throw createPlatformDetectionError(
        'TARGET_NOT_FOUND',
        'Target element not found',
        { config, selectorResult }
      );
    }
    
    const targetElement = selectorResult.element as HTMLElement;
    
    // Create element
    const elementCreationStart = performance.now();
    const element = await elementFactory();
    metrics.elementCreationTime = performance.now() - elementCreationStart;
    
    // Check for collisions
    const collisionResult = DOMUtils.detectCollisions(element);
    if (collisionResult.hasCollision) {
      const action = config.collisionHandling ?? collisionResult.recommendedAction;
      
      if (action === 'skip') {
        throw createPlatformDetectionError(
          'COLLISION_DETECTED',
          'Element collision detected, skipping injection',
          { collisionResult }
        );
      }
      
      // Handle other collision strategies as needed
    }
    
    // Position element
    const positioningStart = performance.now();
    const positionResult = DOMUtils.positionElement(element, targetElement, {
      strategy: 'after',
      respectBoundaries: true,
    });
    
    if (!positionResult.success) {
      throw positionResult.error ?? createPlatformDetectionError(
        'POSITIONING_FAILED',
        'Failed to position element',
        { positionResult }
      );
    }
    metrics.positioningTime = performance.now() - positioningStart;
    
    // Set up mutation observer for monitoring
    const observerStart = performance.now();
    let observerId: string | undefined;
    
    if (config.autoCleanup !== false) {
      const observerResult = MutationObserverManager.startObserving(
        {
          platform: config.platform,
          target: targetElement.parentElement ?? document.body,
          options: { childList: true, subtree: true },
          priority: config.priority,
        },
        (mutations) => {
          // Check if our element was removed
          for (const mutation of mutations) {
            if (mutation.type === 'childList') {
              for (const node of Array.from(mutation.removedNodes)) {
                if (node === element) {
                  removeInjection(injectionId);
                  return;
                }
              }
            }
          }
        }
      );
      
      if (observerResult.success) {
        observerId = observerResult.observerId;
      }
    }
    metrics.observerSetupTime = performance.now() - observerStart;
    
    // Calculate total time
    metrics.totalTime = performance.now() - startTime;
    metrics.injectionTime = metrics.totalTime - (metrics.domReadyTime ?? 0);
    
    // Register for cleanup
    DOMUtils.registerForCleanup(
      element,
      () => removeInjection(injectionId),
      config.platform,
      injectionId
    );
    
    // Update final status
    updateInjectionStatus(injectionId, {
      state: 'active',
      element,
      performanceMetrics: metrics as PerformanceMetrics,
      observerId,
    });
    
    // Check performance alerts
    if (config.performanceMonitoring && metrics.totalTime > PERFORMANCE_ALERT_THRESHOLD) {
      eventListeners.onPerformanceAlert?.(metrics as PerformanceMetrics, PERFORMANCE_ALERT_THRESHOLD);
    }
    
    // Notify success
    eventListeners.onInjectionSuccess?.(injectionId, element);
    
    return {
      success: true,
      injectionId,
      element,
      performanceMetrics: metrics as PerformanceMetrics,
    };
  }
  
  /**
   * Updates injection status
   */
  function updateInjectionStatus(
    injectionId: string,
    updates: Partial<Omit<InjectionStatus, 'id' | 'createdAt'>>
  ): void {
    const current = injectionRegistry.get(injectionId);
    if (current) {
      const updated = {
        ...current,
        ...updates,
        lastUpdated: Date.now(),
      };
      injectionRegistry.set(injectionId, updated);
    }
  }
  
  /**
   * Waits for DOM to be ready
   */
  async function waitForDOMReady(): Promise<void> {
    if (document.readyState === 'complete') {
      return;
    }
    
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Sets up navigation monitoring
   */
  function setupNavigationMonitoring(): void {
    // Monitor URL changes for SPAs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };
    
    window.addEventListener('popstate', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    
    function handleNavigation(): void {
      if (navigationTimeout !== null) {
        clearTimeout(navigationTimeout);
      }
      
      navigationTimeout = window.setTimeout(() => {
        const oldUrl = currentUrl;
        const newUrl = window.location.href;
        
        if (oldUrl !== newUrl) {
          const oldPlatform = currentPlatform;
          const detectionResult = platformDetection?.detectPlatform() ?? { platform: null };
          currentPlatform = detectionResult.platform;
          currentUrl = newUrl;
          
          // Clean up injections if platform changed
          if (oldPlatform !== currentPlatform && oldPlatform) {
            removePlatformInjections(oldPlatform);
          }
          
          // Notify navigation change
          eventListeners.onNavigationChange?.({
            oldUrl,
            newUrl,
            platform: currentPlatform,
            timestamp: Date.now(),
          });
        }
      }, NAVIGATION_DEBOUNCE);
    }
  }
  
  /**
   * Starts the cleanup timer
   */
  function startCleanupTimer(): void {
    cleanupTimer = window.setInterval(() => {
      forceCleanup();
    }, CLEANUP_CHECK_INTERVAL);
  }
}