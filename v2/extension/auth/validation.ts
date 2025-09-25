/**
 * JWT validation utilities and form validation helpers
 */

import {
  JWTPayload,
  JWTToken,
  AuthError,
  AuthErrorCode,
  TokenValidationResult,
  EmailValidationResult,
  PasswordValidationResult,
} from './types.js';

/**
 * JWT validation utilities
 */
export namespace JWTValidator {
  const JWT_REGEX = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  /**
   * Parse and validate JWT token structure (client-side basic validation)
   */
  export function parseJWT(token: string): TokenValidationResult {
    try {
      if (!isValidJWTFormat(token)) {
        return {
          isValid: false,
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: 'Invalid JWT format',
            details: { reason: 'Token does not match JWT structure' },
          },
        };
      }

      const payload = extractPayload(token);

      if (!payload) {
        return {
          isValid: false,
          error: {
            code: AuthErrorCode.TOKEN_INVALID,
            message: 'Unable to parse JWT payload',
            details: { reason: 'Payload extraction failed' },
          },
        };
      }

      const validationError = validatePayloadStructure(payload);
      if (validationError) {
        return {
          isValid: false,
          error: validationError,
        };
      }

      return {
        isValid: true,
        data: payload,
      };
    } catch (error) {
      return {
        isValid: false,
        error: {
          code: AuthErrorCode.TOKEN_INVALID,
          message: 'JWT parsing failed',
          details: {
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        },
      };
    }
  }

  /**
   * Check if JWT token is expired
   */
  export function isTokenExpired(token: JWTToken | JWTPayload): boolean {
    const expiresAt = 'expiresAt' in token ? token.expiresAt : token.exp * 1000;
    return Date.now() >= expiresAt;
  }

  /**
   * Get time remaining until token expiration in milliseconds
   */
  export function getTimeToExpiration(token: JWTToken | JWTPayload): number {
    const expiresAt = 'expiresAt' in token ? token.expiresAt : token.exp * 1000;
    return Math.max(0, expiresAt - Date.now());
  }

  /**
   * Convert JWT payload to JWTToken structure
   */
  export function payloadToToken(
    payload: JWTPayload,
    originalToken: string
  ): JWTToken {
    return {
      token: originalToken,
      expiresAt: payload.exp * 1000,
      issuedAt: payload.iat * 1000,
    };
  }

  /**
   * Private helper: Check JWT format with regex
   */
  function isValidJWTFormat(token: string): boolean {
    return JWT_REGEX.test(token.trim());
  }

  /**
   * Private helper: Extract and decode JWT payload
   */
  function extractPayload(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      if (!payload) {
        return null;
      }

      // Add padding if needed for base64 decoding
      const paddedPayload = payload.padEnd(
        payload.length + ((4 - (payload.length % 4)) % 4),
        '='
      );

      const decodedPayload = atob(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload) as Record<
        string,
        unknown
      >;

      return validateAndCastPayload(parsedPayload);
    } catch {
      return null;
    }
  }

  /**
   * Private helper: Validate payload structure and cast to JWTPayload
   */
  function validateAndCastPayload(
    payload: Record<string, unknown>
  ): JWTPayload | null {
    const { sub, email, exp, iat, jti } = payload;

    if (
      typeof sub !== 'string' ||
      typeof email !== 'string' ||
      typeof exp !== 'number' ||
      typeof iat !== 'number' ||
      (jti !== undefined && typeof jti !== 'string')
    ) {
      return null;
    }

    return {
      sub,
      email,
      exp,
      iat,
      jti: typeof jti === 'string' ? jti : undefined,
    };
  }

  /**
   * Private helper: Validate payload structure for required fields
   */
  function validatePayloadStructure(payload: JWTPayload): AuthError | null {
    if (!payload.sub || payload.sub.trim().length === 0) {
      return {
        code: AuthErrorCode.TOKEN_INVALID,
        message: 'Invalid token: missing subject',
        details: { field: 'sub' },
      };
    }

    if (!payload.email || payload.email.trim().length === 0) {
      return {
        code: AuthErrorCode.TOKEN_INVALID,
        message: 'Invalid token: missing email',
        details: { field: 'email' },
      };
    }

    if (payload.exp <= 0 || payload.iat <= 0) {
      return {
        code: AuthErrorCode.TOKEN_INVALID,
        message: 'Invalid token: invalid timestamps',
        details: { exp: payload.exp, iat: payload.iat },
      };
    }

    if (payload.iat >= payload.exp) {
      return {
        code: AuthErrorCode.TOKEN_INVALID,
        message: 'Invalid token: issued time must be before expiration',
        details: { exp: payload.exp, iat: payload.iat },
      };
    }

    return null;
  }
}

