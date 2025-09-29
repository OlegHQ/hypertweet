/**
 * Injection Error Handling and Recovery System
 *
 * Provides comprehensive error handling for injection failures with automatic retry,
 * user notifications, fallback strategies, and silent recovery modes.
 */

import { GlobalErrorHandler } from '@/utils/errorHandling';
import {
  createPlatformDetectionError,
  type Platform,
  type PlatformDetectionError,
  type ErrorRecoveryConfig,
} from './types.js';

/**
 * Injection error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Error recovery action types
 */
export type RecoveryAction =
  | 'retry'
  | 'fallback'
  | 'manual'
  | 'disable'
  | 'silent'
  | 'notification';

/**
 * Enhanced injection error with recovery context
 */
export interface InjectionError extends PlatformDetectionError {
  readonly severity: ErrorSeverity;
  readonly retryCount: number;
  readonly recoverable: boolean;
  readonly suggestedAction: RecoveryAction;
  readonly userVisible: boolean;
  readonly silent: boolean;
}

/**
 * Error recovery result
 */
export interface RecoveryResult {
  readonly success: boolean;
  readonly action: RecoveryAction;
  readonly message?: string;
  readonly nextRetryDelay?: number;
  readonly fallbackAvailable: boolean;
}

/**
 * Retry configuration with exponential backoff
 */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly initialDelay: number;
  readonly backoffFactor: number;
  readonly maxDelay: number;
  readonly jitter: boolean;
}

/**
 * User notification configuration
 */
export interface NotificationConfig {
  readonly enabled: boolean;
  readonly autoHide: boolean;
  readonly duration: number;
  readonly position: 'top' | 'bottom' | 'center';
  readonly style: 'toast' | 'banner' | 'modal';
}

/**
 * Error handling statistics
 */
export interface ErrorStats {
  readonly totalErrors: number;
  readonly errorsByType: Record<string, number>;
  readonly errorsByPlatform: Record<Platform, number>;
  readonly recoverySuccessRate: number;
  readonly lastError?: InjectionError;
  readonly errorHistory: readonly InjectionError[];
}

/**
 * Injection Error Handler namespace
 */
