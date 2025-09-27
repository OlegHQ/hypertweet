/**
 * Registration screen component with signup form
 * Handles user registration with email/password validation and terms acceptance
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { AuthLayout } from './AuthLayout';

/**
 * Registration form data interface
 */
export interface RegisterFormData {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly acceptTerms: boolean;
}

/**
 * Registration screen props interface
 */
export interface RegisterScreenProps {
  readonly onRegister?: (data: RegisterFormData) => Promise<void>;
  readonly onNavigateToLogin?: () => void;
  readonly onViewTerms?: () => void;
  readonly onViewPrivacy?: () => void;
  readonly className?: string;
  readonly loading?: boolean;
  readonly error?: string;
  readonly success?: boolean;
}

/**
 * Password strength levels
 */
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Form container styles
 */
const formStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[5]};
`;

/**
 * Input group styles
 */
const inputGroupStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

/**
 * Label styles
 */
const labelStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Input field styles
 */
const inputStyles = (theme: ThemeType, hasError: boolean) => css`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  border: 1px solid
    ${hasError ? theme.colors.status.error : theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.primary};
  background-color: ${theme.colors.background.primary};
  transition: all 0.2s ease-in-out;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${theme.colors.interactive.primary};
    box-shadow: 0 0 0 3px ${theme.colors.interactive.primary}20;
  }

  &:disabled {
    background-color: ${theme.colors.background.secondary};
    color: ${theme.colors.text.tertiary};
    cursor: not-allowed;
  }

  &::placeholder {
    color: ${theme.colors.text.tertiary};
  }
`;

/**
 * Password strength indicator styles
 */
const strengthIndicatorStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

/**
 * Strength bar container styles
 */
const strengthBarContainerStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[1]};
  margin-top: ${theme.spacing[1]};
`;

/**
 * Strength bar segment styles
 */
const strengthBarSegmentStyles = (
  theme: ThemeType,
  strength: PasswordStrength,
  _index: number,
  isActive: boolean
) => css`
  height: 4px;
  flex: 1;
  border-radius: 2px;
  transition: background-color 0.2s ease-in-out;

  background-color: ${!isActive
    ? theme.colors.background.secondary
    : strength === 'weak'
      ? theme.colors.status.error
      : strength === 'fair'
        ? '#ff9800' // Orange
        : strength === 'good'
          ? '#2196f3' // Blue
          : theme.colors.status.success};
`;

/**
 * Strength text styles
 */
const strengthTextStyles = (
  theme: ThemeType,
  strength: PasswordStrength
) => css`
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${strength === 'weak'
    ? theme.colors.status.error
    : strength === 'fair'
      ? '#ff9800'
      : strength === 'good'
        ? '#2196f3'
        : theme.colors.status.success};
`;

/**
 * Checkbox container styles
 */
const checkboxContainerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing[2]};
  margin-top: ${theme.spacing[2]};
`;

/**
 * Checkbox styles
 */
const checkboxStyles = (theme: ThemeType) => css`
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: ${theme.colors.interactive.primary};
  cursor: pointer;
  flex-shrink: 0;

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Terms text styles
 */
const termsTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  line-height: ${theme.typography.lineHeight.relaxed};
  margin: 0;
`;

/**
 * Terms link styles
 */
const termsLinkStyles = (theme: ThemeType) => css`
  color: ${theme.colors.interactive.primary};
  text-decoration: none;

  &:hover {
    color: ${theme.colors.interactive.primaryHover};
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 1px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * Button styles
 */
const buttonStyles = (
  theme: ThemeType,
  variant: 'primary' | 'secondary',
  disabled: boolean
) => css`
  padding: ${theme.spacing[3]} ${theme.spacing[6]};
  border: 1px solid
    ${variant === 'primary' ? 'transparent' : theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.medium};
  cursor: ${disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  text-decoration: none;

  background-color: ${variant === 'primary'
    ? disabled
      ? theme.colors.interactive.primaryDisabled
      : theme.colors.interactive.primary
    : theme.colors.background.primary};

  color: ${variant === 'primary'
    ? theme.colors.text.inverse
    : theme.colors.text.primary};

  &:hover:not(:disabled) {
    background-color: ${variant === 'primary'
      ? theme.colors.interactive.primaryHover
      : theme.colors.background.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
  }
`;

/**
 * Loading spinner styles
 */
const spinnerStyles = () => css`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Error message styles
 */
const errorStyles = (theme: ThemeType) => css`
  color: ${theme.colors.status.error};
  font-size: ${theme.typography.fontSize.sm};
  margin: 0;
  padding: ${theme.spacing[2]} 0;
`;

/**
 * Success message styles
 */
const successStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.status.successBackground};
  border: 1px solid ${theme.colors.status.success};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  margin: ${theme.spacing[4]} 0;
  text-align: center;
`;

/**
 * Success title styles
 */
const successTitleStyles = (theme: ThemeType) => css`
  color: ${theme.colors.status.success};
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  margin: 0 0 ${theme.spacing[2]} 0;
`;

/**
 * Link styles
 */
const linkStyles = (theme: ThemeType) => css`
  color: ${theme.colors.interactive.primary};
  text-decoration: none;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  text-align: center;

  &:hover {
    color: ${theme.colors.interactive.primaryHover};
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * Actions container styles
 */
const actionsStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[2]};
`;

/**
 * Email validation function
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength analysis function
 */
const analyzePasswordStrength = (
  password: string
): { strength: PasswordStrength; score: number } => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  let strength: PasswordStrength;
  if (score <= 2) strength = 'weak';
  else if (score <= 3) strength = 'fair';
  else if (score <= 4) strength = 'good';
  else strength = 'strong';

  return { strength, score };
};

