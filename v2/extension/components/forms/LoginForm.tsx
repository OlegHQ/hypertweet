/**
 * Login form component with validation, loading states, and authentication integration
 */

import React, { forwardRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import {
  Button,
  Input,
  Card,
  Alert,
  type ValidationState,
} from '../common/index.js';
import { AuthAPI } from '../../api/auth.js';
import { AuthError, AuthErrorCode } from '../../auth/types.js';
import { useForm, type FormSubmitHandler } from './hooks/useForm.js';
import {
  FieldValidation,
  FormValidation,
  type ValidationResult,
} from './validation.js';

/**
 * Login form data interface
 */
export interface LoginFormData extends Record<string, unknown> {
  readonly email: string;
  readonly password: string;
  readonly rememberMe: boolean;
}

/**
 * Login form props interface
 */
export interface LoginFormProps {
  readonly onLoginSuccess?: (user: { email: string; id: string }) => void;
  readonly onShowRegister?: () => void;
  readonly className?: string;
  readonly autoFocus?: boolean;
}

/**
 * Form container with proper spacing and layout
 */
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
  width: 100%;
  max-width: 400px;
`;

/**
 * Form fields container
 */
const FieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/**
 * Checkbox container with proper styling
 */
const CheckboxContainer = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  user-select: none;

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.interactive.primary};
    cursor: pointer;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

/**
 * Actions container with proper spacing
 */
const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/**
 * Link button styling for registration link
 */
const LinkButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: ${({ theme }) => theme.colors.interactive.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  text-decoration: underline;
  cursor: pointer;
  align-self: center;

  &:hover {
    color: ${({ theme }) => theme.colors.interactive.primaryHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

/**
 * Get user-friendly error message from AuthError
 */
function getErrorMessage(error: AuthError): string {
  switch (error.code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please check your credentials and try again.';
    case AuthErrorCode.ACCOUNT_LOCKED:
      return 'Your account has been locked. Please contact support for assistance.';
    case AuthErrorCode.EMAIL_NOT_VERIFIED:
      return 'Please verify your email address before logging in.';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many login attempts. Please wait a moment before trying again.';
    case AuthErrorCode.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    case AuthErrorCode.SERVER_ERROR:
      return 'Server error occurred. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred during login.';
  }
}

/**
 * Login form component with comprehensive functionality
 */
export const LoginForm = forwardRef<HTMLFormElement, LoginFormProps>(
  ({ onLoginSuccess, onShowRegister, className, autoFocus = false }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Form state management
    const [formState, formActions] = useForm<LoginFormData>({
      initialValues: {
        email: '',
        password: '',
        rememberMe: false,
      },
      validators: {
        email: (value: unknown): ValidationResult =>
          FieldValidation.validateEmail(value as string),
        password: (value: unknown): ValidationResult =>
          FieldValidation.validateRequired(value as string, 'Password'),
      },
      validateOnChange: false, // Only validate on blur and submit
      validateOnBlur: true,
      onSubmit: useCallback<FormSubmitHandler<LoginFormData>>(
        async values => {
          try {
            // Validate form data
            const validationResult = FormValidation.validateLoginForm(
              values.email,
              values.password
            );
            if (!validationResult.isValid) {
              throw new Error(validationResult.errors[0]);
            }

            // Attempt login via API
            const response = await AuthAPI.login(
              values.email,
              values.password,
              values.rememberMe
            );

            if (response.success && response.user) {
              // Login successful
              onLoginSuccess?.(response.user);
            } else if (response.error) {
              // Login failed with error
              throw response.error;
            } else {
              // Unexpected response format
              throw new Error('Login failed: Invalid response from server');
            }
          } catch (error) {
            // Handle different types of errors
            if (error && typeof error === 'object' && 'code' in error) {
              // AuthError
              throw new Error(getErrorMessage(error as AuthError));
            } else if (error instanceof Error) {
              throw error;
            } else {
              throw new Error('An unexpected error occurred during login');
            }
          }
        },
        [onLoginSuccess]
      ),
    });

    // Get field properties for easier form binding
    const emailProps = formActions.getFieldProps('email');
    const passwordProps = formActions.getFieldProps('password');
    const rememberMeProps = formActions.getFieldProps('rememberMe');

    // Toggle password visibility
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    // Handle registration link click
    const handleShowRegister = useCallback(() => {
      onShowRegister?.();
    }, [onShowRegister]);

    // Convert form validation state to component validation state
    const getValidationState = (
      error?: string,
      touched?: boolean
    ): ValidationState => {
      if (!touched) return 'default';
      return error ? 'error' : 'success';
    };

    // Handle form submission with proper Promise handling
    const handleFormSubmit = useCallback(
      (e: React.FormEvent<HTMLFormElement>): void => {
        void formActions.handleSubmit(e);
      },
      [formActions.handleSubmit]
    );

    return (
      <Card variant="bordered" size="md" className={className}>
        <FormContainer ref={ref} onSubmit={handleFormSubmit} noValidate>
          <FieldsContainer>
            {/* Email field */}
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email address"
              value={emailProps.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                emailProps.onChange(e.target.value)
              }
              onBlur={emailProps.onBlur}
              validationState={getValidationState(
                emailProps.error,
                emailProps.touched
              )}
              {...(emailProps.error && { errorMessage: emailProps.error })}
              required
              autoFocus={autoFocus}
              disabled={formState.isSubmitting}
              aria-describedby="email-help"
            />

            {/* Password field */}
            <div style={{ position: 'relative' }}>
              <Input
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                value={passwordProps.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  passwordProps.onChange(e.target.value)
                }
                onBlur={passwordProps.onBlur}
                validationState={getValidationState(
                  passwordProps.error,
                  passwordProps.touched
                )}
                {...(passwordProps.error && {
                  errorMessage: passwordProps.error,
                })}
                required
                disabled={formState.isSubmitting}
                aria-describedby="password-help"
              />

              {/* Password visibility toggle button */}
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '32px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: 'inherit',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={formState.isSubmitting}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>

            {/* Remember me checkbox */}
            <CheckboxContainer>
              <input
                type="checkbox"
                checked={rememberMeProps.value}
                onChange={e => rememberMeProps.onChange(e.target.checked)}
                disabled={formState.isSubmitting}
                aria-describedby="remember-me-help"
              />
              Keep me signed in
            </CheckboxContainer>
          </FieldsContainer>

          {/* Submit error display */}
          {formState.submitError && (
            <Alert
              status="error"
              title="Login Failed"
              description={formState.submitError}
              variant="subtle"
              size="sm"
            />
          )}

          {/* Success message */}
          {formState.submitSuccess && (
            <Alert
              status="success"
              title="Login Successful"
              description="Welcome back! You have been successfully logged in."
              variant="subtle"
              size="sm"
            />
          )}

          <ActionsContainer>
            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={formState.isSubmitting}
              disabled={formState.isSubmitting || !formState.isValid}
            >
              {formState.isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            {/* Registration link */}
            {onShowRegister && (
              <LinkButton
                type="button"
                onClick={handleShowRegister}
                disabled={formState.isSubmitting}
              >
                Don't have an account? Sign up
              </LinkButton>
            )}
          </ActionsContainer>
        </FormContainer>
      </Card>
    );
  }
);

// Set display name for debugging
LoginForm.displayName = 'LoginForm';
