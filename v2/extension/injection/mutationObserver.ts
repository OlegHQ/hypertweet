/**
 * Mutation Observer Management System
 * 
 * Provides centralized MutationObserver management with debouncing, platform-specific strategies,
 * and memory leak prevention for the injection system.
 */

import { createPlatformDetectionError, type Platform, type PlatformDetectionError } from './types.js';

/**
 * Configuration for mutation observation
 */
export interface MutationObserverConfig {
  readonly platform: Platform;
  readonly target: Element | Document;
  readonly options: MutationObserverInit;
  readonly debounceMs?: number;
  readonly maxBatchSize?: number;
  readonly priority?: 'low' | 'medium' | 'high';
  readonly selector?: string;
  readonly ignoreSelectors?: readonly string[];
}

/**
 * Mutation observation callback function
 */
export type MutationCallback = (
  mutations: readonly MutationRecord[],
  observer: MutationObserver
) => void;

/**
 * Mutation observation result
 */
export interface MutationObservationResult {
  readonly success: boolean;
  readonly observerId: string;
  readonly error?: PlatformDetectionError;
  readonly observer?: MutationObserver;
}

/**
 * Observer statistics
 */
export interface ObserverStats {
  readonly id: string;
  readonly platform: Platform;
  readonly isActive: boolean;
  readonly startTime: number;
  readonly mutationCount: number;
  readonly lastMutationTime: number | null;
  readonly debounceMs: number;
  readonly target: string;
}

/**
 * Debounced mutation batch
 */
interface MutationBatch {
  readonly mutations: MutationRecord[];
  readonly timeoutId: number;
  readonly priority: 'low' | 'medium' | 'high';
}

/**
 * Observer registry entry
 */
interface ObserverEntry {
  readonly id: string;
  readonly platform: Platform;
  readonly observer: MutationObserver;
  readonly callback: MutationCallback;
  readonly config: MutationObserverConfig;
  readonly startTime: number;
  mutationCount: number;
  lastMutationTime: number | null;
  isActive: boolean;
  pendingBatch?: MutationBatch;
}

/**
 * Platform-specific observation strategies
 */
interface PlatformStrategy {
  readonly defaultOptions: MutationObserverInit;
  readonly debounceMs: number;
  readonly maxBatchSize: number;
  readonly criticalSelectors: readonly string[];
  readonly ignoreSelectors: readonly string[];
}

/**
 * Mutation Observer Management System
 */
export namespace MutationObserverManager {
  
  // Constants
  const DEFAULT_DEBOUNCE_MS = 100;
  const DEFAULT_MAX_BATCH_SIZE = 50;
  const MAX_OBSERVERS_PER_PLATFORM = 10;
  const CLEANUP_INTERVAL_MS = 300000; // 5 minutes
  
  // Observer registry
  const observerRegistry = new Map<string, ObserverEntry>();
  
  // Global observer counter for unique IDs
  let observerIdCounter = 0;
  
  // Platform-specific strategies
  const platformStrategies: Record<Platform, PlatformStrategy> = {
    twitter: {
      defaultOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-testid', 'class', 'aria-expanded'],
      },
      debounceMs: 150,
      maxBatchSize: 30,
      criticalSelectors: [
        '[data-testid="tweetTextarea_0"]',
        '[data-testid="tweet"]',
        '[role="main"]',
      ],
      ignoreSelectors: [
        '[data-testid="UserAvatar-Container-unknown"]',
        '.r-1p0dtai', // Twitter loading spinner classes
        '[aria-label*="Loading"]',
      ],
    },
    
