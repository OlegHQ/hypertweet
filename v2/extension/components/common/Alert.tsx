/**
 * Alert component with status types, variants, and accessibility support
 */

import React, {
  type HTMLAttributes,
  forwardRef,
  useState,
  useCallback,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';

/**
 * Alert status types for different message contexts
 */
export type AlertStatus = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert variant types for different visual styles
 */
export type AlertVariant = 'solid' | 'subtle' | 'bordered' | 'accent';

/**
 * Alert size variants for consistent sizing
 */
export type AlertSize = 'sm' | 'md' | 'lg';

/**
 * Alert component props interface
 */
export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly status?: AlertStatus;
  readonly variant?: AlertVariant;
  readonly size?: AlertSize;
  readonly title?: string;
  readonly description?: string;
  readonly dismissible?: boolean;
  readonly onDismiss?: () => void;
  readonly icon?: React.ReactNode;
  readonly children?: React.ReactNode;
}

/**
 * Get status colors based on alert status and variant
 */
const getStatusStyles = (
  status: AlertStatus,
  variant: AlertVariant,
  theme: ThemeType
): string => {
  const statusConfig = {
    success: {
      primary: theme.colors.status.success,
      background: theme.colors.status.successBackground,
    },
    error: {
      primary: theme.colors.status.error,
      background: theme.colors.status.errorBackground,
    },
    warning: {
      primary: theme.colors.status.warning,
      background: theme.colors.status.warningBackground,
    },
    info: {
      primary: theme.colors.status.info,
      background: theme.colors.status.infoBackground,
    },
  };

  const colors = statusConfig[status];

  switch (variant) {
    case 'solid':
      return `
        background-color: ${colors.primary};
        color: ${theme.colors.text.inverse};
        border: 1px solid ${colors.primary};
      `;

    case 'subtle':
      return `
        background-color: ${colors.background};
        color: ${colors.primary};
        border: 1px solid transparent;
      `;

    case 'bordered':
      return `
        background-color: ${theme.colors.background.primary};
        color: ${colors.primary};
        border: 1px solid ${colors.primary};
      `;

    case 'accent':
    default:
      return `
        background-color: ${colors.background};
        color: ${theme.colors.text.primary};
        border: 1px solid ${colors.background};
        border-left: 4px solid ${colors.primary};
      `;
  }
};

/**
 * Get size styles based on alert size
 */
const getSizeStyles = (size: AlertSize, theme: ThemeType): string => {
  switch (size) {
    case 'sm':
      return `
        padding: ${theme.spacing[2]} ${theme.spacing[3]};
        gap: ${theme.spacing[2]};
        border-radius: ${theme.borderRadius.sm};
      `;

    case 'lg':
      return `
        padding: ${theme.spacing[4]} ${theme.spacing[6]};
        gap: ${theme.spacing[4]};
        border-radius: ${theme.borderRadius.lg};
      `;

    case 'md':
    default:
      return `
        padding: ${theme.spacing[3]} ${theme.spacing[4]};
        gap: ${theme.spacing[3]};
        border-radius: ${theme.borderRadius.md};
      `;
  }
};

/**
 * Styled alert container
 */
const AlertContainer = styled.div<{
  readonly status: AlertStatus;
  readonly variant: AlertVariant;
  readonly size: AlertSize;
}>`
  display: flex;
  align-items: flex-start;
  width: 100%;
  position: relative;

  /* Apply status and variant styles */
  ${({ status, variant, theme }) => getStatusStyles(status, variant, theme)}

  /* Apply size styles */
  ${({ size, theme }) => getSizeStyles(size, theme)}

  /* Animation for smooth appearance */
  animation: alertSlideIn 0.2s ease-out;

  @keyframes alertSlideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * Icon wrapper for alert icons
 */
const IconWrapper = styled.div<{
  readonly size: AlertSize;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ size }) => {
    switch (size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '24px';
      case 'md':
      default:
        return '20px';
    }
  }};
  height: ${({ size }) => {
    switch (size) {
      case 'sm':
        return '16px';
      case 'lg':
        return '24px';
      case 'md':
      default:
        return '20px';
    }
  }};
`;

/**
 * Content wrapper for alert text content
 */
const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