/**
 * Registration screen component
 */
export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegister,
  onNavigateToLogin,
  onViewTerms,
  onViewPrivacy,
  className,
  loading = false,
  error,
  success = false,
}) => {
  const theme = defaultTheme;
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [passwordStrength, setPasswordStrength] = useState<{
    strength: PasswordStrength;
    score: number;
  }>({
    strength: 'weak',
    score: 0,
  });
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus email field on mount
  useEffect(() => {
    if (emailRef.current && !success) {
      emailRef.current.focus();
    }
  }, [success]);

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(analyzePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ strength: 'weak', score: 0 });
    }
  }, [formData.password]);

  const validateEmailField = useCallback((email: string): string | null => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!validateEmail(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }, []);

  const validatePasswordField = useCallback(
    (password: string): string | null => {
      if (!password.trim()) {
        return 'Password is required';
      }
      if (password.length < 8) {
        return 'Password must be at least 8 characters';
      }
      return null;
    },
    []
  );

  const validateConfirmPasswordField = useCallback(
    (password: string, confirmPassword: string): string | null => {
      if (!confirmPassword.trim()) {
        return 'Please confirm your password';
      }
      if (password !== confirmPassword) {
        return 'Passwords do not match';
      }
      return null;
    },
    []
  );

  const validateTermsField = useCallback(
    (acceptTerms: boolean): string | null => {
      if (!acceptTerms) {
        return 'You must accept the terms of service';
      }
      return null;
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    const emailError = validateEmailField(formData.email);
    if (emailError) errors['email'] = emailError;

    const passwordError = validatePasswordField(formData.password);
    if (passwordError) errors['password'] = passwordError;

    const confirmPasswordError = validateConfirmPasswordField(
      formData.password,
      formData.confirmPassword
    );
    if (confirmPasswordError) errors['confirmPassword'] = confirmPasswordError;

    const termsError = validateTermsField(formData.acceptTerms);
    if (termsError) errors['acceptTerms'] = termsError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    formData,
    validateEmailField,
    validatePasswordField,
    validateConfirmPasswordField,
    validateTermsField,
  ]);

  const handleInputChange = useCallback(
    (field: keyof RegisterFormData, value: string | boolean) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear validation error when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [validationErrors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm() || loading) {
        return;
      }

      try {
        await onRegister?.(formData);
      } catch (err) {
        console.error('Registration failed:', err);
      }
    },
    [formData, validateForm, loading, onRegister]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        void handleSubmit(e as React.FormEvent);
      }
    },
    [handleSubmit, loading]
  );

  if (success) {
    return (
      <AuthLayout
        title="Welcome to HyperTweet!"
        subtitle="Your account has been created successfully"
        {...(className && { className })}
      >
        <div css={successStyles(theme)}>
          <h3 css={successTitleStyles(theme)}>Account Created Successfully!</h3>
          <p css={{ color: theme.colors.text.secondary, margin: '0 0 16px 0' }}>
            Welcome to HyperTweet! You can now start using the extension to
            enhance your social media experience.
          </p>
          {onNavigateToLogin && (
            <button
              type="button"
              css={buttonStyles(theme, 'primary', false)}
              onClick={onNavigateToLogin}
            >
              Continue to Login
            </button>
          )}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join HyperTweet to enhance your social media experience"
      {...(className && { className })}
    >
      <form
        css={formStyles(theme)}
        onSubmit={e => void handleSubmit(e)}
        noValidate
      >
        {/* Email Field */}
        <div css={inputGroupStyles(theme)}>
          <label css={labelStyles(theme)} htmlFor="email">
            Email Address
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            value={formData.email}
            onChange={e => handleInputChange('email', e.target.value)}
            onKeyDown={handleKeyDown}
            css={inputStyles(theme, !!validationErrors['email'])}
            placeholder="Enter your email"
            disabled={loading}
            autoComplete="email"
            aria-describedby={
              validationErrors['email'] ? 'email-error' : undefined
            }
            aria-invalid={!!validationErrors['email']}
          />
          {validationErrors['email'] && (
            <p id="email-error" css={errorStyles(theme)} role="alert">
              {validationErrors['email']}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div css={inputGroupStyles(theme)}>
          <label css={labelStyles(theme)} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={e => handleInputChange('password', e.target.value)}
            onKeyDown={handleKeyDown}
            css={inputStyles(theme, !!validationErrors['password'])}
            placeholder="Create a secure password"
            disabled={loading}
            autoComplete="new-password"
            aria-describedby={`${validationErrors['password'] ? 'password-error' : ''} password-strength`}
            aria-invalid={!!validationErrors['password']}
          />
          {validationErrors['password'] && (
            <p id="password-error" css={errorStyles(theme)} role="alert">
              {validationErrors['password']}
            </p>
          )}

          {/* Password Strength Indicator */}
          {formData.password && (
            <div css={strengthIndicatorStyles(theme)} id="password-strength">
              <div
                css={strengthBarContainerStyles(theme)}
                role="progressbar"
                aria-valuenow={passwordStrength.score}
                aria-valuemax={6}
                aria-label={`Password strength: ${passwordStrength.strength}`}
              >
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    css={strengthBarSegmentStyles(
                      theme,
                      passwordStrength.strength,
                      index,
                      index < Math.ceil(passwordStrength.score / 1.5)
                    )}
                  />
                ))}
              </div>
              <p css={strengthTextStyles(theme, passwordStrength.strength)}>
                Password strength: {passwordStrength.strength}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div css={inputGroupStyles(theme)}>
          <label css={labelStyles(theme)} htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={e => handleInputChange('confirmPassword', e.target.value)}
            onKeyDown={handleKeyDown}
            css={inputStyles(theme, !!validationErrors['confirmPassword'])}
            placeholder="Confirm your password"
            disabled={loading}
            autoComplete="new-password"
            aria-describedby={
              validationErrors['confirmPassword']
                ? 'confirm-password-error'
                : undefined
            }
            aria-invalid={!!validationErrors['confirmPassword']}
          />
          {validationErrors['confirmPassword'] && (
            <p
              id="confirm-password-error"
              css={errorStyles(theme)}
              role="alert"
            >
              {validationErrors['confirmPassword']}
            </p>
          )}
        </div>

        {/* Terms Acceptance */}
        <div css={inputGroupStyles(theme)}>
          <div css={checkboxContainerStyles(theme)}>
            <input
              id="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={e => handleInputChange('acceptTerms', e.target.checked)}
              css={checkboxStyles(theme)}
              disabled={loading}
              aria-describedby={
                validationErrors['acceptTerms'] ? 'terms-error' : undefined
              }
              aria-invalid={!!validationErrors['acceptTerms']}
            />
            <label css={termsTextStyles(theme)} htmlFor="acceptTerms">
              I agree to the{' '}
              <button
                type="button"
                css={termsLinkStyles(theme)}
                onClick={e => {
                  e.preventDefault();
                  onViewTerms?.();
                }}
                disabled={loading}
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                css={termsLinkStyles(theme)}
                onClick={e => {
                  e.preventDefault();
                  onViewPrivacy?.();
                }}
                disabled={loading}
              >
                Privacy Policy
              </button>
            </label>
          </div>
          {validationErrors['acceptTerms'] && (
            <p id="terms-error" css={errorStyles(theme)} role="alert">
              {validationErrors['acceptTerms']}
            </p>
          )}
        </div>

        {/* Auth Error */}
        {error && (
          <p css={errorStyles(theme)} role="alert">
            {error}
          </p>
        )}

        {/* Actions */}
        <div css={actionsStyles(theme)}>
          <button
            type="submit"
            css={buttonStyles(theme, 'primary', loading)}
            disabled={loading}
            aria-describedby={loading ? 'loading-status' : undefined}
          >
            {loading && <div css={spinnerStyles()} aria-hidden="true" />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {loading && (
            <div
              id="loading-status"
              className="sr-only"
              role="status"
              aria-live="polite"
            >
              Creating account, please wait...
            </div>
          )}

          {onNavigateToLogin && (
            <button
              type="button"
              css={linkStyles(theme)}
              onClick={onNavigateToLogin}
              disabled={loading}
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};
