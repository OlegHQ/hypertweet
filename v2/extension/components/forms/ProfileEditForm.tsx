/**
 * Profile edit form component for updating user profile information
 */

import React, { forwardRef, useCallback } from 'react';
import styled from '@emotion/styled';
import {
  Button,
  Input,
  Card,
  Alert,
  type ValidationState,
} from '../common/index.js';
import { AuthError, AuthErrorCode } from '../../auth/types.js';
import { useForm, type FormSubmitHandler } from './hooks/useForm.js';
import {
  FieldValidation,
  FormValidation,
  type ValidationResult,
} from './validation.js';

/**
 * Profile edit form data interface
 */
export interface ProfileEditFormData extends Record<string, unknown> {
  readonly name: string;
  readonly email: string;
  readonly bio: string;
}

/**
 * Profile edit form props interface
 */
export interface ProfileEditFormProps {
  readonly initialData?: Partial<ProfileEditFormData>;
  readonly onProfileUpdateSuccess?: (
    updatedProfile: ProfileEditFormData
  ) => void;
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
  max-width: 500px;
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
 * Bio textarea styling
 */
const BioContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

/**
 * Character counter for bio field
 */
const CharacterCounter = styled.div<{ readonly isError: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ isError, theme }) =>
    isError ? theme.colors.status.error : theme.colors.text.secondary};
  text-align: right;
  margin-top: -${({ theme }) => theme.spacing[1]};
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
      return 'Invalid profile data. Please check your information and try again.';
    case AuthErrorCode.USER_NOT_FOUND:
      return 'User not found. Please try logging in again.';
    case AuthErrorCode.RATE_LIMITED:
      return 'Too many update attempts. Please wait a moment before trying again.';
    case AuthErrorCode.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection and try again.';
    case AuthErrorCode.SERVER_ERROR:
      return 'Server error occurred. Please try again later.';
    default:
      return (
        error.message ||
        'An unexpected error occurred while updating your profile.'
      );
  }
}

/**
 * Profile edit form component with comprehensive functionality
 */
export const ProfileEditForm = forwardRef<
  HTMLFormElement,
  ProfileEditFormProps
>(
  (
    { initialData, onProfileUpdateSuccess, className, autoFocus = false },
    ref
  ) => {
    // Form state management
    const [formState, formActions] = useForm<ProfileEditFormData>({
      initialValues: {
        name: initialData?.name ?? '',
        email: initialData?.email ?? '',
        bio: initialData?.bio ?? '',
      },
      validators: {
        name: (value: unknown): ValidationResult =>
          FieldValidation.validateName(value as string),
        email: (value: unknown): ValidationResult =>
          FieldValidation.validateEmail(value as string),
        bio: (value: unknown): ValidationResult => {
          const errors: string[] = [];
          const bioValue = value as string;

          // Bio is optional, but if provided must meet length requirements
          if (bioValue && bioValue.length > 500) {
            errors.push('Bio is too long (maximum 500 characters)');
          }

          return { isValid: errors.length === 0, errors };
        },
      },
      validateOnChange: false, // Only validate on blur and submit for better UX
      validateOnBlur: true,
      onSubmit: useCallback<FormSubmitHandler<ProfileEditFormData>>(
        values => {
          try {
            // Validate form data
            const validationResult = FormValidation.validateProfileForm(
              values.name,
              values.email,
              values.bio
            );
            if (!validationResult.isValid) {
              throw new Error(validationResult.errors[0]);
            }

            // Note: updateProfile method would need to be implemented in AuthAPI
            // For now, throwing an error to indicate this is not yet implemented
            throw new Error(
              'Profile update functionality not yet implemented in AuthAPI'
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
                'An unexpected error occurred while updating your profile'
              );
            }
          }
        },
        [onProfileUpdateSuccess]
      ),
    });

    // Get field properties for easier form binding
    const nameProps = formActions.getFieldProps('name');
    const emailProps = formActions.getFieldProps('email');
    const bioProps = formActions.getFieldProps('bio');

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

    // Check if bio exceeds character limit
    const bioCharCount = bioProps.value.length;
    const bioIsOverLimit = bioCharCount > 500;

    return (
      <Card variant="bordered" size="md" className={className}>
        <FormContainer ref={ref} onSubmit={handleFormSubmit} noValidate>
          <FieldsContainer>
            {/* Name field */}
            <Input
              type="text"
              label="Display Name"
              placeholder="Enter your display name"
              value={nameProps.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                nameProps.onChange(e.target.value)
              }
              onBlur={nameProps.onBlur}
              validationState={getValidationState(
                nameProps.error,
                nameProps.touched
              )}
              {...(nameProps.error && { errorMessage: nameProps.error })}
              required
              autoFocus={autoFocus}
              disabled={formState.isSubmitting}
              aria-describedby="name-help"
            />

            {/* Email field */}
            <Input
              type="email"
              label="Email Address"
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
              disabled={formState.isSubmitting}
              aria-describedby="email-help"
            />

            {/* Bio field */}
            <BioContainer>
              <Input
                type="textarea"
                label="Bio"
                placeholder="Tell us a bit about yourself (optional)"
                value={bioProps.value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  bioProps.onChange(e.target.value)
                }
                onBlur={bioProps.onBlur}
                validationState={getValidationState(
                  bioProps.error,
                  bioProps.touched
                )}
                {...(bioProps.error && { errorMessage: bioProps.error })}
                disabled={formState.isSubmitting}
                aria-describedby="bio-help bio-counter"
                rows={4}
              />
              <CharacterCounter id="bio-counter" isError={bioIsOverLimit}>
                {bioCharCount}/500 characters
              </CharacterCounter>
            </BioContainer>
          </FieldsContainer>

          {/* Submit error display */}
          {formState.submitError && (
            <Alert
              status="error"
              title="Profile Update Failed"
              description={formState.submitError}
              variant="subtle"
              size="sm"
            />
          )}

          {/* Success message */}
          {formState.submitSuccess && (
            <Alert
              status="success"
              title="Profile Updated"
              description="Your profile has been successfully updated. Changes may take a moment to appear across the application."
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
              disabled={
                formState.isSubmitting ||
                !formState.isValid ||
                !formState.isDirty
              }
            >
              {formState.isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>

            {/* Reset button */}
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              disabled={formState.isSubmitting || !formState.isDirty}
              onClick={formActions.reset}
            >
              Reset Changes
            </Button>
          </ActionsContainer>
        </FormContainer>
      </Card>
    );
  }
);

// Set display name for debugging
ProfileEditForm.displayName = 'ProfileEditForm';
