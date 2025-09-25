/**
 * Custom form state management hook with validation and submission handling
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ValidationResult } from '../validation.js';

/**
 * Form field configuration
 */
export interface FormField<T = string> {
  readonly value: T;
  readonly error?: string;
  readonly touched: boolean;
  readonly validated: boolean;
}

/**
 * Form state interface
 */
export interface FormState<T extends Record<string, unknown>> {
  readonly fields: { readonly [K in keyof T]: FormField<T[K]> };
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly isSubmitted: boolean;
  readonly isDirty: boolean;
  readonly submitError?: string | undefined;
  readonly submitSuccess?: boolean | undefined;
}

/**
 * Form field validator function
 */
export type FieldValidator<T = unknown> = (value: T) => ValidationResult;

/**
 * Form validators configuration
 */
export type FormValidators<T extends Record<string, unknown>> = {
  readonly [K in keyof T]?: (value: T[K]) => ValidationResult;
};

/**
 * Form submit handler
 */
export type FormSubmitHandler<T extends Record<string, unknown>> = (
  values: T
) => Promise<void> | void;

/**
 * Form configuration options
 */
export interface FormOptions<T extends Record<string, unknown>> {
  readonly initialValues: T;
  readonly validators?: FormValidators<T>;
  readonly onSubmit?: FormSubmitHandler<T>;
  readonly validateOnChange?: boolean;
  readonly validateOnBlur?: boolean;
  readonly resetOnSubmitSuccess?: boolean;
}

/**
 * Form actions interface
 */
export interface FormActions<T extends Record<string, unknown>> {
  readonly setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  readonly setFieldError: <K extends keyof T>(field: K, error?: string) => void;
  readonly setFieldTouched: <K extends keyof T>(
    field: K,
    touched?: boolean
  ) => void;
  readonly validateField: <K extends keyof T>(field: K) => boolean;
  readonly validateForm: () => boolean;
  readonly handleSubmit: (event?: React.FormEvent) => Promise<void>;
  readonly reset: () => void;
  readonly setSubmitError: (error?: string) => void;
  readonly setSubmitSuccess: (success?: boolean) => void;
  readonly getFieldProps: <K extends keyof T>(
    field: K
  ) => {
    readonly value: T[K];
    readonly onChange: (value: T[K]) => void;
    readonly onBlur: () => void;
    readonly error?: string | undefined;
    readonly touched: boolean;
  };
}

/**
 * Form hook return type
 */
export type FormHookReturn<T extends Record<string, unknown>> = [
  FormState<T>,
  FormActions<T>,
];

/**
 * Custom form state management hook
 */
