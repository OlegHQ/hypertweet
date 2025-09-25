/**
 * Chrome storage wrapper for authentication tokens and user data
 */

import {
  StorageKey,
  StoredAuthData,
  AuthError,
  AuthErrorCode,
  User,
  JWTToken,
} from './types.js';

/**
 * Chrome storage operations for authentication data
 */
export namespace AuthStorage {
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  let cleanupTimer: number | null = null;

  /**
   * Initialize automatic token cleanup
   */
  export function initializeCleanup(): void {
    // Clear existing timer if any
    if (cleanupTimer !== null) {
      clearInterval(cleanupTimer);
    }

    // Set up periodic cleanup
    cleanupTimer = setInterval(() => {
      void cleanupExpiredTokens();
    }, CLEANUP_INTERVAL) as number;
  }

  /**
   * Stop automatic token cleanup
   */
  export function stopCleanup(): void {
    if (cleanupTimer !== null) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }

  /**
   * Save authentication token and user data to chrome.storage.sync
   */
  export async function saveAuthToken(
    token: string,
    expiresAt: number,
    user: User
  ): Promise<void> {
    try {
      const storedData: StoredAuthData = {
        token,
        expiresAt,
        user,
        storedAt: Date.now(),
      };

      await chrome.storage.sync.set({
        [StorageKey.AUTH_TOKEN]: storedData,
      });
    } catch (error) {
      throw createStorageError('Failed to save authentication token', error);
    }
  }

  /**
   * Retrieve stored authentication token from chrome.storage.sync
   */
  export async function getAuthToken(): Promise<JWTToken | null> {
    try {
      const result = await chrome.storage.sync.get([StorageKey.AUTH_TOKEN]);
      const storedData = result[StorageKey.AUTH_TOKEN] as
        | StoredAuthData
        | undefined;

      if (!storedData) {
        return null;
      }

      // Check if token is expired
      if (isTokenExpired(storedData.expiresAt)) {
        await clearAuthToken();
        return null;
      }

      return {
        token: storedData.token,
        expiresAt: storedData.expiresAt,
        issuedAt: storedData.storedAt,
      };
    } catch (error) {
      throw createStorageError(
        'Failed to retrieve authentication token',
        error
      );
    }
  }

  /**
   * Retrieve stored user data from chrome.storage.sync
   */
  export async function getUserData(): Promise<User | null> {
    try {
      const result = await chrome.storage.sync.get([StorageKey.AUTH_TOKEN]);
      const storedData = result[StorageKey.AUTH_TOKEN] as
        | StoredAuthData
        | undefined;

      if (!storedData) {
        return null;
      }

      // Check if token is expired (user data is tied to token validity)
      if (isTokenExpired(storedData.expiresAt)) {
        await clearAuthToken();
        return null;
      }

      return storedData.user;
    } catch (error) {
      throw createStorageError('Failed to retrieve user data', error);
    }
  }

  /**
   * Clear authentication token and user data from storage
   */
  export async function clearAuthToken(): Promise<void> {
    try {
      await chrome.storage.sync.remove([
        StorageKey.AUTH_TOKEN,
        StorageKey.USER_DATA,
      ]);
    } catch (error) {
      throw createStorageError('Failed to clear authentication data', error);
    }
  }

  /**
   * Check if a token is valid (not expired)
   */
  export function isTokenValid(token: JWTToken): boolean {
    return !isTokenExpired(token.expiresAt);
  }

  /**
   * Get token expiration time in milliseconds until expiration
   */
  export function getTokenTimeToExpiration(token: JWTToken): number {
    return Math.max(0, token.expiresAt - Date.now());
  }

  /**
   * Check if stored authentication data exists and is valid
   */
  export async function hasValidStoredAuth(): Promise<boolean> {
    try {
      const token = await getAuthToken();
      return token !== null && isTokenValid(token);
    } catch {
      return false;
    }
  }

  /**
   * Update stored user data while preserving token
   */
  export async function updateUserData(user: User): Promise<void> {
    try {
      const result = await chrome.storage.sync.get([StorageKey.AUTH_TOKEN]);
      const storedData = result[StorageKey.AUTH_TOKEN] as
        | StoredAuthData
        | undefined;

      if (!storedData) {
        throw createStorageError(
          'No authentication data found to update',
          new Error('Missing stored auth data')
        );
      }

      const updatedData: StoredAuthData = {
        ...storedData,
        user,
      };

      await chrome.storage.sync.set({
        [StorageKey.AUTH_TOKEN]: updatedData,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('No authentication data')
      ) {
        throw error;
      }
      throw createStorageError('Failed to update user data', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  export async function getStorageStats(): Promise<{
    readonly bytesUsed: number;
    readonly bytesRemaining: number;
  }> {
    try {
      const bytesUsed = await chrome.storage.sync.getBytesInUse();
      const maxBytes = chrome.storage.sync.QUOTA_BYTES;

      return {
        bytesUsed,
        bytesRemaining: maxBytes - bytesUsed,
      };
    } catch (error) {
      throw createStorageError('Failed to get storage statistics', error);
    }
  }

  /**
   * Private helper: Check if token is expired
   */
  function isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  }

  /**
   * Private helper: Cleanup expired tokens automatically
   */
  async function cleanupExpiredTokens(): Promise<void> {
    try {
      const token = await getAuthToken();
      if (token !== null && !isTokenValid(token)) {
        await clearAuthToken();
      }
    } catch {
      // Ignore errors during automatic cleanup
    }
  }

  /**
   * Private helper: Create standardized storage error
   */
  function createStorageError(
    message: string,
    originalError: unknown
  ): AuthError {
    return {
      code: AuthErrorCode.STORAGE_ERROR,
      message,
      details: {
        originalError:
          originalError instanceof Error
            ? originalError.message
            : String(originalError),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
