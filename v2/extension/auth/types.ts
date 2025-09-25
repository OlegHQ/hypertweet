/**
 * Authentication types and interfaces for Chrome extension
 */

/**
 * JWT token payload interface based on standard claims
 */
export interface JWTPayload {
  readonly sub: string; // Subject (user ID)
  readonly email: string; // User email
  readonly exp: number; // Expiration timestamp
  readonly iat: number; // Issued at timestamp
  readonly jti?: string | undefined; // JWT ID (optional)
}

/**
 * Raw JWT token structure
 */
export interface JWTToken {
  readonly token: string;
  readonly expiresAt: number; // Parsed expiration timestamp
  readonly issuedAt: number; // Parsed issued at timestamp
}

/**
 * User profile information
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly avatar?: string;
  readonly createdAt: string; // ISO date string
  readonly emailVerified: boolean;
  readonly isActive: boolean;
}

/**
 * Authentication state discriminated union
 */
export type AuthState =
  | { readonly status: 'unauthenticated' }
  | { readonly status: 'loading' }
  | {
      readonly status: 'authenticated';
      readonly user: User;
      readonly token: JWTToken;
    }
  | { readonly status: 'error'; readonly error: AuthError };

/**
 * Authentication error types
 */
export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Comprehensive authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Login request payload
 */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

/**
 * Login response from API
 */
export interface LoginResponse {
  readonly success: boolean;
  readonly token?: string;
  readonly user?: User;
  readonly error?: AuthError;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly name?: string;
  readonly acceptTerms: boolean;
}

/**
 * Registration response from API
 */
export interface RegisterResponse {
  readonly success: boolean;
  readonly user?: User;
  readonly requiresVerification?: boolean;
  readonly error?: AuthError;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  readonly success: boolean;
  readonly token?: string;
  readonly error?: AuthError;
}

/**
 * Chrome storage keys for authentication data
 */
export enum StorageKey {
  AUTH_TOKEN = 'auth_token',
  USER_DATA = 'user_data',
  REFRESH_TOKEN = 'refresh_token',
  AUTH_STATE = 'auth_state',
}

/**
 * Storage data structure for persisted auth token
 */
export interface StoredAuthData {
  readonly token: string;
  readonly expiresAt: number;
  readonly user: User;
  readonly storedAt: number; // When stored in storage
}

/**
 * Validation result discriminated union
 */
export type ValidationResult<T = unknown> =
  | { readonly isValid: true; readonly data: T }
  | { readonly isValid: false; readonly error: AuthError };

/**
 * Email validation result
 */
export type EmailValidationResult = ValidationResult<string>;

/**
 * Password validation result with strength info
 */
export type PasswordValidationResult =
  | {
      readonly isValid: true;
      readonly data: string;
      readonly strength?: 'weak' | 'medium' | 'strong' | undefined;
      readonly suggestions?: readonly string[] | undefined;
    }
  | {
      readonly isValid: false;
      readonly error: AuthError;
      readonly strength?: 'weak' | 'medium' | 'strong' | undefined;
      readonly suggestions?: readonly string[] | undefined;
    };

/**
 * Token validation result with parsed payload
 */
export type TokenValidationResult = ValidationResult<JWTPayload>;