/**
 * Alert title styling
 */
const AlertTitle = styled.h4<{
  readonly size: AlertSize;
}>`
  font-size: ${({ size, theme }) => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.sm;
      case 'lg':
        return theme.typography.fontSize.lg;
      case 'md':
      default:
        return theme.typography.fontSize.base;
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
  margin: 0;
  margin-bottom: ${({ theme }) => theme.spacing[1]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Alert description styling
 */
const AlertDescription = styled.p<{
  readonly size: AlertSize;
}>`
  font-size: ${({ size, theme }) => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.xs;
      case 'lg':
        return theme.typography.fontSize.base;
      case 'md':
      default:
        return theme.typography.fontSize.sm;
    }
  }};
  font-weight: ${({ theme }) => theme.typography.fontWeight.normal};
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
  margin: 0;
  opacity: 0.9;
`;

/**
 * Dismiss button styling
 */
const DismissButton = styled.button<{
  readonly variant: AlertVariant;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  cursor: pointer;
  flex-shrink: 0;

  color: ${({ variant, theme }) =>
    variant === 'solid' ? theme.colors.text.inverse : 'currentColor'};

  opacity: 0.7;
  transition: opacity ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};

  &:hover {
    opacity: 1;
    background-color: ${({ variant }) =>
      variant === 'solid' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 1px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Default status icons
 */
const StatusIcons: Record<AlertStatus, React.ReactNode> = {
  success: (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.63 10.07a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg width="100%" height="100%" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Close icon for dismiss button
 */
const CloseIcon: React.ReactNode = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M6.697 6l4.146-4.146a.5.5 0 00-.708-.708L6 5.293 1.854 1.146a.5.5 0 00-.708.708L5.293 6 1.146 10.146a.5.5 0 00.708.708L6 6.697l4.146 4.147a.5.5 0 00.708-.708L6.697 6z" />
  </svg>
);

/**
 * Alert component with comprehensive functionality and accessibility
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      status = 'info',
      variant = 'accent',
      size = 'md',
      title,
      description,
      dismissible = false,
      onDismiss,
      icon,
      children,
      role = 'alert',
      'aria-live': ariaLive = 'polite',
      ...rest
    },
    ref
  ) => {
    const [dismissed, setDismissed] = useState(false);

    const handleDismiss = useCallback((): void => {
      setDismissed(true);
      onDismiss?.();
    }, [onDismiss]);

    // Don't render if dismissed
    if (dismissed) {
      return null;
    }

    // Use provided icon or default status icon
    const displayIcon = icon ?? StatusIcons[status];

    // Determine if we have content to display
    const hasContent =
      Boolean(title) || Boolean(description) || Boolean(children);

    return (
      <AlertContainer
        ref={ref}
        status={status}
        variant={variant}
        size={size}
        role={role}
        aria-live={ariaLive}
        {...rest}
      >
        {displayIcon && (
          <IconWrapper size={size} aria-hidden="true">
            {displayIcon}
          </IconWrapper>
        )}

        {hasContent && (
          <ContentWrapper>
            {title && <AlertTitle size={size}>{title}</AlertTitle>}

            {description && (
              <AlertDescription size={size}>{description}</AlertDescription>
            )}

            {children}
          </ContentWrapper>
        )}

        {dismissible && (
          <DismissButton
            variant={variant}
            onClick={handleDismiss}
            aria-label="Dismiss alert"
            type="button"
          >
            {CloseIcon}
          </DismissButton>
        )}
      </AlertContainer>
    );
  }
);

// Set display name for debugging
Alert.displayName = 'Alert';

/**
 * Alert status types for easy access
 */
export const AlertStatuses = {
  Success: 'success' as const,
  Error: 'error' as const,
  Warning: 'warning' as const,
  Info: 'info' as const,
} as const;

/**
 * Alert variant types for easy access
 */
export const AlertVariants = {
  Solid: 'solid' as const,
  Subtle: 'subtle' as const,
  Bordered: 'bordered' as const,
  Accent: 'accent' as const,
} as const;

/**
 * Alert size types for easy access
 */
export const AlertSizes = {
  Small: 'sm' as const,
  Medium: 'md' as const,
  Large: 'lg' as const,
} as const;
