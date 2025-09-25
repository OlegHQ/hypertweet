/**
 * Card component with variants, interactive states, and accessibility support
 */

import React, { type HTMLAttributes, forwardRef } from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';

/**
 * Card variant types for different visual styles
 */
export type CardVariant = 'default' | 'bordered' | 'elevated' | 'flat';

/**
 * Card size variants for consistent sizing
 */
export type CardSize = 'sm' | 'md' | 'lg';

/**
 * Card component props interface
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  readonly variant?: CardVariant;
  readonly size?: CardSize;
  readonly interactive?: boolean;
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
}

/**
 * Get variant styles based on card variant and theme
 */
const getVariantStyles = (variant: CardVariant, theme: ThemeType): string => {
  switch (variant) {
    case 'bordered':
      return `
        background-color: ${theme.colors.background.primary};
        border: 1px solid ${theme.colors.border.primary};
        box-shadow: none;
      `;

    case 'elevated':
      return `
        background-color: ${theme.colors.background.primary};
        border: 1px solid transparent;
        box-shadow: ${theme.shadows.md};
      `;

    case 'flat':
      return `
        background-color: ${theme.colors.background.secondary};
        border: 1px solid transparent;
        box-shadow: none;
      `;

    case 'default':
    default:
      return `
        background-color: ${theme.colors.background.primary};
        border: 1px solid ${theme.colors.border.primary};
        box-shadow: ${theme.shadows.sm};
      `;
  }
};

/**
 * Get size styles based on card size and theme
 */
const getSizeStyles = (size: CardSize, theme: ThemeType): string => {
  switch (size) {
    case 'sm':
      return `
        padding: ${theme.spacing[3]} ${theme.spacing[4]};
        border-radius: ${theme.borderRadius.md};
        gap: ${theme.spacing[2]};
      `;

    case 'lg':
      return `
        padding: ${theme.spacing[6]} ${theme.spacing[8]};
        border-radius: ${theme.borderRadius.xl};
        gap: ${theme.spacing[4]};
      `;

    case 'md':
    default:
      return `
        padding: ${theme.spacing[4]} ${theme.spacing[6]};
        border-radius: ${theme.borderRadius.lg};
        gap: ${theme.spacing[3]};
      `;
  }
};

/**
 * Get interactive styles for clickable cards
 */
const getInteractiveStyles = (
  interactive: boolean,
  disabled: boolean,
  theme: ThemeType
): string => {
  if (!interactive || disabled) {
    return '';
  }

  return `
    cursor: pointer;
    transition: all ${theme.transitions.duration.fast} ${theme.transitions.easing.easeOut};
    
    &:hover {
      border-color: ${theme.colors.border.secondary};
      box-shadow: ${theme.shadows.md};
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: ${theme.shadows.sm};
    }

    &:focus-visible {
      outline: 2px solid ${theme.colors.border.focus};
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      transition: none;
      transform: none;
    }
  `;
};

/**
 * Styled card component with theme integration
 */
const StyledCard = styled.div<{
  readonly variant: CardVariant;
  readonly size: CardSize;
  readonly interactive: boolean;
  readonly disabled: boolean;
}>`
  /* Layout and positioning */
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;

  /* Apply variant styles */
  ${({ variant, theme }) => getVariantStyles(variant, theme)}

  /* Apply size styles */
  ${({ size, theme }) => getSizeStyles(size, theme)}

  /* Apply interactive styles */
  ${({ interactive, disabled, theme }) =>
    getInteractiveStyles(interactive, disabled, theme)}

  /* Disabled state */
  ${({ disabled, theme }) =>
    disabled &&
    `
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
    color: ${theme.colors.text.tertiary};
  `}

  /* Focus management for interactive cards */
  ${({ interactive }) =>
    interactive &&
    `
    outline: none;
  `}
`;

/**
 * Card header component for consistent header styling
 */
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Card title component with proper typography
 */
const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

/**
 * Card description component with proper typography
 */
const CardDescription = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

/**
 * Card content area with proper spacing
 */
const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
`;

/**
 * Card footer component for consistent footer styling
 */
const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing[3]};
  padding-top: ${({ theme }) => theme.spacing[3]};
  border-top: 1px solid ${({ theme }) => theme.colors.border.primary};

  &:first-child {
    margin-top: 0;
    padding-top: 0;
    border-top: none;
  }
`;

/**
 * Main Card component with comprehensive functionality and accessibility
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      size = 'md',
      interactive = false,
      disabled = false,
      children,
      tabIndex,
      role,
      'aria-disabled': ariaDisabled,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    // Handle keyboard navigation for interactive cards
    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>
    ): void => {
      if (!interactive || disabled) return;

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
      }

      onKeyDown?.(event);
    };

    // Determine appropriate ARIA attributes
    const getAriaAttributes = (): Record<string, unknown> => {
      const attributes: Record<string, unknown> = {};

      if (interactive) {
        attributes['role'] = role ?? 'button';
        attributes['tabIndex'] = disabled ? -1 : (tabIndex ?? 0);
        attributes['aria-disabled'] = disabled || ariaDisabled;
      } else {
        attributes['role'] = role;
        attributes['tabIndex'] = tabIndex;
        attributes['aria-disabled'] = ariaDisabled;
      }

      return attributes;
    };

    return (
      <StyledCard
        ref={ref}
        variant={variant}
        size={size}
        interactive={interactive}
        disabled={disabled}
        onClick={interactive && !disabled ? onClick : undefined}
        onKeyDown={interactive ? handleKeyDown : onKeyDown}
        {...getAriaAttributes()}
        {...rest}
      >
        {children}
      </StyledCard>
    );
  }
);

// Set display name for debugging
Card.displayName = 'Card';

/**
 * Card compound components for structured content
 */
type CardWithCompoundComponents = typeof Card & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
};

(Card as CardWithCompoundComponents).Header = CardHeader;
(Card as CardWithCompoundComponents).Title = CardTitle;
(Card as CardWithCompoundComponents).Description = CardDescription;
(Card as CardWithCompoundComponents).Content = CardContent;
(Card as CardWithCompoundComponents).Footer = CardFooter;

/**
 * Card component variants for easy access
 */
export const CardVariants = {
  Default: 'default' as const,
  Bordered: 'bordered' as const,
  Elevated: 'elevated' as const,
  Flat: 'flat' as const,
} as const;

/**
 * Card component sizes for easy access
 */
export const CardSizes = {
  Small: 'sm' as const,
  Medium: 'md' as const,
  Large: 'lg' as const,
} as const;
