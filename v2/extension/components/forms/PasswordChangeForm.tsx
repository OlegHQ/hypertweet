/**
 * Password change form component with current password verification and new password validation
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
 * Password change form data interface
 */
export interface PasswordChangeFormData extends Record<string, unknown> {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly passwordConfirmation: string;
}

/**
 * Password change form props interface
 */
export interface PasswordChangeFormProps {
  readonly onPasswordChangeSuccess?: () => void;
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
 * Actions container with proper spacing
 */
const ActionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/**
 * Get user-friendly error message from AuthError
 */
function getErrorMessage(error: AuthError): string {
  switch (error.code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 'Current password is incorrect. Please try again.';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many password change attempts. Please wait a moment before trying again.';
    case AuthErrorCode.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    case AuthErrorCode.SERVER_ERROR:
      return 'Server error occurred. Please try again later.';
    default:
      return (
        error.message ||
        'An unexpected error occurred while changing your password.'
      );
  }
}

/**
 * Password change form component with comprehensive functionality
 */
export const PasswordChangeForm = forwardRef<
  HTMLFormElement,
  PasswordChangeFormProps
>(({ onPasswordChangeSuccess, className, autoFocus = false }, ref) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  // Form state management
  const [formState, formActions] = useForm<PasswordChangeFormData>({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      passwordConfirmation: '',
    },
    validators: {
      currentPassword: (value: unknown): ValidationResult =>
        FieldValidation.validateRequired(value as string, 'Current password'),
      newPassword: (value: unknown): ValidationResult =>
        FieldValidation.validatePassword(value as string),
      passwordConfirmation: (value: unknown): ValidationResult =>
        FieldValidation.validatePasswordConfirmation(
          formState.fields.newPassword.value,
          value as string
        ),
    },
    validateOnChange: false, // Only validate on blur and submit for better UX
    validateOnBlur: true,
    onSubmit: useCallback<FormSubmitHandler<PasswordChangeFormData>>(
      values => {
        try {
          // Validate form data
          const validationResult = FormValidation.validatePasswordChangeForm(
            values.currentPassword,
            values.newPassword,
            values.passwordConfirmation
          );
          if (!validationResult.isValid) {
            throw new Error(validationResult.errors[0]);
          }

          // Note: changePassword method would need to be implemented in AuthAPI
          // For now, throwing an error to indicate this is not yet implemented
          throw new Error(
            'Password change functionality not yet implemented in AuthAPI'
          );
        } catch (error) {
          // Handle different types of errors
          if (error && typeof error === 'object' && 'code' in error) {
            // AuthError
            throw new Error(getErrorMessage(error as AuthError));
          } else if (error instanceof Error) {
            throw error;
          } else {
            throw new Error(
              'An unexpected error occurred while changing your password'
            );
          }
        }
      },
      [onPasswordChangeSuccess]
    ),
  });

  // Get field properties for easier form binding
  const currentPasswordProps = formActions.getFieldProps('currentPassword');
  const newPasswordProps = formActions.getFieldProps('newPassword');
  const passwordConfirmationProps = formActions.getFieldProps(
    'passwordConfirmation'
  );

  // Debounce new password for strength analysis
  const debouncedNewPassword = useDebounce(newPasswordProps.value, 300);

  // Calculate password strength
  const passwordStrength: PasswordStrengthResult = useMemo(() => {
    if (!debouncedNewPassword) {
      return {
        strength: PasswordStrength.VERY_WEAK,
        score: 0,
        feedback: [],
      };
    }
    return FieldValidation.analyzePasswordStrength(debouncedNewPassword);
  }, [debouncedNewPassword]);

  // Toggle password visibility
  const toggleCurrentPasswordVisibility = useCallback(() => {
    setShowCurrentPassword(prev => !prev);
  }, []);

  const toggleNewPasswordVisibility = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);

  const togglePasswordConfirmationVisibility = useCallback(() => {
    setShowPasswordConfirmation(prev => !prev);
  }, []);

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
          {/* Current password field */}
          <div style={{ position: 'relative' }}>
            <Input
              type={showCurrentPassword ? 'text' : 'password'}
              label="Current Password"
              placeholder="Enter your current password"
              value={currentPasswordProps.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                currentPasswordProps.onChange(e.target.value)
              }
              onBlur={currentPasswordProps.onBlur}
              validationState={getValidationState(
                currentPasswordProps.error,
                currentPasswordProps.touched
              )}
              {...(currentPasswordProps.error && {
                errorMessage: currentPasswordProps.error,
              })}
              required
              autoFocus={autoFocus}
              disabled={formState.isSubmitting}
              aria-describedby="current-password-help"
            />

            {/* Current password visibility toggle button */}
            <button
              type="button"
              onClick={toggleCurrentPasswordVisibility}
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
                showCurrentPassword
                  ? 'Hide current password'
                  : 'Show current password'
              }
              disabled={formState.isSubmitting}
            >
              {showCurrentPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>

          {/* New password field with strength indicator */}
          <div>
            <div style={{ position: 'relative' }}>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                label="New Password"
                placeholder="Enter your new password"
                value={newPasswordProps.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  newPasswordProps.onChange(e.target.value)
                }
                onBlur={newPasswordProps.onBlur}
                validationState={getValidationState(
                  newPasswordProps.error,
                  newPasswordProps.touched
                )}
                {...(newPasswordProps.error && {
                  errorMessage: newPasswordProps.error,
                })}
                required
                disabled={formState.isSubmitting}
                aria-describedby="new-password-help new-password-strength"
              />

              {/* New password visibility toggle button */}
              <button
                type="button"
                onClick={toggleNewPasswordVisibility}
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
                  showNewPassword ? 'Hide new password' : 'Show new password'
                }
                disabled={formState.isSubmitting}
              >
                {showNewPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>

            {/* Password strength indicator */}
            {newPasswordProps.value && (
              <PasswordStrengthContainer id="new-password-strength">
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
              label="Confirm New Password"
              placeholder="Re-enter your new password"
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

            {/* Password confirmation visibility toggle button */}
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
        </FieldsContainer>

        {/* Submit error display */}
        {formState.submitError && (
          <Alert
            status="error"
            title="Password Change Failed"
            description={formState.submitError}
            variant="subtle"
            size="sm"
          />
        )}

        {/* Success message */}
        {formState.submitSuccess && (
          <Alert
            status="success"
            title="Password Changed"
            description="Your password has been successfully updated. Please use your new password for future logins."
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
              ? 'Changing Password...'
              : 'Change Password'}
          </Button>
        </ActionsContainer>
      </FormContainer>
    </Card>
  );
});

// Set display name for debugging
PasswordChangeForm.displayName = 'PasswordChangeForm';
