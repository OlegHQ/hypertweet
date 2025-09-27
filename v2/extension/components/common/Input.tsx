/**
 * Input component with validation states, types, and accessibility support
 */

import React, {
  forwardRef,
  useState,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';

/**
 * Input validation states for visual feedback
 */
export type ValidationState = 'default' | 'success' | 'error';

/**
 * Input types supported by the component
 */
export type InputType = 'text' | 'email' | 'password' | 'textarea';

/**
 * Base input props shared between input and textarea
 */
interface BaseInputProps {
  readonly label?: string;
  readonly helpText?: string;
  readonly errorMessage?: string;
  readonly successMessage?: string;
  readonly validationState?: ValidationState;
  readonly required?: boolean;
  readonly maxLength?: number;
  readonly showCharacterCount?: boolean;
  readonly fullWidth?: boolean;
}

/**
 * Props for regular input element
 */
export interface RegularInputProps
  extends BaseInputProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'maxLength' | 'required'
    > {
  readonly type?: 'text' | 'email' | 'password';
}

/**
 * Props for textarea element
 */
export interface TextareaInputProps
  extends BaseInputProps,
    Omit<
      TextareaHTMLAttributes<HTMLTextAreaElement>,
      'type' | 'maxLength' | 'required'
    > {
  readonly type: 'textarea';
  readonly rows?: number;
  readonly resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * Combined input props using discriminated union
 */
export type InputProps = RegularInputProps | TextareaInputProps;

/**
 * Get validation styles based on validation state
 */
const getValidationStyles = (
  state: ValidationState,
  theme: ThemeType
): string => {
  switch (state) {
    case 'success':
      return `
        border-color: ${theme.colors.status.success};
        
        &:focus {
          border-color: ${theme.colors.status.success};
          box-shadow: 0 0 0 2px ${theme.colors.status.successBackground};
        }
      `;

    case 'error':
      return `
        border-color: ${theme.colors.status.error};
        
        &:focus {
          border-color: ${theme.colors.status.error};
          box-shadow: 0 0 0 2px ${theme.colors.status.errorBackground};
        }
      `;

    default:
      return `
        border-color: ${theme.colors.border.primary};
        
        &:focus {
          border-color: ${theme.colors.border.focus};
          box-shadow: 0 0 0 2px ${theme.colors.interactive.primary}20;
        }
      `;
  }
};

/**
 * Container for the entire input component
 */
const InputContainer = styled.div<{ readonly fullWidth: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

/**
 * Label styling with required indicator
 */
const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

/**
 * Required indicator styling
 */
const RequiredIndicator = styled.span`
  color: ${({ theme }) => theme.colors.status.error};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Input wrapper for positioning and sizing
 */
const InputWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

/**
 * Base input styles shared between input and textarea
 */
const baseInputStyles = `
  width: 100%;
  min-height: 40px;
  padding: ${({ theme }: { theme: ThemeType }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  
  font-family: ${({ theme }: { theme: ThemeType }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }: { theme: ThemeType }) => theme.typography.fontSize.base};
  line-height: ${({ theme }: { theme: ThemeType }) => theme.typography.lineHeight.normal};
  color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.primary};
  
  background-color: ${({ theme }: { theme: ThemeType }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }: { theme: ThemeType }) => theme.colors.border.primary};
  border-radius: ${({ theme }: { theme: ThemeType }) => theme.borderRadius.md};
  
  transition: all ${({ theme }: { theme: ThemeType }) => theme.transitions.duration.fast} ${({ theme }: { theme: ThemeType }) => theme.transitions.easing.easeOut};
  outline: none;
  
  &::placeholder {
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.tertiary};
  }
  
  &:hover:not(:disabled) {
    border-color: ${({ theme }: { theme: ThemeType }) => theme.colors.border.secondary};
  }
  
  &:disabled {
    background-color: ${({ theme }: { theme: ThemeType }) => theme.colors.background.secondary};
    color: ${({ theme }: { theme: ThemeType }) => theme.colors.text.tertiary};
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Styled input element
 */
const StyledInput = styled.input<{ readonly validationState: ValidationState }>`
  ${baseInputStyles}
  ${({ validationState, theme }) => getValidationStyles(validationState, theme)}
`;

/**
 * Styled textarea element
 */
const StyledTextarea = styled.textarea<{
  readonly validationState: ValidationState;
  readonly resize: 'none' | 'vertical' | 'horizontal' | 'both';
}>`
  ${baseInputStyles}
  min-height: 80px;
  resize: ${({ resize }) => resize};
  ${({ validationState, theme }) => getValidationStyles(validationState, theme)}
`;

/**
 * Help text and message container
 */
const MessageContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing[2]};
  min-height: 20px;
`;

/**
 * Help text styling
 */
const HelpText = styled.span<{ readonly state: ValidationState }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  color: ${({ state, theme }) => {
    switch (state) {
      case 'success':
        return theme.colors.status.success;
      case 'error':
        return theme.colors.status.error;
      default:
        return theme.colors.text.secondary;
    }
  }};
  flex: 1;
`;

/**
 * Character counter styling
 */
const CharacterCount = styled.span<{ readonly isNearLimit: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ isNearLimit, theme }) =>
    isNearLimit ? theme.colors.status.warning : theme.colors.text.tertiary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  white-space: nowrap;
