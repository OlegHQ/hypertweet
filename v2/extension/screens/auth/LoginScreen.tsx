/**
 * Login screen component with authentication form
 * Handles user login with email/password validation and state management
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { AuthLayout } from './AuthLayout';

/**
 * Login form data interface
 */
export interface LoginFormData {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

/**
 * Login screen props interface
 */
export interface LoginScreenProps {
  readonly onLogin?: (data: LoginFormData) => Promise<void>;
  readonly onNavigateToRegister?: () => void;
  readonly onForgotPassword?: () => void;
  readonly className?: string;
  readonly loading?: boolean;
  readonly error?: string;
}

/**
 * Form container styles
 */
const formStyles = (theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
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
 * Checkbox container styles
 */
const checkboxContainerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Checkbox styles
 */
const checkboxStyles = (theme: ThemeType) => css`
  width: 16px;
  height: 16px;
  accent-color: ${theme.colors.interactive.primary};
  cursor: pointer;

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Checkbox label styles
 */
const checkboxLabelStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  cursor: pointer;
  margin: 0;
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
 * Login screen component
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
  onForgotPassword,
  className,
  loading = false,
  error,
}) => {
  const theme = defaultTheme;
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const emailRef = useRef<HTMLInputElement>(null);

  // Auto-focus email field on mount
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors['email'] = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors['email'] = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      errors['password'] = 'Password is required';
    } else if (formData.password.length < 6) {
      errors['password'] = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (field: keyof LoginFormData, value: string | boolean) => {
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
        await onLogin?.(formData);
      } catch (err) {
        console.error('Login failed:', err);
      }
    },
    [formData, validateForm, loading, onLogin]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        void handleSubmit(e as React.FormEvent);
      }
    },
    [handleSubmit, loading]
  );

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your HyperTweet account"
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
            placeholder="Enter your password"
            disabled={loading}
            autoComplete="current-password"
            aria-describedby={
              validationErrors['password'] ? 'password-error' : undefined
            }
            aria-invalid={!!validationErrors['password']}
          />
          {validationErrors['password'] && (
            <p id="password-error" css={errorStyles(theme)} role="alert">
              {validationErrors['password']}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div css={checkboxContainerStyles(theme)}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={e => handleInputChange('rememberMe', e.target.checked)}
            css={checkboxStyles(theme)}
            disabled={loading}
          />
          <label css={checkboxLabelStyles(theme)} htmlFor="rememberMe">
            Keep me signed in
          </label>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {loading && (
            <div
              id="loading-status"
              className="sr-only"
              role="status"
              aria-live="polite"
            >
              Signing in, please wait...
            </div>
          )}

          {onForgotPassword && (
            <button
              type="button"
              css={linkStyles(theme)}
              onClick={onForgotPassword}
              disabled={loading}
            >
              Forgot your password?
            </button>
          )}

          {onNavigateToRegister && (
            <button
              type="button"
              css={linkStyles(theme)}
              onClick={onNavigateToRegister}
              disabled={loading}
            >
              Don't have an account? Sign up
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
};
