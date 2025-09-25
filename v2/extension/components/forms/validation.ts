/**
 * Form validation utilities with comprehensive validation rules
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

/**
 * Password strength levels
 */
export enum PasswordStrength {
  VERY_WEAK = 'very-weak',
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Password strength analysis result
 */
export interface PasswordStrengthResult {
  readonly strength: PasswordStrength;
  readonly score: number; // 0-100
  readonly feedback: readonly string[];
}

/**
 * Form field validation namespace
 */
export namespace FieldValidation {
  /**
   * Validate email address format
   */
  export function validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }

    // RFC 5322 compliant email regex (simplified but comprehensive)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
    }

    if (trimmedEmail.length > 254) {
      errors.push('Email address is too long');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate password with comprehensive strength checking
   */
  export function validatePassword(
    password: string,
    minLength = 8
  ): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > 128) {
      errors.push('Password is too long (maximum 128 characters)');
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const commonPatterns = [
      /(.)\1{2,}/, // Three or more repeated characters
      /123|234|345|456|567|678|789|890/, // Sequential numbers
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common weak patterns');
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate password confirmation
   */
  export function validatePasswordConfirmation(
    password: string,
    confirmation: string
  ): ValidationResult {
    const errors: string[] = [];

    if (!confirmation) {
      errors.push('Password confirmation is required');
      return { isValid: false, errors };
    }

    if (password !== confirmation) {
      errors.push('Passwords do not match');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate required field
   */
  export function validateRequired(
    value: string,
    fieldName: string
  ): ValidationResult {
    const errors: string[] = [];
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      errors.push(`${fieldName} is required`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate name field
   */
  export function validateName(name: string): ValidationResult {
    const errors: string[] = [];
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.push('Name is required');
      return { isValid: false, errors };
    }

    if (trimmedName.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (trimmedName.length > 50) {
      errors.push('Name is too long (maximum 50 characters)');
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    if (!/^[a-zA-Z\s'-]+$/.test(trimmedName)) {
      errors.push(
        'Name can only contain letters, spaces, hyphens, and apostrophes'
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Analyze password strength
   */
  export function analyzePasswordStrength(
    password: string
  ): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Length scoring
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('Use at least 8 characters');
    }

    if (password.length >= 12) {
      score += 10;
    }

    if (password.length >= 16) {
      score += 10;
    }

    // Character variety scoring
    if (/[a-z]/.test(password)) {
      score += 10;
    } else {
      feedback.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 10;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 10;
    } else {
      feedback.push('Add numbers');
    }

    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      score += 15;
    } else {
      feedback.push('Add special characters (!@#$%^&*)');
    }

    // Unique character bonus
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10;
    }

    // Pattern penalties
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeating characters');
    }

    if (/123|234|345|456|567|678|789|890|abc|bcd|cde/i.test(password)) {
      score -= 15;
      feedback.push('Avoid common sequences');
    }

    // Common passwords penalty
    const commonPasswords = [
      'password',
      '123456',
      'qwerty',
      'admin',
      'welcome',
      'login',
      'master',
      'hello',
      'guest',
      'user',
    ];

    if (
      commonPasswords.some(common => password.toLowerCase().includes(common))
    ) {
      score -= 20;
      feedback.push('Avoid common passwords or words');
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strength: PasswordStrength;
    if (score < 20) {
      strength = PasswordStrength.VERY_WEAK;
    } else if (score < 40) {
      strength = PasswordStrength.WEAK;
    } else if (score < 60) {
      strength = PasswordStrength.FAIR;
    } else if (score < 80) {
      strength = PasswordStrength.GOOD;
    } else {
      strength = PasswordStrength.STRONG;
    }

    return { strength, score, feedback };
  }
}

/**
 * Form validation namespace for complete forms
 */
export namespace FormValidation {
  /**
   * Login form validation
   */
  export function validateLoginForm(
    email: string,
    password: string
  ): ValidationResult {
    const errors: string[] = [];

    const emailResult = FieldValidation.validateEmail(email);
    const passwordResult = FieldValidation.validateRequired(
      password,
      'Password'
    );

    errors.push(...emailResult.errors);
    errors.push(...passwordResult.errors);

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Registration form validation
   */
  export function validateRegistrationForm(
    email: string,
    password: string,
    passwordConfirmation: string,
    termsAccepted: boolean
  ): ValidationResult {
    const errors: string[] = [];

    const emailResult = FieldValidation.validateEmail(email);
    const passwordResult = FieldValidation.validatePassword(password);
    const confirmationResult = FieldValidation.validatePasswordConfirmation(
      password,
      passwordConfirmation
    );

    errors.push(...emailResult.errors);
    errors.push(...passwordResult.errors);
    errors.push(...confirmationResult.errors);

    if (!termsAccepted) {
      errors.push('You must accept the terms of service');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Password change form validation
   */
  export function validatePasswordChangeForm(
    currentPassword: string,
    newPassword: string,
    passwordConfirmation: string
  ): ValidationResult {
    const errors: string[] = [];

    const currentPasswordResult = FieldValidation.validateRequired(
      currentPassword,
      'Current password'
    );
    const newPasswordResult = FieldValidation.validatePassword(newPassword);
    const confirmationResult = FieldValidation.validatePasswordConfirmation(
      newPassword,
      passwordConfirmation
    );

    errors.push(...currentPasswordResult.errors);
    errors.push(...newPasswordResult.errors);
    errors.push(...confirmationResult.errors);

    if (currentPassword === newPassword) {
      errors.push('New password must be different from current password');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Profile edit form validation
   */
  export function validateProfileForm(
    name: string,
    email: string,
    bio?: string
  ): ValidationResult {
    const errors: string[] = [];

    const nameResult = FieldValidation.validateName(name);
    const emailResult = FieldValidation.validateEmail(email);

    errors.push(...nameResult.errors);
    errors.push(...emailResult.errors);

    if (bio && bio.length > 500) {
      errors.push('Bio is too long (maximum 500 characters)');
    }

    return { isValid: errors.length === 0, errors };
  }
}