`;

/**
 * Helper function to determine validation state from props
 */
const getValidationState = (
  errorMessage?: string,
  successMessage?: string,
  validationState: ValidationState = 'default'
): ValidationState => {
  if (errorMessage) return 'error';
  if (successMessage) return 'success';
  return validationState;
};

/**
 * Helper function to get display message priority
 */
const getDisplayMessage = (
  errorMessage?: string,
  successMessage?: string,
  helpText?: string
): string | undefined => errorMessage ?? successMessage ?? helpText;

/**
 * Helper function to build aria-describedby string
 */
const buildAriaDescribedBy = (
  displayMessage: string | undefined,
  errorMessage: string | undefined,
  helpTextId: string,
  errorId: string,
  ariaDescribedBy?: string
): string | undefined => {
  const descriptions: string[] = [];
  if (displayMessage) descriptions.push(helpTextId);
  if (errorMessage) descriptions.push(errorId);
  if (ariaDescribedBy) descriptions.push(ariaDescribedBy);
  return descriptions.length > 0 ? descriptions.join(' ') : undefined;
};

/**
 * Helper function to call original onChange handler based on input type
 */
const callOriginalOnChange = (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  props: InputProps,
  rest: Record<string, unknown>
): void => {
  if (!('onChange' in rest) || !rest['onChange']) return;

  if (props.type === 'textarea') {
    (rest['onChange'] as React.ChangeEventHandler<HTMLTextAreaElement>)(
      event as React.ChangeEvent<HTMLTextAreaElement>
    );
  } else {
    (rest['onChange'] as React.ChangeEventHandler<HTMLInputElement>)(
      event as React.ChangeEvent<HTMLInputElement>
    );
  }
};

/**
 * Parameters for renderInputElement helper function
 */
interface RenderInputElementParams {
  readonly props: InputProps;
  readonly ref: React.ForwardedRef<HTMLInputElement | HTMLTextAreaElement>;
  readonly inputId: string;
  readonly actualValidationState: ValidationState;
  readonly required: boolean;
  readonly maxLength: number | undefined;
  readonly ariaDescribedByValue: string | undefined;
  readonly handleInputChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  readonly rest: Record<string, unknown>;
}

/**
 * Helper function to render the appropriate input element
 */
const renderInputElement = ({
  props,
  ref,
  inputId,
  actualValidationState,
  required,
  maxLength,
  ariaDescribedByValue,
  handleInputChange,
  rest,
}: RenderInputElementParams): React.ReactElement => {
  if (props.type === 'textarea') {
    return (
      <StyledTextarea
        ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
        id={inputId}
        validationState={actualValidationState}
        resize={props.resize ?? 'vertical'}
        rows={props.rows ?? 4}
        required={required}
        maxLength={maxLength}
        aria-describedby={ariaDescribedByValue}
        aria-invalid={actualValidationState === 'error'}
        aria-required={required}
        onChange={handleInputChange}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return (
    <StyledInput
      ref={ref as React.ForwardedRef<HTMLInputElement>}
      id={inputId}
      type={props.type ?? 'text'}
      validationState={actualValidationState}
      required={required}
      maxLength={maxLength}
      aria-describedby={ariaDescribedByValue}
      aria-invalid={actualValidationState === 'error'}
      aria-required={required}
      onChange={handleInputChange}
      {...(rest as InputHTMLAttributes<HTMLInputElement>)}
    />
  );
};

/**
 * Input component with comprehensive functionality and accessibility
 */
export const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>((props, ref) => {
  const {
    label,
    helpText,
    errorMessage,
    successMessage,
    validationState = 'default',
    required = false,
    maxLength,
    showCharacterCount = false,
    fullWidth = false,
    id,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props;

  // Generate unique IDs for accessibility
  const componentId = useId();
  const inputId = id ?? `input-${componentId}`;
  const helpTextId = `${inputId}-help`;
  const errorId = `${inputId}-error`;

  // Track character count for textareas and inputs with maxLength
  const [characterCount, setCharacterCount] = useState(0);

  // Use helper functions to reduce complexity
  const actualValidationState = getValidationState(
    errorMessage,
    successMessage,
    validationState
  );
  const displayMessage = getDisplayMessage(
    errorMessage,
    successMessage,
    helpText
  );

  // Calculate if we're near the character limit (90% of maxLength)
  const isNearLimit = maxLength ? characterCount / maxLength >= 0.9 : false;

  // Handle input change to update character count
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    setCharacterCount(event.target.value.length);
    callOriginalOnChange(event, props, rest);
  };

  // Get aria-describedby value using helper function
  const ariaDescribedByValue = buildAriaDescribedBy(
    displayMessage,
    errorMessage,
    helpTextId,
    errorId,
    ariaDescribedBy
  );

  return (
    <InputContainer fullWidth={fullWidth}>
      {label && (
        <Label htmlFor={inputId}>
          {label}
          {required && (
            <RequiredIndicator aria-label="required">*</RequiredIndicator>
          )}
        </Label>
      )}

      <InputWrapper>
        {renderInputElement({
          props,
          ref,
          inputId,
          actualValidationState,
          required,
          maxLength,
          ariaDescribedByValue,
          handleInputChange,
          rest,
        })}
      </InputWrapper>

      {(Boolean(displayMessage) || (showCharacterCount && maxLength)) && (
        <MessageContainer>
          {displayMessage && (
            <HelpText
              id={errorMessage ? errorId : helpTextId}
              state={actualValidationState}
              role={errorMessage ? 'alert' : undefined}
              aria-live={errorMessage ? 'polite' : undefined}
            >
              {displayMessage}
            </HelpText>
          )}

          {showCharacterCount && maxLength && (
            <CharacterCount
              isNearLimit={isNearLimit}
              aria-label={`${characterCount} of ${maxLength} characters used`}
            >
              {characterCount}/{maxLength}
            </CharacterCount>
          )}
        </MessageContainer>
      )}
    </InputContainer>
  );
});

// Set display name for debugging
Input.displayName = 'Input';

/**
 * Input validation states for easy access
 */
export const ValidationStates = {
  Default: 'default' as const,
  Success: 'success' as const,
  Error: 'error' as const,
} as const;

/**
 * Input types for easy access
 */
export const InputTypes = {
  Text: 'text' as const,
  Email: 'email' as const,
  Password: 'password' as const,
  Textarea: 'textarea' as const,
} as const;
