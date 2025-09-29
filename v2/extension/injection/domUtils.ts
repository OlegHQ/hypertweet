/**
 * DOM Manipulation Utilities
 *
 * Provides safe DOM manipulation utilities for the injection system.
 * Includes element creation, positioning, validation, cleanup, and collision detection.
 */

import {
  createPlatformDetectionError,
  type Platform,
  type PlatformDetectionError,
} from './types.js';

/**
 * Configuration for DOM element creation
 */
export interface DOMElementConfig {
  readonly tag: string;
  readonly className?: string;
  readonly id?: string;
  readonly attributes?: Record<string, string>;
  readonly styles?: Record<string, string>;
  readonly textContent?: string;
  readonly innerHTML?: string;
  readonly ariaLabel?: string;
  readonly role?: string;
}

/**
 * Result of DOM element creation
 */
export interface DOMCreationResult {
  readonly element: HTMLElement;
  readonly success: boolean;
  readonly error?: PlatformDetectionError;
}

/**
 * Configuration for element positioning
 */
export interface PositioningConfig {
  readonly strategy: 'before' | 'after' | 'inside' | 'replace';
  readonly position?: 'start' | 'end';
  readonly offset?: { readonly x: number; readonly y: number };
  readonly zIndex?: number;
  readonly respectBoundaries?: boolean;
}

/**
 * Result of element positioning operation
 */
export interface PositioningResult {
  readonly success: boolean;
  readonly finalPosition?: DOMRect;
  readonly error?: PlatformDetectionError;
  readonly adjustments?: {
    readonly originalStrategy: PositioningConfig['strategy'];
    readonly appliedStrategy: PositioningConfig['strategy'];
    readonly reason: string;
  };
}

/**
 * CSS selector validation result
 */
export interface SelectorValidationResult {
  readonly isValid: boolean;
  readonly element: Element | null;
  readonly fallbackUsed?: string;
  readonly error?: PlatformDetectionError;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly validationTime: number;
}

/**
 * Cleanup tracking interface
 */
export interface CleanupTracker {
  readonly element: HTMLElement;
  readonly cleanup: () => void;
  readonly timestamp: number;
  readonly platform: Platform;
  readonly injectionId: string;
}

/**
 * Collision detection result
 */
export interface CollisionDetectionResult {
  readonly hasCollision: boolean;
  readonly conflictingElements: readonly HTMLElement[];
  readonly recommendedAction: 'skip' | 'replace' | 'offset' | 'merge';
  readonly details: {
    readonly overlapPercentage: number;
    readonly spatialConflicts: readonly string[];
    readonly functionalConflicts: readonly string[];
  };
}

/**
 * DOM manipulation utilities namespace
 */
export namespace DOMUtils {
  // Constants for collision detection
  const COLLISION_TOLERANCE = 0.1; // 10% overlap tolerance
  const INJECTION_PREFIX = 'hypertweet-injection';
  const MAX_SELECTOR_VALIDATION_TIME = 100; // milliseconds

  // Global cleanup tracker
  const cleanupTrackers = new Map<string, CleanupTracker>();

