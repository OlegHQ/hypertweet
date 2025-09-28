import { APIError, ErrorHandler } from '@/api/errors';

export namespace GlobalErrorHandler {
  export function handleError(
    error: unknown,
    context?: Record<string, unknown>
  ): void {
    const friendlyMessage =
      error instanceof Error
        ? ErrorHandler.getUserFriendlyMessage(error)
        : 'An unknown error occurred';

    console.error('An error occurred:', {
      originalError: error,
      friendlyMessage,
      context,
    });

    // In a real application, you would report the error to a monitoring service
    // reportToMonitoringService(error, context);
  }

  export function getFriendlyMessage(error: unknown): string {
    return error instanceof Error
      ? ErrorHandler.getUserFriendlyMessage(error)
      : 'An unknown error occurred';
  }
}
