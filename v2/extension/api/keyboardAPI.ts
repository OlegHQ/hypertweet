/**
 * Keyboard-specific API endpoints optimized for real-time interactions
 */

import { APIClient } from './client.js';
import type {
  APIResponse,
  PaginatedAPIResponse,
  Tone,
  ToneSearchCriteria,
} from './types.js';

export namespace KeyboardAPI {
  /**
   * Quick tone generation request optimized for keyboard interactions
   */
  export async function generateTone(
    content: string,
    toneId: string,
    context?: {
      readonly platform?: 'twitter' | 'linkedin' | 'reddit';
      readonly replyTo?: string;
      readonly parentPost?: string;
    }
  ): Promise<APIResponse<{ readonly generatedText: string }>> {
    return await APIClient.post(
      '/keyboard/generate-tone',
      {
        content,
        toneId,
        context: context ?? {},
      },
      {
        timeout: 5000, // Faster timeout for keyboard interactions
        retries: 1, // Fewer retries for real-time feel
      }
    );
  }

  /**
   * Fast tone search with caching for keyboard UI
   */
  export async function searchTones(
    criteria: ToneSearchCriteria & {
      readonly limit?: number;
    }
  ): Promise<PaginatedAPIResponse<Tone>> {
    const searchParams = new URLSearchParams();

    if (criteria.query) {
      searchParams.set('query', criteria.query);
    }
    if (criteria.category) {
      searchParams.set('category', criteria.category);
    }
    if (criteria.sortBy) {
      searchParams.set('sortBy', criteria.sortBy);
    }
    if (criteria.sortOrder) {
      searchParams.set('sortOrder', criteria.sortOrder);
    }
    if (criteria.limit) {
      searchParams.set('limit', criteria.limit.toString());
    }

    const queryString = searchParams.toString();
    const url = `/keyboard/tones${queryString ? `?${queryString}` : ''}`;

    return await APIClient.get<Tone[]>(url, {
      timeout: 3000, // Quick response for UI
      retries: 1,
      headers: {
        'Cache-Control': 'max-age=300', // 5 minute cache
      },
    });
  }

  /**
   * Get recently used tones for quick access
   */
  export async function getRecentTones(
    limit: number = 10
  ): Promise<APIResponse<readonly Tone[]>> {
    return await APIClient.get<readonly Tone[]>(
      `/keyboard/tones/recent?limit=${limit}`,
      {
        timeout: 2000,
        retries: 1,
        headers: {
          'Cache-Control': 'max-age=60', // 1 minute cache for recent tones
        },
      }
    );
  }

  /**
   * Mark tone as used for tracking recent usage
   */
  export async function markToneUsed(
    toneId: string
  ): Promise<APIResponse<void>> {
    return await APIClient.post(
      '/keyboard/tones/mark-used',
      {
        toneId,
        timestamp: new Date().toISOString(),
      },
      {
        timeout: 1000, // Fire-and-forget style
        retries: 0,
      }
    );
  }

  /**
   * Get tone suggestions based on content analysis
   */
  export async function getToneSuggestions(
    content: string,
    context?: {
      readonly platform?: 'twitter' | 'linkedin' | 'reddit';
      readonly sentiment?: 'positive' | 'negative' | 'neutral';
    }
  ): Promise<APIResponse<readonly Tone[]>> {
    return await APIClient.post(
      '/keyboard/tones/suggest',
      {
        content,
        context: context ?? {},
      },
      {
        timeout: 4000,
        retries: 1,
      }
    );
  }

  /**
   * Validate generated content before submission
   */
  export async function validateContent(
    content: string,
    platform: 'twitter' | 'linkedin' | 'reddit'
  ): Promise<
    APIResponse<{
      readonly isValid: boolean;
      readonly warnings: readonly string[];
      readonly characterCount: number;
      readonly platformLimits: {
        readonly maxLength: number;
        readonly allowsFormatting: boolean;
      };
    }>
  > {
    return await APIClient.post(
      '/keyboard/validate',
      {
        content,
        platform,
      },
      {
        timeout: 2000,
        retries: 1,
      }
    );
  }

  /**
   * Health check for keyboard API services
   */
  export async function healthCheck(): Promise<
    APIResponse<{
      readonly status: 'healthy' | 'degraded' | 'unhealthy';
      readonly services: {
        readonly generation: boolean;
        readonly toneSearch: boolean;
        readonly validation: boolean;
      };
      readonly latency: number;
    }>
  > {
    const startTime = Date.now();

    try {
      const response = await APIClient.get('/keyboard/health', {
        timeout: 5000,
        retries: 0,
      });

      if (response.success && response.data) {
        const healthData = response.data as {
          readonly status: 'healthy' | 'degraded' | 'unhealthy';
          readonly services: {
            readonly generation: boolean;
            readonly toneSearch: boolean;
            readonly validation: boolean;
          };
        };

        return {
          success: response.success,
          statusCode: response.statusCode,
          headers: response.headers,
          data: {
            ...healthData,
            latency: Date.now() - startTime,
          },
        };
      }

      return {
        success: false,
        error: response.error ?? 'Health check failed',
        statusCode: response.statusCode,
        headers: response.headers,
        data: {
          status: 'unhealthy' as const,
          services: {
            generation: false,
            toneSearch: false,
            validation: false,
          },
          latency: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        statusCode: 500,
        headers: {},
        data: {
          status: 'unhealthy' as const,
          services: {
            generation: false,
            toneSearch: false,
            validation: false,
          },
          latency: Date.now() - startTime,
        },
      };
    }
  }
}
