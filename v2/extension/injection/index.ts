/**
 * Platform Injection System - Main Exports
 *
 * Centralized exports for platform detection, configuration, and injection utilities.
 * Provides a clean interface for consuming the injection system throughout the extension.
 */

// Type definitions and interfaces
export type {
  Platform,
  PlatformDetectionResult,
  DetectionConfidence,
  URLPattern,
  DetectionOptions,
  NavigationChangeEvent,
  NavigationEvent,
  PageType,
  PlatformDetectionError,
  PlatformConfig,
  PlatformSelectors,
  PlatformFeatures,
  InjectionTiming,
  PlatformStyling,
  ErrorRecoveryConfig,
  SelectorConfig,
  SiteType,
} from './types.js';

// DOM utilities types
export type {
  DOMElementConfig,
  DOMCreationResult,
  PositioningConfig,
  PositioningResult,
  SelectorValidationResult,
  CleanupTracker,
  CollisionDetectionResult,
} from './domUtils.js';

// Mutation observer types
export type {
  MutationObserverConfig,
  MutationCallback,
  MutationObservationResult,
  ObserverStats,
} from './mutationObserver.js';

// Injection manager types
export type {
  InjectionState,
  InjectionConfig,
  InjectionResult,
  PerformanceMetrics,
  InjectionStatus,
  NavigationChangeEvent as InjectionNavigationChangeEvent,
  GlobalInjectionStats,
  InjectionEventListeners,
} from './injectionManager.js';

// Platform detection service
export {
  PlatformDetectionService,
  PlatformDetection,
} from './platformDetection.js';

// Platform configuration management
export {
  PlatformConfigManager,
  PlatformConfigUtils,
  TWITTER_CONFIG,
  LINKEDIN_CONFIG,
  REDDIT_CONFIG,
  PLATFORM_CONFIGS,
} from './platformConfig.js';

// DOM manipulation utilities
export { DOMUtils } from './domUtils.js';

// Mutation observer management
export { MutationObserverManager } from './mutationObserver.js';

// Central injection management
export { InjectionManager } from './injectionManager.js';

// Platform-specific injection engines
export {
  injectTwitterKeyboard,
  shutdownTwitterInjection,
  TwitterSelectorValidator,
  TwitterDOM,
  PLATFORM_INJECTORS,
  type PlatformInjectorKey,
  type TwitterPositionStrategy,
  type TwitterTheme,
  type TwitterComposeContext,
  type TwitterPositionResult,
} from './platforms/index.js';

// Text area management and content insertion (Task D1)
export {
  TextAreaManager,
  textAreaManager,
  type TextAreaType,
  type TextAreaState,
  type TextAreaCapabilities,
  type TextAreaDetectionConfig,
  type TextAreaDetectionResult,
  type TextAreaEventType,
  type TextAreaEventListener,
  type TextAreaValidationResult,
} from './textAreaManager.js';

export {
  ContentInsertionService,
  contentInsertionService,
  PLATFORM_CHARACTER_LIMITS,
  DEFAULT_INSERTION_OPTIONS,
  type ContentInsertionMode,
  type ContentFormat,
  type ContentInsertionOptions,
  type ContentInsertionResult,
  type ContentFormattingConfig,
  type ContentSanitizationRules,
} from './contentInsertion.js';

export {
  CursorManager,
  cursorManager,
  DEFAULT_RESTORATION_OPTIONS,
  type CursorPosition,
  type EnhancedCursorPosition,
  type CursorMovementDirection,
  type SelectionOperation,
  type CursorRestorationOptions,
  type SelectionRange,
  type WordBoundary,
  type LineInfo,
  type CursorOperationResult,
} from './cursorManagement.js';

// Utility functions and type guards
export {
  isPlatform,
  isPageType,
  isDetectionConfidence,
  siteTypeToPlatform,
  platformToSiteType,
  createPlatformDetectionError,
  isValidURLPattern,
  PlatformConstants,
} from './types.js';

// Direct imports for internal use
import { PlatformDetectionService } from './platformDetection.js';
import {
  InjectionManager,
  type InjectionEventListeners,
} from './injectionManager.js';
import type { DetectionOptions } from './types.js';

// Version and constants
export const INJECTION_SYSTEM_VERSION = '2.1.0' as const;

export const SUPPORTED_PLATFORMS = ['twitter', 'linkedin', 'reddit'] as const;

/**
 * Initialize the complete injection system with all components
 */
export const initializeInjectionSystem = (
  options?: Partial<DetectionOptions>,
  injectionListeners?: InjectionEventListeners
): {
  readonly platformDetection: PlatformDetectionService;
  readonly injectionManager: boolean;
} => {
  // Initialize platform detection
  const platformDetection = PlatformDetectionService.getInstance(options);
  platformDetection.initialize();

  // Initialize injection manager
  const injectionManager = InjectionManager.initialize(injectionListeners);

  return {
    platformDetection,
    injectionManager,
  };
};

/**
 * Shutdown the complete injection system
 */
export const shutdownInjectionSystem = (): void => {
  InjectionManager.shutdown();
};
