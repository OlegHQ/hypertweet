/**
 * Form Components Library
 *
 * Comprehensive set of form components with validation, state management,
 * and authentication integration for the Chrome extension.
 */

// Form Components
export {
  LoginForm,
  type LoginFormProps,
  type LoginFormData,
} from './LoginForm.js';

export {
  RegisterForm,
  type RegisterFormProps,
  type RegisterFormData,
} from './RegisterForm.js';

export {
  PasswordChangeForm,
  type PasswordChangeFormProps,
  type PasswordChangeFormData,
} from './PasswordChangeForm.js';

export {
  ProfileEditForm,
  type ProfileEditFormProps,
  type ProfileEditFormData,
} from './ProfileEditForm.js';

// Form State Management Hook
export {
  useForm,
  useDebounce,
  type FormField,
  type FormState,
  type FormActions,
  type FormValidators,
  type FormOptions,
  type FormSubmitHandler,
  type FormHookReturn,
  type FieldValidator,
} from './hooks/useForm.js';

// Validation Utilities
export {
  FieldValidation,
  FormValidation,
  PasswordStrength,
  type ValidationResult,
  type PasswordStrengthResult,
} from './validation.js';