/**
 * Email validation utilities
 */
export namespace EmailValidator {
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const MAX_EMAIL_LENGTH = 254;
  const MAX_LOCAL_LENGTH = 64;

  /**
   * Validate email format and structure
   */
  export function validateEmail(email: string): EmailValidationResult {
    const trimmedEmail = email.trim().toLowerCase();

    // Check basic format
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return {
        isValid: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid email format',
          details: { field: 'email', reason: 'Invalid format' },
        },
      };
    }

    // Check length constraints
    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return {
        isValid: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Email address too long',
          details: { field: 'email', maxLength: MAX_EMAIL_LENGTH },
        },
      };
    }

    // Check local part length (before @)
    const localPart = trimmedEmail.split('@')[0];
    if (localPart && localPart.length > MAX_LOCAL_LENGTH) {
      return {
        isValid: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: 'Email local part too long',
          details: { field: 'email', maxLocalLength: MAX_LOCAL_LENGTH },
        },
      };
    }

    return {
      isValid: true,
      data: trimmedEmail,
    };
  }
}

/**
 * Password validation utilities
 */
export namespace PasswordValidator {
  const MIN_LENGTH = 8;
  const MAX_LENGTH = 128;
  const COMMON_PASSWORDS = new Set([
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
  ]);

  /**
   * Validate password strength and requirements
   */
  export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Length check
    if (password.length < MIN_LENGTH) {
      errors.push(`Password must be at least ${MIN_LENGTH} characters`);
      suggestions.push('Use a longer password');
    }

    if (password.length > MAX_LENGTH) {
      errors.push(`Password must not exceed ${MAX_LENGTH} characters`);
    }

    // Character requirements
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password);

    if (!hasLower) {
      errors.push('Password must contain lowercase letters');
      suggestions.push('Add lowercase letters');
    }

    if (!hasUpper) {
      errors.push('Password must contain uppercase letters');
      suggestions.push('Add uppercase letters');
    }

    if (!hasNumber) {
      errors.push('Password must contain numbers');
      suggestions.push('Add numbers');
    }

    if (!hasSpecial) {
      errors.push('Password must contain special characters');
      suggestions.push('Add special characters (!@#$%^&*)');
    }

    // Common password check
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      errors.push('Password is too common');
      suggestions.push('Avoid common passwords');
    }

    // Sequential characters check
    if (hasSequentialChars(password)) {
      suggestions.push('Avoid sequential characters (123, abc)');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        error: {
          code: AuthErrorCode.INVALID_CREDENTIALS,
          message: errors[0] ?? 'Invalid password',
          details: {
            field: 'password',
            errors,
            suggestions,
          },
        },
        strength: calculateStrength(password),
        suggestions,
      };
    }

    return {
      isValid: true,
      data: password,
      strength: calculateStrength(password),
      suggestions:
        suggestions.length > 0 ? (suggestions as readonly string[]) : undefined,
    };
  }

  /**
   * Calculate password strength
   */
  function calculateStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) score += 1;

    // Bonus for no sequential characters
    if (!hasSequentialChars(password)) score += 1;

    // Penalty for common passwords
    if (COMMON_PASSWORDS.has(password.toLowerCase())) score -= 2;

    if (score >= 7) return 'strong';
    if (score >= 4) return 'medium';
    return 'weak';
  }

  /**
   * Check for sequential characters
   */
  function hasSequentialChars(password: string): boolean {
    const sequences = [
      '123',
      '234',
      '345',
      '456',
      '567',
      '678',
      '789',
      'abc',
      'bcd',
      'cde',
      'def',
      'efg',
      'fgh',
      'ghi',
    ];

    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }
}
