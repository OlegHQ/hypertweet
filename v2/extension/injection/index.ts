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
import type { DetectionOptions } from './types.js';

// Version and constants
export const INJECTION_SYSTEM_VERSION = '1.0.0' as const;

export const SUPPORTED_PLATFORMS = ['twitter', 'linkedin', 'reddit'] as const;

/**
 * Initialize the complete injection system
 */
export const initializeInjectionSystem = (
  options?: Partial<DetectionOptions>
): PlatformDetectionService => {
  const service = PlatformDetectionService.getInstance(options);
  service.initialize();
  return service;
};
