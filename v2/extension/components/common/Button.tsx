/**
 * Button component with variants, sizes, states, and accessibility support
 */

import React, { type ButtonHTMLAttributes, forwardRef } from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';

/**
 * Button variant types for different use cases
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Button size variants matching theme componentSizes
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Icon position for buttons with icons
 */
export type IconPosition = 'left' | 'right';

/**
 * Button component props interface
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly fullWidth?: boolean;
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly iconPosition?: IconPosition;
  readonly children: React.ReactNode;
}

/**
 * Get variant styles based on button variant and theme
 */
const getVariantStyles = (variant: ButtonVariant, theme: ThemeType): string => {
  switch (variant) {
    case 'primary':
      return `
        background-color: ${theme.colors.interactive.primary};
        color: ${theme.colors.text.inverse};
        border: 1px solid ${theme.colors.interactive.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.interactive.primaryHover};
          border-color: ${theme.colors.interactive.primaryHover};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.interactive.primaryActive};
          border-color: ${theme.colors.interactive.primaryActive};
        }

        &:focus-visible {
          outline: 2px solid ${theme.colors.border.focus};
          outline-offset: 2px;
        }
      `;

    case 'secondary':
      return `
        background-color: ${theme.colors.interactive.secondary};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border.primary};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.interactive.secondaryHover};
          border-color: ${theme.colors.border.secondary};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }

        &:focus-visible {
          outline: 2px solid ${theme.colors.border.focus};
          outline-offset: 2px;
        }
      `;

    case 'danger':
      return `
        background-color: ${theme.colors.interactive.danger};
        color: ${theme.colors.text.inverse};
        border: 1px solid ${theme.colors.interactive.danger};

        &:hover:not(:disabled) {
          background-color: ${theme.colors.interactive.dangerHover};
          border-color: ${theme.colors.interactive.dangerHover};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.status.error};
          border-color: ${theme.colors.status.error};
        }

        &:focus-visible {
          outline: 2px solid ${theme.colors.status.error};
          outline-offset: 2px;
        }
      `;

    case 'ghost':
      return `
        background-color: transparent;
        color: ${theme.colors.text.primary};
        border: 1px solid transparent;

        &:hover:not(:disabled) {
          background-color: ${theme.colors.background.secondary};
          color: ${theme.colors.text.primary};
        }

        &:active:not(:disabled) {
          background-color: ${theme.colors.background.tertiary};
        }

        &:focus-visible {
          outline: 2px solid ${theme.colors.border.focus};
          outline-offset: 2px;
        }
      `;

    default:
      return getVariantStyles('primary', theme);
  }
};

/**
 * Get size styles based on button size and theme
 */
const getSizeStyles = (size: ButtonSize, theme: ThemeType): string => {
  const sizeConfig = theme.componentSizes[size];

  return `
    height: ${sizeConfig.height};
    padding: ${sizeConfig.padding};
    font-size: ${sizeConfig.fontSize};
  `;
};

/**
 * Styled button component with theme integration
 */
const StyledButton = styled.button<{
  readonly variant: ButtonVariant;
  readonly size: ButtonSize;
  readonly fullWidth: boolean;
  readonly loading: boolean;
}>`
  /* Reset default button styles */
  background: none;
  border: none;
  padding: 0;
  margin: 0;

  /* Layout and positioning */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};

  /* Typography */
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.none};
  text-decoration: none;
  white-space: nowrap;

  /* Styling */
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};

  /* Remove default focus outline - we have custom focus styles */
  outline: none;

  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  /* Apply variant styles */
  ${({ variant, theme }) => getVariantStyles(variant, theme)}

  /* Apply size styles */
  ${({ size, theme }) => getSizeStyles(size, theme)}
  
  /* Full width option */
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* Loading state */
  ${({ loading }) =>
    loading &&
    `
    cursor: wait;
    opacity: 0.8;
  `}

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Loading spinner component for button loading state
 */
const LoadingSpinner = styled.div<{ readonly size: ButtonSize }>`
  width: ${({ size }) => {
    switch (size) {
      case 'sm':
        return '12px';
      case 'lg':
        return '18px';
      default:
        return '14px';
    }
  }};
  height: ${({ size }) => {
    switch (size) {
      case 'sm':
        return '12px';
      case 'lg':
        return '18px';
      default:
        return '14px';
    }
  }};
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    /* Provide alternative loading indicator for reduced motion */
    &::before {
      content: '';
      display: block;
      width: 100%;
      height: 100%;
      background: currentColor;
      opacity: 0.7;
      border-radius: 50%;
    }
  }
`;

/**
 * Icon wrapper component for proper spacing and alignment
 */
const IconWrapper = styled.span<{ readonly position: IconPosition }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

/**
 * Content wrapper to handle loading state opacity
 */
const ContentWrapper = styled.span<{ readonly loading: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  opacity: ${({ loading }) => (loading ? 0.7 : 1)};
  transition: opacity ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Button component with comprehensive functionality and accessibility
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      children,
      type = 'button',
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    // Determine if button should be disabled (explicitly disabled or loading)
    const isDisabled = Boolean(disabled) || Boolean(loading);

    // Create accessible label for loading state
    const accessibleLabel = loading
      ? `${ariaLabel ?? children} (Loading)`
      : ariaLabel;

    return (
      <StyledButton
        ref={ref}
        type={type}
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        loading={loading}
        disabled={isDisabled}
        aria-label={accessibleLabel}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...rest}
      >
        {loading && (
          <LoadingSpinner
            size={size}
            aria-hidden="true"
            role="status"
            aria-label="Loading"
          />
        )}

        <ContentWrapper loading={loading}>
          {icon && iconPosition === 'left' && (
            <IconWrapper position="left" aria-hidden="true">
              {icon}
            </IconWrapper>
          )}

          {children}

          {icon && iconPosition === 'right' && (
            <IconWrapper position="right" aria-hidden="true">
              {icon}
            </IconWrapper>
          )}
        </ContentWrapper>
      </StyledButton>
    );
  }
);

// Set display name for debugging
Button.displayName = 'Button';

/**
 * Button component variants for easy access
 */
export const ButtonVariants = {
  Primary: 'primary' as const,
  Secondary: 'secondary' as const,
  Danger: 'danger' as const,
  Ghost: 'ghost' as const,
} as const;

/**
 * Button component sizes for easy access
 */
export const ButtonSizes = {
  Small: 'sm' as const,
  Medium: 'md' as const,
  Large: 'lg' as const,
} as const;