  /**
   * Safely creates a DOM element with specified configuration
   */
  export function createElement(config: DOMElementConfig): DOMCreationResult {
    try {
      const element = document.createElement(config.tag);

      // Apply basic properties
      if (config.className) {
        element.className = config.className;
      }

      if (config.id) {
        element.id = config.id;
      }

      // Apply attributes
      if (config.attributes) {
        Object.entries(config.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      // Apply styles
      if (config.styles) {
        Object.entries(config.styles).forEach(([property, value]) => {
          element.style.setProperty(property, value);
        });
      }

      // Apply content
      if (config.textContent) {
        element.textContent = config.textContent;
      } else if (config.innerHTML) {
        element.innerHTML = config.innerHTML;
      }

      // Apply accessibility attributes
      if (config.ariaLabel) {
        element.setAttribute('aria-label', config.ariaLabel);
      }

      if (config.role) {
        element.setAttribute('role', config.role);
      }

      // Mark as injection element for identification
      element.setAttribute('data-hypertweet-injection', 'true');
      element.setAttribute('data-injection-timestamp', Date.now().toString());

      return {
        element,
        success: true,
      };
    } catch (error) {
      return {
        element: document.createElement('div'), // Fallback element
        success: false,
        error: createPlatformDetectionError(
          'DOM_CREATION_FAILED',
          `Failed to create element: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { config }
        ),
      };
    }
  }

  /**
   * Validates CSS selectors with fallback strategies
   */
  export function validateSelector(
    selector: string,
    fallbacks: readonly string[] = [],
    container: Document | Element = document
  ): SelectorValidationResult {
    const startTime = performance.now();

    try {
      // Validate primary selector
      const element = container.querySelector(selector);
      if (element) {
        return {
          isValid: true,
          element,
          confidence: 'high',
          validationTime: performance.now() - startTime,
        };
      }

      // Try fallback selectors
      for (const fallback of fallbacks) {
        try {
          const fallbackElement = container.querySelector(fallback);
          if (fallbackElement) {
            return {
              isValid: true,
              element: fallbackElement,
              fallbackUsed: fallback,
              confidence: 'medium',
              validationTime: performance.now() - startTime,
            };
          }
        } catch (fallbackError) {
          // Continue to next fallback
          continue;
        }
      }

      // No valid selector found
      return {
        isValid: false,
        element: null,
        confidence: 'low',
        validationTime: performance.now() - startTime,
        error: createPlatformDetectionError(
          'SELECTOR_NOT_FOUND',
          `Selector not found: ${selector}`,
          { selector, fallbacks: Array.from(fallbacks) }
        ),
      };
    } catch (error) {
      return {
        isValid: false,
        element: null,
        confidence: 'low',
        validationTime: performance.now() - startTime,
        error: createPlatformDetectionError(
          'SELECTOR_VALIDATION_FAILED',
          `Selector validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { selector, fallbacks: Array.from(fallbacks) }
        ),
      };
    }
  }

  /**
   * Positions an element relative to a target with collision avoidance
   */
  export function positionElement(
    element: HTMLElement,
    target: HTMLElement,
    config: PositioningConfig
  ): PositioningResult {
    try {
      const targetRect = target.getBoundingClientRect();
      const strategy = config.strategy;

      // Apply positioning strategy
      switch (strategy) {
        case 'before':
          target.parentNode?.insertBefore(element, target);
          break;

        case 'after':
          if (target.nextSibling) {
            target.parentNode?.insertBefore(element, target.nextSibling);
          } else {
            target.parentNode?.appendChild(element);
          }
          break;

        case 'inside':
          if (config.position === 'start') {
            target.insertBefore(element, target.firstChild);
          } else {
            target.appendChild(element);
          }
          break;

        case 'replace':
          target.parentNode?.replaceChild(element, target);
          break;
      }

      // Apply additional positioning
      if (config.offset) {
        element.style.position = 'relative';
        element.style.left = `${config.offset.x}px`;
        element.style.top = `${config.offset.y}px`;
      }

      if (config.zIndex !== undefined) {
        element.style.zIndex = config.zIndex.toString();
      }

      // Check final position
      const finalRect = element.getBoundingClientRect();

      // Boundary checks
      if (config.respectBoundaries) {
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        if (
          finalRect.right > viewport.width ||
          finalRect.bottom > viewport.height
        ) {
          // Adjust position if out of bounds
          if (finalRect.right > viewport.width) {
            element.style.left = `${viewport.width - finalRect.width - 10}px`;
          }
          if (finalRect.bottom > viewport.height) {
            element.style.top = `${viewport.height - finalRect.height - 10}px`;
          }
        }
      }

      return {
        success: true,
        finalPosition: element.getBoundingClientRect(),
      };
    } catch (error) {
      return {
        success: false,
        error: createPlatformDetectionError(
          'POSITIONING_FAILED',
          `Element positioning failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            strategy: config.strategy,
            targetRect: target.getBoundingClientRect(),
          }
        ),
      };
    }
  }

  /**
   * Detects collisions with existing injections
   */
  export function detectCollisions(
    element: HTMLElement
  ): CollisionDetectionResult {
    const elementRect = element.getBoundingClientRect();
    const existingInjections = Array.from(
      document.querySelectorAll('[data-hypertweet-injection="true"]')
    );

    const conflictingElements: HTMLElement[] = [];
    const spatialConflicts: string[] = [];
    const functionalConflicts: string[] = [];
    let maxOverlap = 0;

    for (const existing of existingInjections) {
      if (existing === element) continue;

      const existingRect = existing.getBoundingClientRect();
      const overlap = calculateOverlap(elementRect, existingRect);

      if (overlap > COLLISION_TOLERANCE) {
        conflictingElements.push(existing as HTMLElement);
        spatialConflicts.push(
          `Overlap with ${existing.id || existing.className}: ${(overlap * 100).toFixed(1)}%`
        );
        maxOverlap = Math.max(maxOverlap, overlap);
      }

      // Check functional conflicts (same target elements)
      const elementTarget = element.getAttribute('data-target-selector');
      const existingTarget = existing.getAttribute('data-target-selector');
      if (elementTarget && existingTarget && elementTarget === existingTarget) {
        functionalConflicts.push(`Same target selector: ${elementTarget}`);
      }
    }

    // Determine recommended action
    let recommendedAction: CollisionDetectionResult['recommendedAction'] =
      'skip';
    if (maxOverlap > 0.8) {
      recommendedAction = 'replace';
    } else if (maxOverlap > 0.3) {
      recommendedAction = 'offset';
    } else if (functionalConflicts.length > 0) {
      recommendedAction = 'merge';
    }

    return {
      hasCollision:
        conflictingElements.length > 0 || functionalConflicts.length > 0,
      conflictingElements,
      recommendedAction,
      details: {
        overlapPercentage: maxOverlap,
        spatialConflicts,
        functionalConflicts,
      },
    };
  }

  /**
   * Registers an element for cleanup tracking
   */
  export function registerForCleanup(
    element: HTMLElement,
    cleanup: () => void,
    platform: Platform,
    injectionId: string
  ): void {
    const tracker: CleanupTracker = {
      element,
      cleanup,
      timestamp: Date.now(),
      platform,
      injectionId,
    };

    cleanupTrackers.set(injectionId, tracker);

    // Add cleanup trigger when element is removed from DOM
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of Array.from(mutation.removedNodes)) {
            if (node === element) {
              performCleanup(injectionId);
              observer.disconnect();
              break;
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Performs cleanup for a specific injection
   */
  export function performCleanup(injectionId: string): boolean {
    const tracker = cleanupTrackers.get(injectionId);
    if (!tracker) {
      return false;
    }

    try {
      tracker.cleanup();
      cleanupTrackers.delete(injectionId);
      return true;
    } catch (error) {
      console.error(`Cleanup failed for injection ${injectionId}:`, error);
      return false;
    }
  }

  /**
   * Cleans up all injections for a specific platform
   */
  export function cleanupPlatform(platform: Platform): number {
    let cleanedCount = 0;

    for (const [injectionId, tracker] of cleanupTrackers.entries()) {
      if (tracker.platform === platform) {
        if (performCleanup(injectionId)) {
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }

  /**
   * Cleans up all injections
   */
  export function cleanupAll(): number {
    let cleanedCount = 0;

    for (const injectionId of cleanupTrackers.keys()) {
      if (performCleanup(injectionId)) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Gets statistics about current injections
   */
  export function getInjectionStats(): {
    readonly total: number;
    readonly byPlatform: Record<Platform, number>;
    readonly oldestTimestamp: number | null;
    readonly newestTimestamp: number | null;
  } {
    const byPlatform: Record<Platform, number> = {
      twitter: 0,
      linkedin: 0,
      reddit: 0,
    };

    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    for (const tracker of cleanupTrackers.values()) {
      byPlatform[tracker.platform]++;

      if (oldestTimestamp === null || tracker.timestamp < oldestTimestamp) {
        oldestTimestamp = tracker.timestamp;
      }

      if (newestTimestamp === null || tracker.timestamp > newestTimestamp) {
        newestTimestamp = tracker.timestamp;
      }
    }

    return {
      total: cleanupTrackers.size,
      byPlatform,
      oldestTimestamp,
      newestTimestamp,
    };
  }

  /**
   * Validates if an element is safe to modify
   */
  export function isElementSafeToModify(element: Element): boolean {
    // Check if element is part of critical browser UI
    const criticalSelectors = [
      'input[type="password"]',
      '[role="alert"]',
      '[aria-live]',
      '.chrome-extension-banner',
      '[data-browser-ui]',
    ];

    for (const selector of criticalSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        return false;
      }
    }

    // Check if element is already an injection
    if (element.hasAttribute('data-hypertweet-injection')) {
      return false;
    }

    // Check if element is in an iframe
    if (element.ownerDocument !== document) {
      return false;
    }

    return true;
  }

  /**
   * Safely removes an element from the DOM
   */
  export function safeRemoveElement(element: HTMLElement): boolean {
    try {
      if (!isElementSafeToModify(element)) {
        return false;
      }

      // Trigger cleanup if registered
      const injectionId = element.getAttribute('data-injection-id');
      if (injectionId) {
        performCleanup(injectionId);
      }

      // Remove from DOM
      element.remove();
      return true;
    } catch (error) {
      console.error('Failed to safely remove element:', error);
      return false;
    }
  }

  /**
   * Checks if an element is visible in the viewport
   */
  export function isElementVisible(element: HTMLElement): boolean {
    try {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);

      // Check if element has dimensions
      if (rect.width === 0 || rect.height === 0) {
        return false;
      }

      // Check if element is hidden by CSS
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false;
      }

      // Check if element is in viewport
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth;

      return (
        rect.top < viewportHeight &&
        rect.bottom > 0 &&
        rect.left < viewportWidth &&
        rect.right > 0
      );
    } catch (error) {
      console.warn('Failed to check element visibility:', error);
      return false;
    }
  }

  // Helper function to calculate overlap percentage between two rectangles
  function calculateOverlap(rect1: DOMRect, rect2: DOMRect): number {
    const left = Math.max(rect1.left, rect2.left);
    const right = Math.min(rect1.right, rect2.right);
    const top = Math.max(rect1.top, rect2.top);
    const bottom = Math.min(rect1.bottom, rect2.bottom);

    if (left < right && top < bottom) {
      const overlapArea = (right - left) * (bottom - top);
      const rect1Area = rect1.width * rect1.height;
      const rect2Area = rect2.width * rect2.height;
      const minArea = Math.min(rect1Area, rect2Area);

      return minArea > 0 ? overlapArea / minArea : 0;
    }

    return 0;
  }
}