    linkedin: {
      defaultOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-test-ql-editor-contenteditable'],
      },
      debounceMs: 200,
      maxBatchSize: 25,
      criticalSelectors: [
        'div[data-test-ql-editor-contenteditable="true"]',
        '[role="article"]',
        '.update-components-text',
      ],
      ignoreSelectors: [
        '.loading-shimmer',
        '[data-ad-rendering-role]',
        '.artdeco-loader',
      ],
    },
    
    reddit: {
      defaultOptions: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'role', 'contenteditable'],
      },
      debounceMs: 100,
      maxBatchSize: 40,
      criticalSelectors: [
        'shreddit-composer',
        'div[contenteditable="true"][role="textbox"]',
        'shreddit-comment',
      ],
      ignoreSelectors: [
        '[data-loading="true"]',
        '.loading-placeholder',
        'faceplate-tracker',
      ],
    },
  };
  
  // Cleanup timer
  let cleanupTimer: number | null = null;
  
  /**
   * Starts mutation observation with platform-specific optimizations
   */
  export function startObserving(
    config: MutationObserverConfig,
    callback: MutationCallback
  ): MutationObservationResult {
    try {
      // Validate configuration
      const validationError = validateConfig(config);
      if (validationError) {
        return {
          success: false,
          observerId: '',
          error: validationError,
        };
      }
      
      // Check observer limits
      const platformObservers = Array.from(observerRegistry.values())
        .filter(entry => entry.platform === config.platform && entry.isActive);
      
      if (platformObservers.length >= MAX_OBSERVERS_PER_PLATFORM) {
        return {
          success: false,
          observerId: '',
          error: createPlatformDetectionError(
            'OBSERVER_LIMIT_EXCEEDED',
            `Maximum observers for platform ${config.platform} exceeded`,
            { platform: config.platform, maxObservers: MAX_OBSERVERS_PER_PLATFORM }
          ),
        };
      }
      
      // Generate unique observer ID
      const observerId = `${config.platform}-observer-${++observerIdCounter}`;
      
      // Get platform strategy
      const strategy = platformStrategies[config.platform];
      
      // Merge configuration with platform defaults
      const finalOptions = {
        ...strategy.defaultOptions,
        ...config.options,
      };
      
      const debounceMs = config.debounceMs ?? strategy.debounceMs;
      const maxBatchSize = config.maxBatchSize ?? strategy.maxBatchSize;
      
      // Create debounced callback
      const debouncedCallback = createDebouncedCallback(
        callback,
        debounceMs,
        maxBatchSize,
        config.priority ?? 'medium',
        observerId
      );
      
      // Create MutationObserver
      const observer = new MutationObserver((mutations, obs) => {
        // Filter mutations based on configuration
        const filteredMutations = filterMutations(mutations, config, strategy);
        
        if (filteredMutations.length > 0) {
          debouncedCallback(filteredMutations, obs);
          
          // Update statistics
          const entry = observerRegistry.get(observerId);
          if (entry) {
            entry.mutationCount += filteredMutations.length;
            entry.lastMutationTime = Date.now();
          }
        }
      });
      
      // Start observing
      observer.observe(config.target, finalOptions);
      
      // Register observer
      const entry: ObserverEntry = {
        id: observerId,
        platform: config.platform,
        observer,
        callback: debouncedCallback,
        config,
        startTime: Date.now(),
        mutationCount: 0,
        lastMutationTime: null,
        isActive: true,
      };
      
      observerRegistry.set(observerId, entry);
      
      // Start cleanup timer if not already running
      if (cleanupTimer === null) {
        startCleanupTimer();
      }
      
      return {
        success: true,
        observerId,
        observer,
      };
      
    } catch (error) {
      return {
        success: false,
        observerId: '',
        error: createPlatformDetectionError(
          'OBSERVER_CREATION_FAILED',
          `Failed to create observer: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { config }
        ),
      };
    }
  }
  
  /**
   * Stops mutation observation for a specific observer
   */
  export function stopObserving(observerId: string): boolean {
    const entry = observerRegistry.get(observerId);
    if (!entry) {
      return false;
    }
    
    try {
      // Clear pending batch
      if (entry.pendingBatch) {
        clearTimeout(entry.pendingBatch.timeoutId);
      }
      
      // Disconnect observer
      entry.observer.disconnect();
      entry.isActive = false;
      
      // Remove from registry
      observerRegistry.delete(observerId);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to stop observer ${observerId}:`, error);
      return false;
    }
  }
  
  /**
   * Stops all observers for a specific platform
   */
  export function stopPlatformObservers(platform: Platform): number {
    let stoppedCount = 0;
    
    for (const [observerId, entry] of observerRegistry.entries()) {
      if (entry.platform === platform && entry.isActive) {
        if (stopObserving(observerId)) {
          stoppedCount++;
        }
      }
    }
    
    return stoppedCount;
  }
  
  /**
   * Stops all active observers
   */
  export function stopAllObservers(): number {
    let stoppedCount = 0;
    
    for (const observerId of observerRegistry.keys()) {
      if (stopObserving(observerId)) {
        stoppedCount++;
      }
    }
    
    // Clear cleanup timer
    if (cleanupTimer !== null) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    
    return stoppedCount;
  }
  
  /**
   * Gets statistics for all observers
   */
  export function getObserverStats(): readonly ObserverStats[] {
    return Array.from(observerRegistry.values()).map(entry => ({
      id: entry.id,
      platform: entry.platform,
      isActive: entry.isActive,
      startTime: entry.startTime,
      mutationCount: entry.mutationCount,
      lastMutationTime: entry.lastMutationTime,
      debounceMs: entry.config.debounceMs ?? platformStrategies[entry.platform].debounceMs,
      target: getTargetDescription(entry.config.target),
    }));
  }
  
  /**
   * Gets statistics for a specific platform
   */
  export function getPlatformStats(platform: Platform): {
    readonly activeObservers: number;
    readonly totalMutations: number;
    readonly averageDebounceMs: number;
    readonly oldestObserver: number | null;
  } {
    const platformEntries = Array.from(observerRegistry.values())
      .filter(entry => entry.platform === platform && entry.isActive);
    
    if (platformEntries.length === 0) {
      return {
        activeObservers: 0,
        totalMutations: 0,
        averageDebounceMs: 0,
        oldestObserver: null,
      };
    }
    
    const totalMutations = platformEntries.reduce((sum, entry) => sum + entry.mutationCount, 0);
    const totalDebounceMs = platformEntries.reduce((sum, entry) => {
      const debounceMs = entry.config.debounceMs ?? platformStrategies[platform].debounceMs;
      return sum + debounceMs;
    }, 0);
    const oldestObserver = Math.min(...platformEntries.map(entry => entry.startTime));
    
    return {
      activeObservers: platformEntries.length,
      totalMutations,
      averageDebounceMs: totalDebounceMs / platformEntries.length,
      oldestObserver,
    };
  }
  
  /**
   * Updates the priority of an existing observer
   */
  export function updateObserverPriority(
    observerId: string,
    priority: 'low' | 'medium' | 'high'
  ): boolean {
    const entry = observerRegistry.get(observerId);
    if (!entry?.isActive) {
      return false;
    }
    
    // Update the priority in the config
    const newConfig = {
      ...entry.config,
      priority,
    };
    
    // Update the entry
    observerRegistry.set(observerId, {
      ...entry,
      config: newConfig,
    });
    
    return true;
  }
  
  /**
   * Validates observer configuration
   */
  function validateConfig(config: MutationObserverConfig): PlatformDetectionError | null {
    if (!config.target) {
      return createPlatformDetectionError(
        'INVALID_CONFIG',
        'Observer target is required',
        { config }
      );
    }
    
    if (!config.platform || !['twitter', 'linkedin', 'reddit'].includes(config.platform)) {
      return createPlatformDetectionError(
        'INVALID_CONFIG',
        'Valid platform is required',
        { config }
      );
    }
    
    if (config.debounceMs !== undefined && config.debounceMs < 0) {
      return createPlatformDetectionError(
        'INVALID_CONFIG',
        'Debounce time must be non-negative',
        { config }
      );
    }
    
    if (config.maxBatchSize !== undefined && config.maxBatchSize <= 0) {
      return createPlatformDetectionError(
        'INVALID_CONFIG',
        'Max batch size must be positive',
        { config }
      );
    }
    
    return null;
  }
  
  /**
   * Filters mutations based on configuration and platform strategy
   */
  function filterMutations(
    mutations: readonly MutationRecord[],
    config: MutationObserverConfig,
    strategy: PlatformStrategy
  ): MutationRecord[] {
    const filtered: MutationRecord[] = [];
    
    for (const mutation of mutations) {
      // Skip mutations that should be ignored
      if (shouldIgnoreMutation(mutation, config, strategy)) {
        continue;
      }
      
      // Include mutations that match criteria
      if (shouldIncludeMutation(mutation, config, strategy)) {
        filtered.push(mutation);
      }
    }
    
    return filtered;
  }
  
  /**
   * Determines if a mutation should be ignored
   */
  function shouldIgnoreMutation(
    mutation: MutationRecord,
    config: MutationObserverConfig,
    strategy: PlatformStrategy
  ): boolean {
    const target = mutation.target as Element;
    
    // Check config ignore selectors
    if (config.ignoreSelectors) {
      for (const selector of config.ignoreSelectors) {
        if (target.matches?.(selector) || target.closest?.(selector)) {
          return true;
        }
      }
    }
    
    // Check platform ignore selectors
    for (const selector of strategy.ignoreSelectors) {
      if (target.matches?.(selector) || target.closest?.(selector)) {
        return true;
      }
    }
    
    // Ignore mutations on our own injection elements
    if (target.hasAttribute?.('data-hypertweet-injection')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Determines if a mutation should be included
   */
  function shouldIncludeMutation(
    mutation: MutationRecord,
    config: MutationObserverConfig,
    strategy: PlatformStrategy
  ): boolean {
    const target = mutation.target as Element;
    
    // If specific selector is configured, check it
    if (config.selector) {
      return target.matches?.(config.selector) ?? target.closest?.(config.selector) ?? false;
    }
    
    // Check against platform critical selectors
    for (const selector of strategy.criticalSelectors) {
      if (target.matches?.(selector) || target.closest?.(selector)) {
        return true;
      }
    }
    
    // Include by default if no specific criteria
    return true;
  }
  
  /**
   * Creates a debounced callback function
   */
  function createDebouncedCallback(
    callback: MutationCallback,
    debounceMs: number,
    maxBatchSize: number,
    priority: 'low' | 'medium' | 'high',
    observerId: string
  ): MutationCallback {
    let pendingMutations: MutationRecord[] = [];
    let timeoutId: number | null = null;
    
    return (mutations: readonly MutationRecord[], observer: MutationObserver): void => {
      // Add mutations to pending batch
      pendingMutations.push(...mutations);
      
      // Clear existing timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      
      // Determine timeout based on priority and batch size
      let timeout = debounceMs;
      if (priority === 'high') {
        timeout = Math.min(debounceMs, 50);
      } else if (priority === 'low') {
        timeout = Math.max(debounceMs, 200);
      }
      
      // If batch is full, process immediately
      if (pendingMutations.length >= maxBatchSize) {
        processBatch();
        return;
      }
      
      // Schedule batch processing
      timeoutId = window.setTimeout(() => {
        processBatch();
      }, timeout);
      
      function processBatch(): void {
        if (pendingMutations.length === 0) {
          return;
        }
        
        const batch = [...pendingMutations];
        pendingMutations = [];
        timeoutId = null;
        
        try {
          callback(batch, observer);
        } catch (error) {
          console.error(`Error in observer callback for ${observerId}:`, error);
        }
      }
    };
  }
  
  /**
   * Gets a human-readable description of an observation target
   */
  function getTargetDescription(target: Element | Document): string {
    if (target === document) {
      return 'document';
    }
    
    const element = target as Element;
    let description = element.tagName.toLowerCase();
    
    if (element.id) {
      description += `#${element.id}`;
    }
    
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').slice(0, 2).join('.');
      if (classes) {
        description += `.${classes}`;
      }
    }
    
    return description;
  }
  
  /**
   * Starts the cleanup timer for inactive observers
   */
  function startCleanupTimer(): void {
    cleanupTimer = window.setInterval(() => {
      const now = Date.now();
      const cutoffTime = now - CLEANUP_INTERVAL_MS;
      
      const toRemove: string[] = [];
      
      for (const [observerId, entry] of observerRegistry.entries()) {
        // Remove observers that haven't seen mutations recently
        if (entry.lastMutationTime && entry.lastMutationTime < cutoffTime) {
          toRemove.push(observerId);
        }
        // Remove very old observers even if they're still active
        else if (entry.startTime < cutoffTime - (CLEANUP_INTERVAL_MS * 2)) {
          toRemove.push(observerId);
        }
      }
      
      toRemove.forEach(observerId => {
        stopObserving(observerId);
      });
      
      // Stop cleanup timer if no observers remain
      if (observerRegistry.size === 0 && cleanupTimer !== null) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
      }
    }, CLEANUP_INTERVAL_MS);
  }
}