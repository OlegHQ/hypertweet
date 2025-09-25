/**
 * API error handling and retry logic utilities
 */

import { AuthError, AuthErrorCode } from '../auth/types.js';
import { HTTPStatus, APIErrorResponse, RetryConfig } from './types.js';

/**
 * Base API error class extending native Error
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    if (statusCode !== undefined) {
      Object.defineProperty(this, 'statusCode', {
        value: statusCode,
        enumerable: true,
        configurable: true,
      });
    }
    if (details !== undefined) {
      Object.defineProperty(this, 'details', {
        value: details,
        enumerable: true,
        configurable: true,
      });
    }
    this.timestamp = new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Network-specific error for connection issues
 */
export class NetworkError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', undefined, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout error for request timeouts
 */
export class TimeoutError extends APIError {
  constructor(message: string, timeout: number) {
    super(message, 'TIMEOUT_ERROR', undefined, { timeout });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Validation error for client-side validation failures
 */
export class ValidationError extends APIError {
  constructor(
    message: string,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', HTTPStatus.BAD_REQUEST, {
      field,
      ...details,
    });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication error extending AuthError for API context
 */
export class APIAuthError extends APIError implements AuthError {
  public override readonly code: AuthErrorCode;

  constructor(authError: AuthError, statusCode?: number) {
    super(authError.message, authError.code, statusCode, authError.details);
    this.name = 'APIAuthError';
    this.code = authError.code;
    Object.setPrototypeOf(this, APIAuthError.prototype);
  }
}

/**
 * Server error for 5xx status codes
 */
export class ServerError extends APIError {
  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'SERVER_ERROR', statusCode, details);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error handling utilities namespace
 */
export namespace ErrorHandler {
  /**
   * Parse API error response into structured error
   */
  export function parseAPIError(
    response: Response,
    body?: APIErrorResponse | string
  ): APIError {
    const statusCode = response.status;
    const { statusText } = response;

    // Handle structured API error response
    if (body && typeof body === 'object' && 'error' in body) {
      const { error } = body;
      return new APIError(error.message, error.code, statusCode, error.details);
    }

    // Handle plain text error response
    const message =
      typeof body === 'string' ? body : statusText || 'Unknown API error';

    // Create appropriate error type based on status code
    if (statusCode >= HTTPStatus.INTERNAL_SERVER_ERROR) {
      return new ServerError(message, statusCode);
    }

    if (
      statusCode === HTTPStatus.UNAUTHORIZED ||
      statusCode === HTTPStatus.FORBIDDEN
    ) {
      const authError: AuthError = {
        code:
          statusCode === HTTPStatus.UNAUTHORIZED
            ? AuthErrorCode.TOKEN_EXPIRED
            : AuthErrorCode.USER_NOT_FOUND,
        message,
        details: { statusCode },
      };
      return new APIAuthError(authError, statusCode);
    }

    if (
      statusCode === HTTPStatus.BAD_REQUEST ||
      statusCode === HTTPStatus.UNPROCESSABLE_ENTITY
    ) {
      return new ValidationError(message, undefined, { statusCode });
    }

    return new APIError(message, 'HTTP_ERROR', statusCode);
  }

  /**
   * Check if error is retryable based on error type and status code
   */
  export function isRetryableError(error: Error): boolean {
    if (error instanceof NetworkError) {
      return true;
    }

    if (error instanceof TimeoutError) {
      return true;
    }

    if (error instanceof APIError && error.statusCode) {
      const { statusCode } = error;
      // Retry on 5xx server errors and specific 4xx errors
      return (
        statusCode >= HTTPStatus.INTERNAL_SERVER_ERROR ||
        statusCode === HTTPStatus.TOO_MANY_REQUESTS ||
        statusCode === HTTPStatus.BAD_GATEWAY ||
        statusCode === HTTPStatus.SERVICE_UNAVAILABLE ||
        statusCode === HTTPStatus.GATEWAY_TIMEOUT
      );
    }

    return false;
  }

  /**
   * Get user-friendly error message for display
   */
  export function getUserFriendlyMessage(error: Error): string {
    if (error instanceof NetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error instanceof TimeoutError) {
      return 'Request timed out. Please try again.';
    }

    if (error instanceof APIAuthError) {
      switch (error.code) {
        case AuthErrorCode.TOKEN_EXPIRED:
          return 'Your session has expired. Please log in again.';
        case AuthErrorCode.INVALID_CREDENTIALS:
          return 'Invalid email or password. Please check your credentials and try again.';
        case AuthErrorCode.USER_NOT_FOUND:
          return 'Account not found. Please check your email or register for a new account.';
        case AuthErrorCode.EMAIL_NOT_VERIFIED:
          return 'Please verify your email address before logging in.';
        case AuthErrorCode.ACCOUNT_LOCKED:
          return 'Your account has been temporarily locked. Please contact support.';
        case AuthErrorCode.RATE_LIMITED:
          return 'Too many login attempts. Please wait a moment and try again.';
        default:
          return 'Authentication failed. Please try logging in again.';
      }
    }

    if (error instanceof ValidationError) {
      return error.message; // Validation messages are usually user-friendly
    }

    if (error instanceof ServerError) {
      return 'Server is temporarily unavailable. Please try again later.';
    }

    if (error instanceof APIError) {
      // Return original message for API errors as they should be user-friendly
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Retry strategy implementations
 */
export namespace RetryStrategy {
  /**
   * Create a default retry configuration
   */
  export function createDefault(): RetryConfig {
    return {
      attempts: 3,
      delay: 1000,
      backoffFactor: 2,
      maxDelay: 10000,
      retryCondition: ErrorHandler.isRetryableError,
    };
  }

  /**
   * Create a retry configuration for authentication requests
   */
  export function createForAuth(): RetryConfig {
    return {
      attempts: 2, // Fewer retries for auth to avoid account lockout
      delay: 500,
      backoffFactor: 2,
      maxDelay: 2000,
      retryCondition: (error: Error): boolean =>
        // Only retry network errors for auth, not API errors
        error instanceof NetworkError || error instanceof TimeoutError,
    };
  }

  /**
   * Calculate delay for retry attempt with exponential backoff
   */
  export function calculateDelay(config: RetryConfig, attempt: number): number {
    const delay = config.delay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Execute retry logic with given configuration
   */
  export async function executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error = new Error('No error occurred');

    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if error is not retryable or this is the last attempt
        if (
          !config.retryCondition(lastError, attempt) ||
          attempt === config.attempts
        ) {
          throw lastError;
        }

        // Wait before retrying
        const delay = calculateDelay(config, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
