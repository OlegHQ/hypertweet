/**
 * Registration form component with validation, password strength, and terms acceptance
 */

import React, { forwardRef, useState, useCallback, useMemo } from 'react';
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
import {
  useForm,
  useDebounce,
  type FormSubmitHandler,
} from './hooks/useForm.js';
import {
  FieldValidation,
  FormValidation,
  PasswordStrength,
  type PasswordStrengthResult,
  type ValidationResult,
} from './validation.js';

/**
 * Registration form data interface
 */
export interface RegisterFormData extends Record<string, unknown> {
  readonly email: string;
  readonly password: string;
  readonly passwordConfirmation: string;
  readonly termsAccepted: boolean;
}

/**
 * Registration form props interface
 */
export interface RegisterFormProps {
  readonly onRegisterSuccess?: (user: { email: string; id: string }) => void;
  readonly onShowLogin?: () => void;
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
 * Password strength indicator container
 */
const PasswordStrengthContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
`;

/**
 * Password strength bar
 */
const PasswordStrengthBar = styled.div<{ readonly strength: PasswordStrength }>`
  height: 4px;
  border-radius: 2px;
  margin-bottom: ${({ theme }) => theme.spacing[2]};
  background-color: ${({ strength, theme }) => {
    switch (strength) {
      case PasswordStrength.VERY_WEAK:
        return theme.colors.status.error;
      case PasswordStrength.WEAK:
        return '#FF6B6B';
      case PasswordStrength.FAIR:
        return theme.colors.status.warning;
      case PasswordStrength.GOOD:
        return '#4ECDC4';
      case PasswordStrength.STRONG:
        return theme.colors.status.success;
      default:
        return theme.colors.border.primary;
    }
  }};

  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
`;

/**
 * Password strength text
 */
const PasswordStrengthText = styled.div<{
  readonly strength: PasswordStrength;
}>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ strength, theme }) => {
    switch (strength) {
      case PasswordStrength.VERY_WEAK:
      case PasswordStrength.WEAK:
        return theme.colors.status.error;
      case PasswordStrength.FAIR:
        return theme.colors.status.warning;
      case PasswordStrength.GOOD:
      case PasswordStrength.STRONG:
        return theme.colors.status.success;
      default:
        return theme.colors.text.secondary;
    }
  }};
  text-transform: capitalize;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Password feedback list
 */
const PasswordFeedback = styled.ul`
  margin: 0;
  padding-left: ${({ theme }) => theme.spacing[4]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

/**
 * Checkbox container with proper styling
 */
const CheckboxContainer = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  user-select: none;
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};

  input[type='checkbox'] {
    width: 16px;
    height: 16px;
    margin: 0;
    margin-top: 2px;
    accent-color: ${({ theme }) => theme.colors.interactive.primary};
    cursor: pointer;
    flex-shrink: 0;
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
 * Link button styling for login link
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
      return 'Invalid registration data. Please check your information and try again.';
    case AuthErrorCode.USER_NOT_FOUND:
      return 'Email address is already registered. Please use a different email or sign in instead.';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many registration attempts. Please wait a moment before trying again.';
    case AuthErrorCode.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    case AuthErrorCode.SERVER_ERROR:
      return 'Server error occurred. Please try again later.';
    default:
      return (
        error.message || 'An unexpected error occurred during registration.'
      );
  }
}

/**
 * Registration form component with comprehensive functionality
 */