export function useForm<T extends Record<string, unknown>>(
  options: FormOptions<T>
): FormHookReturn<T> {
  const {
    initialValues,
    validators = {} as FormValidators<T>,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    resetOnSubmitSuccess = false,
  } = options;

  // Initialize form fields
  const initializeFields = useCallback((): FormState<T>['fields'] => {
    const fields = {} as { [K in keyof T]: FormField<T[K]> };

    for (const key in initialValues) {
      (fields as Record<string, FormField<unknown>>)[key] = {
        value: initialValues[key],
        touched: false,
        validated: false,
      };
    }

    return fields;
  }, [initialValues]);

  // Form state
  const [fields, setFields] =
    useState<FormState<T>['fields']>(initializeFields);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitSuccess, setSubmitSuccess] = useState<boolean | undefined>();

  // Keep track of initial values for dirty state calculation
  const initialValuesRef = useRef(initialValues);

  // Update initial values ref when they change
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  // Calculate derived state
  const isValid = Object.values(fields).every(
    field => !field.error && (!field.touched || field.validated)
  );

  const isDirty = Object.keys(fields).some(
    key =>
      fields[key as keyof T].value !== initialValuesRef.current[key as keyof T]
  );

  // Form actions
  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]): void => {
      setFields(
        prev =>
          ({
            ...prev,
            [field]: {
              ...prev[field],
              value,
              touched: true,
            },
          }) as FormState<T>['fields']
      );

      // Validate on change if enabled
      if (validateOnChange && validators[field]) {
        setTimeout(() => validateField(field), 0);
      }

      // Clear submit states when form is modified
      if (submitError) setSubmitError(undefined);
      if (submitSuccess) setSubmitSuccess(undefined);
    },
    [validateOnChange, validators, submitError, submitSuccess]
  );

  const setFieldError = useCallback(
    <K extends keyof T>(field: K, error?: string): void => {
      setFields(
        prev =>
          ({
            ...prev,
            [field]: {
              ...prev[field],
              error,
              validated: true,
            },
          }) as FormState<T>['fields']
      );
    },
    []
  );

  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, touched = true): void => {
      setFields(
        prev =>
          ({
            ...prev,
            [field]: {
              ...prev[field],
              touched,
            },
          }) as FormState<T>['fields']
      );

      // Validate on blur if enabled and field is touched
      if (touched && validateOnBlur && validators[field]) {
        setTimeout(() => validateField(field), 0);
      }
    },
    [validateOnBlur, validators]
  );

  const validateField = useCallback(
    <K extends keyof T>(field: K): boolean => {
      const validator = validators[field];
      if (!validator) return true;

      const fieldValue = fields[field].value;
      const result = validator(fieldValue);

      setFieldError(field, result.isValid ? undefined : result.errors[0]);
      return result.isValid;
    },
    [fields, validators]
  );

  const validateForm = useCallback((): boolean => {
    let allValid = true;

    // Validate all fields
    for (const field in fields) {
      const isFieldValid = validateField(field as keyof T);
      if (!isFieldValid) {
        allValid = false;
      }
    }

    // Mark all fields as touched
    setFields(prev => {
      const updated = { ...prev };
      for (const field in updated) {
        (updated as Record<string, FormField<unknown>>)[field] = {
          ...updated[field as keyof T],
          touched: true,
        };
      }
      return updated;
    });

    return allValid;
  }, [fields, validateField]);

  const handleSubmit = useCallback(
    async (event?: React.FormEvent): Promise<void> => {
      if (event) {
        event.preventDefault();
      }

      if (isSubmitting) return;

      setIsSubmitting(true);
      setSubmitError(undefined);
      setSubmitSuccess(undefined);

      try {
        // Validate form before submission
        if (!validateForm()) {
          return;
        }

        // Extract values for submission
        const values = {} as T;
        for (const key in fields) {
          values[key] = fields[key].value;
        }

        // Call submit handler if provided
        if (onSubmit) {
          await onSubmit(values);
        }

        setIsSubmitted(true);
        setSubmitSuccess(true);

        // Reset form if configured
        if (resetOnSubmitSuccess) {
          reset();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        setSubmitError(errorMessage);
        setSubmitSuccess(false);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, validateForm, fields, onSubmit, resetOnSubmitSuccess]
  );

  const reset = useCallback((): void => {
    setFields(initializeFields());
    setIsSubmitting(false);
    setIsSubmitted(false);
    setSubmitError(undefined);
    setSubmitSuccess(undefined);
  }, [initializeFields]);

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: fields[field].value,
      onChange: (value: T[K]): void => setValue(field, value),
      onBlur: (): void => setFieldTouched(field, true),
      error: fields[field].error,
      touched: fields[field].touched,
    }),
    [fields, setValue, setFieldTouched]
  );

  const state: FormState<T> = {
    fields,
    isValid,
    isSubmitting,
    isSubmitted,
    isDirty,
    submitError,
    submitSuccess,
  };

  const actions: FormActions<T> = {
    setValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    setSubmitError,
    setSubmitSuccess,
    getFieldProps,
  };

  return [state, actions];
}

/**
 * Hook for creating debounced validation
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return (): void => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