export namespace InjectionErrorHandler {
  // Default configurations
  const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    maxDelay: 10000,
    jitter: true,
  };

  const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
    enabled: true,
    autoHide: true,
    duration: 5000,
    position: 'top',
    style: 'toast',
  };

  // Error statistics tracking
  let errorStats: ErrorStats = {
    totalErrors: 0,
    errorsByType: {},
    errorsByPlatform: {} as Record<Platform, number>,
    recoverySuccessRate: 0,
    errorHistory: [],
  };

  // Configuration
  let retryConfig = DEFAULT_RETRY_CONFIG;
  let notificationConfig = DEFAULT_NOTIFICATION_CONFIG;
  let recoveryConfig: ErrorRecoveryConfig = {
    enableRetry: true,
    fallbackToManual: true,
    logErrors: true,
    notifyUser: false,
    gracefulDegradation: true,
  };

  /**
   * Configure error handling behavior
   */
  export function configure(options: {
    readonly retry?: Partial<RetryConfig>;
    readonly notification?: Partial<NotificationConfig>;
    readonly recovery?: Partial<ErrorRecoveryConfig>;
  }): void {
    retryConfig = { ...retryConfig, ...options.retry };
    notificationConfig = { ...notificationConfig, ...options.notification };
    recoveryConfig = { ...recoveryConfig, ...options.recovery };
  }

  /**
   * Get current error statistics
   */
  export function getErrorStats(): Readonly<ErrorStats> {
    return errorStats;
  }

  /**
   * Clear error statistics
   */
  export function clearErrorStats(): void {
    errorStats = {
      totalErrors: 0,
      errorsByType: {},
      errorsByPlatform: {} as Record<Platform, number>,
      recoverySuccessRate: 0,
      errorHistory: [],
    };
  }

  /**
   * Create an enhanced injection error from a platform detection error
   */
  export function createInjectionError(
    error: PlatformDetectionError,
    options: {
      readonly severity?: ErrorSeverity;
      readonly retryCount?: number;
      readonly userVisible?: boolean;
      readonly silent?: boolean;
    } = {}
  ): InjectionError {
    const severity = options.severity ?? classifyErrorSeverity(error);
    const retryCount = options.retryCount ?? 0;
    
    return {
      ...error,
      severity,
      retryCount,
      recoverable: isRecoverable(error, retryCount),
      suggestedAction: getSuggestedAction(error, severity, retryCount),
      userVisible: options.userVisible ?? shouldNotifyUser(error, severity),
      silent: options.silent ?? false,
    };
  }

  /**
   * Handle an injection error with automatic recovery
   */
  export async function handleError(
    error: PlatformDetectionError | InjectionError,
    context: {
      readonly platform: Platform;
      readonly targetSelector?: string;
      readonly retryCount?: number;
    }
  ): Promise<RecoveryResult> {
    // Convert to InjectionError if needed
    const injectionError = 'severity' in error 
      ? error 
      : createInjectionError(error, { retryCount: context.retryCount });

    // Update statistics
    updateErrorStats(injectionError, context.platform);

    // Log error if enabled
    if (recoveryConfig.logErrors) {
      logError(injectionError, context);
    }

    // Notify user if appropriate
    if (injectionError.userVisible && !injectionError.silent && recoveryConfig.notifyUser) {
      await notifyUser(injectionError);
    }

    // Determine recovery action
    const action = determineRecoveryAction(injectionError);
    
    // Execute recovery
    return await executeRecovery(injectionError, action, context);
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  export function calculateRetryDelay(retryCount: number, config = retryConfig): number {
    let delay = config.initialDelay * Math.pow(config.backoffFactor, retryCount);
    delay = Math.min(delay, config.maxDelay);
    
    if (config.jitter) {
      // Add random jitter to prevent thundering herd
      delay *= 0.5 + Math.random() * 0.5;
    }
    
    return Math.round(delay);
  }

  /**
   * Check if an error is recoverable
   */
  export function isRecoverable(
    error: PlatformDetectionError,
    retryCount: number
  ): boolean {
    // Non-recoverable errors
    const nonRecoverableErrors = [
      'UNSUPPORTED_PLATFORM',
      'INVALID_URL',
      'CONFIGURATION_ERROR',
      'INJECTION_LIMIT_EXCEEDED',
    ];

    if (nonRecoverableErrors.includes(error.code)) {
      return false;
    }

    // Too many retries
    if (retryCount >= retryConfig.maxAttempts) {
      return false;
    }

    return true;
  }

  /**
   * Get user-friendly error message
   */
  export function getUserFriendlyMessage(error: InjectionError): string {
    const baseMessages: Record<string, string> = {
      'SELECTOR_NOT_FOUND': 'Unable to find the text input area on this page.',
      'INJECTION_FAILED': 'Failed to add the keyboard to this page.',
      'DOM_CREATION_FAILED': 'Unable to create the keyboard interface.',
      'POSITIONING_FAILED': 'Unable to position the keyboard correctly.',
      'NETWORK_ERROR': 'Network connection issue prevented loading.',
      'DETECTION_TIMEOUT': 'Page took too long to load completely.',
      'COLLISION_DETECTED': 'Another extension is interfering with the keyboard.',
      'OBSERVER_CREATION_FAILED': 'Unable to monitor page changes.',
    };

    const baseMessage = baseMessages[error.code] ?? 'An unexpected error occurred.';

    // Add context based on severity
    switch (error.severity) {
      case 'low':
        return `${baseMessage} The keyboard may still work normally.`;
      case 'medium':
        return `${baseMessage} Some features may be limited.`;
      case 'high':
        return `${baseMessage} Please try refreshing the page.`;
      case 'critical':
        return `${baseMessage} Please report this issue if it persists.`;
      default:
        return baseMessage;
    }
  }

  /**
   * Retry an operation with exponential backoff
   */
  export async function retryOperation<T>(
    operation: () => Promise<T>,
    errorContext: { readonly platform: Platform }
  ): Promise<T> {
    let lastError: Error = new Error('No attempts made');
    
    for (let attempt = 0; attempt < retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't wait after the last attempt
        if (attempt < retryConfig.maxAttempts - 1) {
          const delay = calculateRetryDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Classify error severity based on error type and context
   */
  function classifyErrorSeverity(error: PlatformDetectionError): ErrorSeverity {
    const criticalErrors = [
      'CONFIGURATION_ERROR',
      'INJECTION_LIMIT_EXCEEDED',
    ];

    const highErrors = [
      'DOM_CREATION_FAILED',
      'INJECTION_FAILED',
      'INVALID_CONFIG',
    ];

    const mediumErrors = [
      'SELECTOR_NOT_FOUND',
      'POSITIONING_FAILED',
      'COLLISION_DETECTED',
    ];

    if (criticalErrors.includes(error.code)) return 'critical';
    if (highErrors.includes(error.code)) return 'high';
    if (mediumErrors.includes(error.code)) return 'medium';
    
    return 'low';
  }

  /**
   * Get suggested recovery action for an error
   */
  function getSuggestedAction(
    error: PlatformDetectionError,
    severity: ErrorSeverity,
    retryCount: number
  ): RecoveryAction {
    // If too many retries, suggest fallback or manual
    if (retryCount >= retryConfig.maxAttempts) {
      return recoveryConfig.fallbackToManual ? 'manual' : 'fallback';
    }

    // Critical errors should try fallback immediately
    if (severity === 'critical') {
      return 'fallback';
    }

    // High severity errors should retry with fallback ready
    if (severity === 'high') {
      return retryCount > 1 ? 'fallback' : 'retry';
    }

    // Medium errors should retry
    if (severity === 'medium') {
      return 'retry';
    }

    // Low severity errors can be silent
    return 'silent';
  }

  /**
   * Determine if user should be notified
   */
  function shouldNotifyUser(error: PlatformDetectionError, severity: ErrorSeverity): boolean {
    if (!recoveryConfig.notifyUser) return false;
    
    // Only notify for high and critical errors
    return severity === 'high' || severity === 'critical';
  }

  /**
   * Update error statistics
   */
  function updateErrorStats(error: InjectionError, platform: Platform): void {
    errorStats = {
      ...errorStats,
      totalErrors: errorStats.totalErrors + 1,
      errorsByType: {
        ...errorStats.errorsByType,
        [error.code]: (errorStats.errorsByType[error.code] || 0) + 1,
      },
      errorsByPlatform: {
        ...errorStats.errorsByPlatform,
        [platform]: (errorStats.errorsByPlatform[platform] || 0) + 1,
      },
      lastError: error,
      errorHistory: [...errorStats.errorHistory.slice(-9), error], // Keep last 10
    };
  }

  /**
   * Log error with context
   */
  function logError(error: InjectionError, context: Record<string, unknown>): void {
    const logLevel = error.severity === 'critical' ? 'error' : 
                     error.severity === 'high' ? 'warn' : 'info';

    const logMessage = {
      message: 'Injection error occurred',
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        retryCount: error.retryCount,
        recoverable: error.recoverable,
      },
      context,
      userMessage: getUserFriendlyMessage(error),
    };

    console[logLevel]('🚨 Injection Error:', logMessage);

    // Report to global error handler
    GlobalErrorHandler.handleError(error, context);
  }

  /**
   * Notify user about error
   */
  async function notifyUser(error: InjectionError): Promise<void> {
    await Promise.resolve(); // Ensure function is properly async
    if (!notificationConfig.enabled) return;

    const message = getUserFriendlyMessage(error);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'keyboard-error-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      line-height: 1.4;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto-hide if configured
    if (notificationConfig.autoHide) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, notificationConfig.duration);
    }
  }

  /**
   * Determine recovery action based on error and configuration
   */
  function determineRecoveryAction(error: InjectionError): RecoveryAction {
    if (!recoveryConfig.enableRetry && error.recoverable) {
      return error.suggestedAction;
    }

    if (error.severity === 'critical') {
      return recoveryConfig.gracefulDegradation ? 'fallback' : 'disable';
    }

    return error.suggestedAction;
  }

  /**
   * Execute recovery action
   */
  async function executeRecovery(
    error: InjectionError,
    action: RecoveryAction,
    context: { readonly platform: Platform }
  ): Promise<RecoveryResult> {
    switch (action) {
      case 'retry': {
        const delay = calculateRetryDelay(error.retryCount);
        return {
          success: false,
          action: 'retry',
          nextRetryDelay: delay,
          fallbackAvailable: isRecoverable(error, error.retryCount + 1),
        };
      }

      case 'fallback':
        return {
          success: false,
          action: 'fallback',
          message: 'Trying alternative injection method...',
          fallbackAvailable: true,
        };

      case 'manual':
        return {
          success: false,
          action: 'manual',
          message: 'Manual intervention required.',
          fallbackAvailable: false,
        };

      case 'silent':
        return {
          success: true,
          action: 'silent',
          fallbackAvailable: false,
        };

      case 'disable':
        return {
          success: false,
          action: 'disable',
          message: 'Injection disabled due to critical error.',
          fallbackAvailable: false,
        };

      case 'notification':
        await notifyUser(error);
        return {
          success: false,
          action: 'notification',
          fallbackAvailable: error.recoverable,
        };

      default:
        return {
          success: false,
          action: 'fallback',
          fallbackAvailable: error.recoverable,
        };
    }
  }
}