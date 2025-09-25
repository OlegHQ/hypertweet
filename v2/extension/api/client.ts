/**
 * Base API client with authentication and retry logic
 */

import { AuthStorage } from '../auth/storage.js';
import { AuthErrorCode } from '../auth/types.js';
import {
  APIRequestConfig,
  APIResponse,
  APIClientOptions,
  RequestInterceptor,
  ResponseInterceptor,
  ContentType,
  RequestBody,
  APIClientEvent,
  APIClientEventListener,
  RequestMetadata,
} from './types.js';
import {
  NetworkError,
  TimeoutError,
  ErrorHandler,
  RetryStrategy,
  APIAuthError,
} from './errors.js';

/**
 * Base API client namespace for HTTP operations
 */
export namespace APIClient {
  let clientOptions: APIClientOptions = {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    headers: {
      'Content-Type': ContentType.JSON,
      Accept: ContentType.JSON,
    },
  };

  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];
  const eventListeners: APIClientEventListener[] = [];

  /**
   * Configure the API client with options
   */
  export function configure(options: Partial<APIClientOptions>): void {
    clientOptions = {
      ...clientOptions,
      ...options,
      headers: {
        ...clientOptions.headers,
        ...options.headers,
      },
    };
  }

  /**
   * Add request interceptor
   */
  export function addRequestInterceptor(interceptor: RequestInterceptor): void {
    requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  export function addResponseInterceptor(
    interceptor: ResponseInterceptor
  ): void {
    responseInterceptors.push(interceptor);
  }

  /**
   * Add event listener for API client events
   */
  export function addEventListener(listener: APIClientEventListener): void {
    eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  export function removeEventListener(listener: APIClientEventListener): void {
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit API client event to all listeners
   */
  function emitEvent(
    event: APIClientEvent,
    metadata: RequestMetadata,
    data?: unknown
  ): void {
    eventListeners.forEach(listener => {
      try {
        listener(event, metadata, data);
      } catch (error) {
        console.warn('API client event listener error:', error);
      }
    });
  }

  /**
   * Generate unique request ID
   */
  function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Create absolute URL from relative path
   */
  function createURL(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseURL = clientOptions.baseURL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseURL}${cleanPath}`;
  }

  /**
   * Inject authentication token into request headers
   */
  async function injectAuthToken(
    config: APIRequestConfig
  ): Promise<APIRequestConfig> {
    if (config.requiresAuth === false) {
      return config;
    }

    try {
      const token = await AuthStorage.getAuthToken();
      if (token && AuthStorage.isTokenValid(token)) {
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token.token}`,
          },
        };
      }
    } catch (error) {
      console.warn('Failed to inject auth token:', error);
    }

    return config;
  }

  /**
   * Apply request interceptors
   */
  async function applyRequestInterceptors(
    config: APIRequestConfig
  ): Promise<APIRequestConfig> {
    let processedConfig = config;

    for (const interceptor of requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        console.warn('Request interceptor error:', error);
      }
    }

    return processedConfig;
  }

  /**
   * Apply response interceptors
   */
  async function applyResponseInterceptors<T>(
    response: APIResponse<T>,
    config: APIRequestConfig
  ): Promise<APIResponse<T>> {
    let processedResponse = response;

    for (const interceptor of responseInterceptors) {
      try {
        processedResponse = await interceptor(processedResponse, config);
      } catch (error) {
        console.warn('Response interceptor error:', error);
      }
    }

    return processedResponse;
  }

  /**
   * Serialize request body based on content type
   */
  function serializeBody(
    body: RequestBody,
    contentType: string
  ): string | FormData | URLSearchParams | ArrayBuffer | Blob {
    if (!body) {
      return '';
    }

    if (
      typeof body === 'string' ||
      body instanceof FormData ||
      body instanceof URLSearchParams ||
      body instanceof ArrayBuffer ||
      body instanceof Blob
    ) {
      return body;
    }

    if (contentType.includes(ContentType.JSON)) {
      return JSON.stringify(body);
    }

    if (contentType.includes(ContentType.FORM_URLENCODED)) {
      const params = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      return params;
    }

    return JSON.stringify(body);
  }

  /**
   * Parse response body based on content type
   */
  async function parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    try {
      if (contentType.includes(ContentType.JSON)) {
        return await response.json();
      }

      if (
        contentType.includes(ContentType.TEXT) ||
        contentType.includes(ContentType.HTML)
      ) {
        return await response.text();
      }

      // Default to text for unknown content types
      return await response.text();
    } catch {
      // If parsing fails, return null
      return null;
    }
  }

  /**
   * Create fetch request with timeout and AbortController
   */
  async function createFetchRequest(
    config: APIRequestConfig,
    metadata: RequestMetadata
  ): Promise<Response> {
    const url = createURL(config.url);
    const timeout = config.timeout ?? clientOptions.timeout;
    const controller = new AbortController();

    // Set up timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const contentType = config.headers?.['Content-Type'] ?? ContentType.JSON;
      const serializedBody = config.body
        ? serializeBody(config.body as RequestBody, contentType)
        : null;

      emitEvent(APIClientEvent.REQUEST_START, metadata);

      const fetchOptions: RequestInit = {
        method: config.method,
        headers: {
          ...clientOptions.headers,
          ...config.headers,
        },
        signal: controller.signal,
      };

      if (config.method !== 'GET' && serializedBody !== null) {
        fetchOptions.body = serializedBody;
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(`Request timeout after ${timeout}ms`, timeout);
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed', {
          url,
          method: config.method,
          originalError: error.message,
        });
      }

      throw error;
    }
  }

  /**
   * Handle token refresh for 401 responses
   */
  async function handleTokenRefresh(
    config: APIRequestConfig
  ): Promise<APIRequestConfig> {
    try {
      // Attempt to get a fresh token from storage (in case it was refreshed elsewhere)
      const token = await AuthStorage.getAuthToken();
      if (token && AuthStorage.isTokenValid(token)) {
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${token.token}`,
          },
        };
      }

      // If no valid token, clear storage and throw auth error
      await AuthStorage.clearAuthToken();
      throw new APIAuthError(
        {
          code: AuthErrorCode.TOKEN_EXPIRED,
          message: 'Authentication token expired',
          details: { requiresLogin: true },
        },
        401
      );
    } catch (error) {
      if (error instanceof APIAuthError) {
        throw error;
      }
      throw new APIAuthError(
        {
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'Failed to refresh authentication token',
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        },
        401
      );
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  async function executeRequest<T>(
    config: APIRequestConfig
  ): Promise<APIResponse<T>> {
    const metadata: RequestMetadata = {
      id: generateRequestId(),
      startTime: Date.now(),
      retryAttempt: 0,
      url: config.url,
      method: config.method,
    };

    // Apply request interceptors and token injection
    let processedConfig = await injectAuthToken(config);
    processedConfig = await applyRequestInterceptors(processedConfig);

    const retryConfig =
      config.method === 'POST' && config.url.includes('/auth')
        ? RetryStrategy.createForAuth()
        : RetryStrategy.createDefault();

    const executeWithRetry = async (): Promise<APIResponse<T>> => {
      let lastError: Error = new Error('No error occurred');

      for (
        let attempt = 1;
        attempt <= (config.retries ?? retryConfig.attempts);
        attempt++
      ) {
        metadata.retryAttempt = attempt;

        try {
          const response = await createFetchRequest(processedConfig, metadata);
          const responseBody = await parseResponseBody(response);

          // Handle 401 unauthorized - attempt token refresh
          if (
            response.status === 401 &&
            processedConfig.requiresAuth !== false &&
            attempt === 1
          ) {
            processedConfig = await handleTokenRefresh(processedConfig);
            emitEvent(APIClientEvent.TOKEN_REFRESH, metadata);
            continue; // Retry with refreshed token
          }

          // Convert response headers to record
          const headers: Record<string, string> = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });

          const apiResponse: APIResponse<T> = {
            success: response.ok,
            statusCode: response.status,
            headers,
            ...(response.ok
              ? { data: responseBody as T }
              : {
                  error:
                    typeof responseBody === 'string'
                      ? responseBody
                      : response.statusText,
                }),
          };

          if (!response.ok) {
            const error = ErrorHandler.parseAPIError(
              response,
              responseBody as string | undefined
            );

            // Check if error is retryable
            if (
              ErrorHandler.isRetryableError(error) &&
              attempt < (config.retries ?? retryConfig.attempts)
            ) {
              lastError = error;
              emitEvent(APIClientEvent.REQUEST_RETRY, metadata, error);

              const delay = RetryStrategy.calculateDelay(retryConfig, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }

            throw error;
          }

          metadata.endTime = Date.now();
          metadata.duration = metadata.endTime - metadata.startTime;

          emitEvent(APIClientEvent.REQUEST_SUCCESS, metadata, apiResponse);
          return await applyResponseInterceptors(apiResponse, processedConfig);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry if error is not retryable or this is the last attempt
          if (
            !ErrorHandler.isRetryableError(lastError) ||
            attempt === (config.retries ?? retryConfig.attempts)
          ) {
            metadata.endTime = Date.now();
            metadata.duration = metadata.endTime - metadata.startTime;

            emitEvent(APIClientEvent.REQUEST_ERROR, metadata, lastError);
            throw lastError;
          }

          emitEvent(APIClientEvent.REQUEST_RETRY, metadata, lastError);

          // Wait before retrying
          const delay = RetryStrategy.calculateDelay(retryConfig, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError;
    };

    return await executeWithRetry();
  }

  /**
   * Generic request method
   */
  export async function request<T = unknown>(
    config: APIRequestConfig
  ): Promise<APIResponse<T>> {
    return await executeRequest<T>(config);
  }

  /**
   * GET request helper
   */
  export async function get<T = unknown>(
    url: string,
    options: Partial<APIRequestConfig> = {}
  ): Promise<APIResponse<T>> {
    return await request<T>({
      method: 'GET',
      url,
      ...options,
    });
  }

  /**
   * POST request helper
   */
  export async function post<T = unknown>(
    url: string,
    body?: RequestBody,
    options: Partial<APIRequestConfig> = {}
  ): Promise<APIResponse<T>> {
    return await request<T>({
      method: 'POST',
      url,
      body,
      ...options,
    });
  }

  /**
   * PUT request helper
   */
  export async function put<T = unknown>(
    url: string,
    body?: RequestBody,
    options: Partial<APIRequestConfig> = {}
  ): Promise<APIResponse<T>> {
    return await request<T>({
      method: 'PUT',
      url,
      body,
      ...options,
    });
  }

  /**
   * PATCH request helper
   */
  export async function patch<T = unknown>(
    url: string,
    body?: RequestBody,
    options: Partial<APIRequestConfig> = {}
  ): Promise<APIResponse<T>> {
    return await request<T>({
      method: 'PATCH',
      url,
      body,
      ...options,
    });
  }

  /**
   * DELETE request helper
   */
  export async function delete_<T = unknown>(
    url: string,
    options: Partial<APIRequestConfig> = {}
  ): Promise<APIResponse<T>> {
    return await request<T>({
      method: 'DELETE',
      url,
      ...options,
    });
  }
}
