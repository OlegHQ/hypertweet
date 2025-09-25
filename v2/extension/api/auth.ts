/**
 * Authentication API endpoints and operations
 */

import { AuthStorage } from '../auth/storage.js';
import { JWTValidator } from '../auth/validation.js';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenResponse,
  User,
  AuthError,
  AuthErrorCode,
} from '../auth/types.js';
import { APIClient } from './client.js';
import { APIAuthError, ErrorHandler } from './errors.js';

/**
 * Authentication API operations namespace
 */
export namespace AuthAPI {
  /**
   * Login with email and password
   */
  export async function login(
    email: string,
    password: string,
    rememberMe = false
  ): Promise<LoginResponse> {
    try {
      const loginRequest: LoginRequest = {
        email: email.trim().toLowerCase(),
        password,
        rememberMe,
      };

      const response = await APIClient.post<LoginResponse>(
        '/auth/login',
        loginRequest as unknown as Record<string, unknown>,
        {
          requiresAuth: false,
          timeout: 10000, // 10 second timeout for login
        }
      );

      if (response.success && response.data) {
        const { success, token, user, error } = response.data;

        if (success && token && user) {
          // Validate and store the JWT token
          const tokenValidation = JWTValidator.parseJWT(token);

          if (!tokenValidation.isValid) {
            const authError: AuthError = {
              code: AuthErrorCode.TOKEN_INVALID,
              message: 'Received invalid token from server',
              ...(tokenValidation.error?.details && {
                details: {
                  ...tokenValidation.error.details,
                },
              }),
            };
            throw new APIAuthError(authError);
          }

          // Store token and user data
          await AuthStorage.saveAuthToken(
            token,
            tokenValidation.data.exp * 1000,
            user
          );

          return { success: true, token, user };
        }

        if (error) {
          throw new APIAuthError(error);
        }
      }

      // Handle unsuccessful response
      throw new APIAuthError({
        code: AuthErrorCode.INVALID_CREDENTIALS,
        message: response.error ?? 'Login failed',
        details: { statusCode: response.statusCode },
      });
    } catch (error) {
      if (error instanceof APIAuthError) {
        throw error;
      }

      // Convert other errors to auth errors
      const message = ErrorHandler.getUserFriendlyMessage(error as Error);
      throw new APIAuthError({
        code: AuthErrorCode.NETWORK_ERROR,
        message,
        details: {
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Register a new user account
   */
  export async function register(
    email: string,
    password: string,
    name?: string,
    acceptTerms = true
  ): Promise<RegisterResponse> {
    try {
      const registerRequest: RegisterRequest = {
        email: email.trim().toLowerCase(),
        password,
        acceptTerms,
        ...(name?.trim() && { name: name.trim() }),
      };

      const response = await APIClient.post<RegisterResponse>(
        '/auth/register',
        registerRequest as unknown as Record<string, unknown>,
        {
          requiresAuth: false,
          timeout: 15000, // 15 second timeout for registration
        }
      );

      if (response.success && response.data) {
        const { success, user, requiresVerification, error } = response.data;

        if (success) {
          const result: RegisterResponse = {
            success: true,
            ...(user && { user }),
            ...(requiresVerification !== undefined && { requiresVerification }),
          };
          return result;
        }

        if (error) {
          throw new APIAuthError(error);
        }
      }

      // Handle unsuccessful response
      throw new APIAuthError({
        code: AuthErrorCode.SERVER_ERROR,
        message: response.error ?? 'Registration failed',
        details: { statusCode: response.statusCode },
      });
    } catch (error) {
      if (error instanceof APIAuthError) {
        throw error;
      }

      // Convert other errors to auth errors
      const message = ErrorHandler.getUserFriendlyMessage(error as Error);
      throw new APIAuthError({
        code: AuthErrorCode.NETWORK_ERROR,
        message,
        details: {
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Refresh authentication token
   */
  export async function refreshToken(): Promise<RefreshTokenResponse> {
    try {
      // Check if we have a current token to refresh
      const currentToken = await AuthStorage.getAuthToken();
      if (!currentToken) {
        throw new APIAuthError({
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'No authentication token found',
        });
      }

      const response = await APIClient.post<RefreshTokenResponse>(
        '/auth/refresh',
        undefined,
        {
          requiresAuth: true,
          timeout: 10000,
          retries: 2, // Fewer retries for token refresh
        }
      );

      if (response.success && response.data) {
        const { success, token, error } = response.data;

        if (success && token) {
          // Validate the new token
          const tokenValidation = JWTValidator.parseJWT(token);

          if (!tokenValidation.isValid) {
            const authError: AuthError = {
              code: AuthErrorCode.TOKEN_INVALID,
              message: 'Received invalid refresh token from server',
              ...(tokenValidation.error?.details && {
                details: {
                  ...tokenValidation.error.details,
                },
              }),
            };
            throw new APIAuthError(authError);
          }

          // Get current user data and update storage with new token
          const currentUser = await AuthStorage.getUserData();
          if (currentUser) {
            await AuthStorage.saveAuthToken(
              token,
              tokenValidation.data.exp * 1000,
              currentUser
            );
          }

          return { success: true, token };
        }

        if (error) {
          // Clear stored token if refresh failed
          await AuthStorage.clearAuthToken();
          throw new APIAuthError(error);
        }
      }

      // Handle unsuccessful response
      await AuthStorage.clearAuthToken();
      throw new APIAuthError({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message: response.error ?? 'Token refresh failed',
        details: { statusCode: response.statusCode },
      });
    } catch (error) {
      if (error instanceof APIAuthError) {
        throw error;
      }

      // Clear token on any refresh error
      await AuthStorage.clearAuthToken();

      const message = ErrorHandler.getUserFriendlyMessage(error as Error);
      throw new APIAuthError({
        code: AuthErrorCode.TOKEN_EXPIRED,
        message,
        details: {
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Logout and invalidate current session
   */
  export async function logout(): Promise<{ readonly success: boolean }> {
    try {
      // Always clear local storage first
      await AuthStorage.clearAuthToken();

      // Attempt to notify server (best effort - don't fail if this fails)
      try {
        const response = await APIClient.post('/auth/logout', undefined, {
          requiresAuth: true,
          timeout: 5000,
          retries: 1, // Single retry for logout
        });

        return { success: response.success };
      } catch (error) {
        // Server logout failed, but local logout succeeded
        console.warn('Server logout failed, but local session cleared:', error);
        return { success: true };
      }
    } catch (error) {
      // Even if storage clearing fails, consider logout successful from user perspective
      console.error('Logout error:', error);
      return { success: true };
    }
  }

  /**
   * Get current user profile information
   */
  export async function getUserProfile(): Promise<User> {
    try {
      // First try to get user from local storage
      const cachedUser = await AuthStorage.getUserData();
      if (cachedUser) {
        // Verify we have a valid token
        const token = await AuthStorage.getAuthToken();
        if (token && AuthStorage.isTokenValid(token)) {
          return cachedUser;
        }
      }

      // Fetch fresh user data from server
      const response = await APIClient.get<{ readonly user: User }>(
        '/auth/profile',
        {
          requiresAuth: true,
          timeout: 10000,
        }
      );

      if (response.success && response.data?.user) {
        // Update cached user data
        const token = await AuthStorage.getAuthToken();
        if (token) {
          await AuthStorage.saveAuthToken(
            token.token,
            token.expiresAt,
            response.data.user
          );
        }

        return response.data.user;
      }

      throw new APIAuthError({
        code: AuthErrorCode.USER_NOT_FOUND,
        message: response.error ?? 'Failed to fetch user profile',
        details: { statusCode: response.statusCode },
      });
    } catch (error) {
      if (error instanceof APIAuthError) {
        throw error;
      }

      const message = ErrorHandler.getUserFriendlyMessage(error as Error);
      throw new APIAuthError({
        code: AuthErrorCode.NETWORK_ERROR,
        message,
        details: {
          originalError: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Check if user is currently authenticated with valid token
   */
  export async function isAuthenticated(): Promise<boolean> {
    try {
      const token = await AuthStorage.getAuthToken();

      if (!token) {
        return false;
      }

      if (!AuthStorage.isTokenValid(token)) {
        // Token expired, try to refresh
        try {
          await refreshToken();
          return true;
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get authentication status with user data
   */
  export async function getAuthStatus(): Promise<{
    readonly isAuthenticated: boolean;
    readonly user?: User;
    readonly tokenExpiresAt?: number;
  }> {
    try {
      const isAuth = await isAuthenticated();

      if (!isAuth) {
        return { isAuthenticated: false };
      }

      const user = await AuthStorage.getUserData();
      const token = await AuthStorage.getAuthToken();

      const result = {
        isAuthenticated: true as const,
        ...(user && { user }),
        ...(token?.expiresAt && { tokenExpiresAt: token.expiresAt }),
      };
      return result;
    } catch {
      return { isAuthenticated: false };
    }
  }
}
