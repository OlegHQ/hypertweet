/**
 * API types and interfaces for HTTP client operations
 */

/**
 * HTTP methods supported by the API client
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API request configuration
 */
export interface APIRequestConfig {
  readonly method: HTTPMethod;
  readonly url: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly timeout?: number;
  readonly retries?: number;
  readonly requiresAuth?: boolean;
}

/**
 * API response wrapper for all API calls
 */
export interface APIResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly statusCode: number;
  readonly headers: Record<string, string>;
}

/**
 * Paginated API response wrapper
 */
export interface PaginatedAPIResponse<T = unknown> extends APIResponse<T[]> {
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
  };
}

/**
 * API request options for client configuration
 */
export interface APIClientOptions {
  readonly baseURL: string;
  readonly timeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly headers?: Record<string, string>;
}

/**
 * Request interceptor function type
 */
export type RequestInterceptor = (
  config: APIRequestConfig
) => Promise<APIRequestConfig> | APIRequestConfig;

/**
 * Response interceptor function type
 */
export type ResponseInterceptor = <T>(
  response: APIResponse<T>,
  config: APIRequestConfig
) => Promise<APIResponse<T>> | APIResponse<T>;

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  readonly attempts: number;
  readonly delay: number;
  readonly backoffFactor: number;
  readonly maxDelay: number;
  readonly retryCondition: (error: Error, attempt: number) => boolean;
}

/**
 * Network request timeout configuration
 */
export interface TimeoutConfig {
  readonly request: number; // Request timeout in milliseconds
  readonly connection: number; // Connection timeout in milliseconds
}

/**
 * API client interceptors configuration
 */
export interface InterceptorsConfig {
  readonly request: readonly RequestInterceptor[];
  readonly response: readonly ResponseInterceptor[];
}

/**
 * HTTP status code ranges for classification
 */
export enum HTTPStatusRange {
  SUCCESS = 200,
  REDIRECT = 300,
  CLIENT_ERROR = 400,
  SERVER_ERROR = 500,
}

/**
 * Common HTTP status codes
 */
export enum HTTPStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Request body types for different content types
 */
export type RequestBody =
  | Record<string, unknown>
  | string
  | FormData
  | URLSearchParams
  | ArrayBuffer
  | Blob;

/**
 * Content type headers for requests
 */
export enum ContentType {
  JSON = 'application/json',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  FORM_DATA = 'multipart/form-data',
  TEXT = 'text/plain',
  HTML = 'text/html',
}

/**
 * Authentication header types
 */
export interface AuthHeaders {
  readonly Authorization?: string;
  readonly 'X-API-Key'?: string;
  readonly 'X-User-Agent'?: string;
}

/**
 * API error response format
 */
export interface APIErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly timestamp: string;
  };
}

/**
 * Request metadata for logging and debugging
 */
export interface RequestMetadata {
  readonly id: string;
  readonly startTime: number;
  endTime?: number;
  duration?: number;
  retryAttempt: number;
  readonly url: string;
  readonly method: HTTPMethod;
}

/**
 * API client event types for monitoring
 */
export enum APIClientEvent {
  REQUEST_START = 'request_start',
  REQUEST_SUCCESS = 'request_success',
  REQUEST_ERROR = 'request_error',
  REQUEST_RETRY = 'request_retry',
  REQUEST_TIMEOUT = 'request_timeout',
  TOKEN_REFRESH = 'token_refresh',
}

/**
 * Event listener type for API client events
 */
export type APIClientEventListener = (
  event: APIClientEvent,
  metadata: RequestMetadata,
  data?: unknown
) => void;

/**
 * Tone API types
 */
export type {
  Tone,
  ToneFormData,
  ToneSearchCriteria,
} from '@/screens/tones/types';

/**
 * User API types
 */
export type { UserProfile, UserSettings } from '@/models';

export interface ChangePasswordRequest {
  readonly oldPassword: string;
  readonly newPassword: string;
}

export interface UsageStats {
  readonly tonesCreated: number;
  readonly repliesGenerated: number;
  readonly successRate: number;
}