export const RegisterForm = forwardRef<HTMLFormElement, RegisterFormProps>(
  ({ onRegisterSuccess, onShowLogin, className, autoFocus = false }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
      useState(false);

    // Form state management
    const [formState, formActions] = useForm<RegisterFormData>({
      initialValues: {
        email: '',
        password: '',
        passwordConfirmation: '',
        termsAccepted: false,
      },
      validators: {
        email: (value: unknown): ValidationResult =>
          FieldValidation.validateEmail(value as string),
        password: (value: unknown): ValidationResult =>
          FieldValidation.validatePassword(value as string),
        passwordConfirmation: (value: unknown): ValidationResult =>
          FieldValidation.validatePasswordConfirmation(
            formState.fields.password.value,
            value as string
          ),
        termsAccepted: (value: unknown): ValidationResult => ({
          isValid: value as boolean,
          errors: (value as boolean)
            ? []
            : ['You must accept the terms of service'],
        }),
      },
      validateOnChange: false, // Only validate on blur and submit for better UX
      validateOnBlur: true,
      onSubmit: useCallback<FormSubmitHandler<RegisterFormData>>(
        async values => {
          try {
            // Validate form data
            const validationResult = FormValidation.validateRegistrationForm(
              values.email,
              values.password,
              values.passwordConfirmation,
              values.termsAccepted
            );
            if (!validationResult.isValid) {
              throw new Error(validationResult.errors[0]);
            }

            // Attempt registration via API
            const response = await AuthAPI.register(
              values.email,
              values.password
            );

            if (response.success && response.user) {
              // Registration successful
              onRegisterSuccess?.(response.user);
            } else if (response.error) {
              // Registration failed with error
              throw response.error;
            } else {
              // Unexpected response format
              throw new Error(
                'Registration failed: Invalid response from server'
              );
            }
          } catch (error) {
            // Handle different types of errors
            if (error && typeof error === 'object' && 'code' in error) {
              // AuthError
              throw new Error(getErrorMessage(error as AuthError));
            } else if (error instanceof Error) {
              throw error;
            } else {
              throw new Error(
                'An unexpected error occurred during registration'
              );
            }
          }
        },
        [onRegisterSuccess]
      ),
    });

    // Get field properties for easier form binding
    const emailProps = formActions.getFieldProps('email');
    const passwordProps = formActions.getFieldProps('password');
    const passwordConfirmationProps = formActions.getFieldProps(
      'passwordConfirmation'
    );
    const termsAcceptedProps = formActions.getFieldProps('termsAccepted');

    // Debounce password for strength analysis to avoid excessive calculations
    const debouncedPassword = useDebounce(passwordProps.value, 300);

    // Calculate password strength
    const passwordStrength: PasswordStrengthResult = useMemo(() => {
      if (!debouncedPassword) {
        return {
          strength: PasswordStrength.VERY_WEAK,
          score: 0,
          feedback: [],
        };
      }
      return FieldValidation.analyzePasswordStrength(debouncedPassword);
    }, [debouncedPassword]);

    // Toggle password visibility
    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev);
    }, []);

    const togglePasswordConfirmationVisibility = useCallback(() => {
      setShowPasswordConfirmation(prev => !prev);
    }, []);

    // Handle login link click
    const handleShowLogin = useCallback(() => {
      onShowLogin?.();
    }, [onShowLogin]);

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

            {/* Password field with strength indicator */}
            <div>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  placeholder="Create a strong password"
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
                  aria-describedby="password-help password-strength"
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

              {/* Password strength indicator */}
              {passwordProps.value && (
                <PasswordStrengthContainer id="password-strength">
                  <PasswordStrengthBar strength={passwordStrength.strength} />
                  <PasswordStrengthText strength={passwordStrength.strength}>
                    {passwordStrength.strength.replace('-', ' ')} (
                    {passwordStrength.score}/100)
                  </PasswordStrengthText>
                  {passwordStrength.feedback.length > 0 && (
                    <PasswordFeedback>
                      {passwordStrength.feedback.map((feedback, index) => (
                        <li key={index}>{feedback}</li>
                      ))}
                    </PasswordFeedback>
                  )}
                </PasswordStrengthContainer>
              )}
            </div>

            {/* Password confirmation field */}
            <div style={{ position: 'relative' }}>
              <Input
                type={showPasswordConfirmation ? 'text' : 'password'}
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={passwordConfirmationProps.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  passwordConfirmationProps.onChange(e.target.value)
                }
                onBlur={passwordConfirmationProps.onBlur}
                validationState={getValidationState(
                  passwordConfirmationProps.error,
                  passwordConfirmationProps.touched
                )}
                {...(passwordConfirmationProps.error && {
                  errorMessage: passwordConfirmationProps.error,
                })}
                required
                disabled={formState.isSubmitting}
                aria-describedby="password-confirmation-help"
              />

              {/* Password visibility toggle button */}
              <button
                type="button"
                onClick={togglePasswordConfirmationVisibility}
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
                aria-label={
                  showPasswordConfirmation
                    ? 'Hide password confirmation'
                    : 'Show password confirmation'
                }
                disabled={formState.isSubmitting}
              >
                {showPasswordConfirmation ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>

            {/* Terms of service acceptance checkbox */}
            <CheckboxContainer>
              <input
                type="checkbox"
                checked={termsAcceptedProps.value}
                onChange={e => termsAcceptedProps.onChange(e.target.checked)}
                disabled={formState.isSubmitting}
                aria-describedby="terms-help"
              />
              <span>
                I agree to the{' '}
                <a
                  href="#terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Privacy Policy
                </a>
              </span>
            </CheckboxContainer>
          </FieldsContainer>

          {/* Submit error display */}
          {formState.submitError && (
            <Alert
              status="error"
              title="Registration Failed"
              description={formState.submitError}
              variant="subtle"
              size="sm"
            />
          )}

          {/* Success message */}
          {formState.submitSuccess && (
            <Alert
              status="success"
              title="Registration Successful"
              description="Welcome! Your account has been created successfully. Please check your email for verification instructions."
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
              {formState.isSubmitting
                ? 'Creating Account...'
                : 'Create Account'}
            </Button>

            {/* Login link */}
            {onShowLogin && (
              <LinkButton
                type="button"
                onClick={handleShowLogin}
                disabled={formState.isSubmitting}
              >
                Already have an account? Sign in
              </LinkButton>
            )}
          </ActionsContainer>
        </FormContainer>
      </Card>
    );
  }
);

// Set display name for debugging
RegisterForm.displayName = 'RegisterForm';
