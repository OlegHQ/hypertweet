/**
 * Loading component with spinner variants, sizes, and accessibility support
 */

import React, { type HTMLAttributes, forwardRef } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { type ThemeType } from '../../styles/theme.js';

/**
 * Loading spinner variant types for different visual styles
 */
export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars';

/**
 * Loading size variants for consistent sizing
 */
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Loading component props interface
 */
export interface LoadingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly variant?: LoadingVariant;
  readonly size?: LoadingSize;
  readonly color?: string;
  readonly label?: string;
  readonly fullScreen?: boolean;
  readonly overlay?: boolean;
}

/**
 * Animation keyframes for different loading variants
 */
const spinAnimation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
`;

const dotsAnimation = keyframes`
  0%, 20% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  80%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
`;

const barsAnimation = keyframes`
  0%, 40%, 100% {
    opacity: 0.3;
    transform: scaleY(0.4);
  }
  20% {
    opacity: 1;
    transform: scaleY(1);
  }
`;

/**
 * Get size dimensions based on loading size
 */
const getSizeDimensions = (size: LoadingSize): string => {
  switch (size) {
    case 'xs':
      return '12px';
    case 'sm':
      return '16px';
    case 'md':
      return '24px';
    case 'lg':
      return '32px';
    case 'xl':
      return '48px';
    default:
      return '24px';
  }
};

/**
 * Container for loading component with optional overlay
 */
const LoadingContainer = styled.div<{
  readonly fullScreen: boolean;
  readonly overlay: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};

  ${({ fullScreen }) =>
    fullScreen &&
    `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: ${({ theme }: { theme: ThemeType }) => theme.zIndex.modal};
  `}

  ${({ overlay, theme }) =>
    overlay &&
    `
    background-color: ${theme.colors.background.primary}80;
    backdrop-filter: blur(2px);
  `}
`;

/**
 * Base spinner styles
 */
const BaseSpinner = styled.div<{
  readonly size: LoadingSize;
  readonly color?: string;
}>`
  width: ${({ size }) => getSizeDimensions(size)};
  height: ${({ size }) => getSizeDimensions(size)};
  color: ${({ color, theme }) => color ?? theme.colors.interactive.primary};

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;

    &::after,
    &::before {
      animation: none !important;
    }
  }
`;

/**
 * Circular spinner component
 */
const CircularSpinner = styled(BaseSpinner)`
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spinAnimation} 1s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    border-color: currentColor;
    opacity: 0.6;
  }
`;

/**
 * Pulse spinner component
 */
const PulseSpinner = styled(BaseSpinner)`
  border-radius: 50%;
  background-color: currentColor;
  animation: ${pulseAnimation} 1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.6;
  }
`;

/**
 * Dots spinner container
 */
const DotsContainer = styled(BaseSpinner)`
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
`;

/**
 * Individual dot in dots spinner
 */
const Dot = styled.div<{
  readonly delay: number;
  readonly size: LoadingSize;
}>`
  width: ${({ size }) => {
    const dimension = parseInt(getSizeDimensions(size));
    return `${Math.max(dimension / 4, 3)}px`;
  }};
  height: ${({ size }) => {
    const dimension = parseInt(getSizeDimensions(size));
    return `${Math.max(dimension / 4, 3)}px`;
  }};
  border-radius: 50%;
  background-color: currentColor;
  animation: ${dotsAnimation} 1.4s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.6;
  }
`;

/**
 * Bars spinner container
 */
const BarsContainer = styled(BaseSpinner)`
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
`;

/**
 * Individual bar in bars spinner
 */
const Bar = styled.div<{
  readonly delay: number;
  readonly size: LoadingSize;
}>`
  width: ${({ size }) => {
    const dimension = parseInt(getSizeDimensions(size));
    return `${Math.max(dimension / 6, 2)}px`;
  }};
  height: ${({ size }) => getSizeDimensions(size)};
  background-color: currentColor;
  border-radius: 1px;
  animation: ${barsAnimation} 1.2s ease-in-out infinite;
  animation-delay: ${({ delay }) => delay}ms;

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.6;
    height: 60%;
  }
`;

/**
 * Loading label for accessibility
 */
const LoadingLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-top: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Render the appropriate spinner based on variant
 */
const SpinnerComponent: React.FC<{
  variant: LoadingVariant;
  size: LoadingSize;
  color?: string;
}> = ({ variant, size, color }): React.ReactElement => {
  switch (variant) {
    case 'dots':
      return (
        <DotsContainer size={size} {...(color ? { color } : {})}>
          <Dot delay={0} size={size} />
          <Dot delay={200} size={size} />
          <Dot delay={400} size={size} />
        </DotsContainer>
      );

    case 'pulse':
      return <PulseSpinner size={size} {...(color ? { color } : {})} />;

    case 'bars':
      return (
        <BarsContainer size={size} {...(color ? { color } : {})}>
          <Bar delay={0} size={size} />
          <Bar delay={150} size={size} />
          <Bar delay={300} size={size} />
          <Bar delay={450} size={size} />
        </BarsContainer>
      );

    case 'spinner':
    default:
      return <CircularSpinner size={size} {...(color ? { color } : {})} />;
  }
};

/**
 * Loading component with comprehensive functionality and accessibility
 */
export const Loading = forwardRef<HTMLDivElement, LoadingProps>(
  (
    {
      variant = 'spinner',
      size = 'md',
      color,
      label = 'Loading',
      fullScreen = false,
      overlay = false,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    const accessibleLabel = ariaLabel ?? label;

    return (
      <LoadingContainer
        ref={ref}
        fullScreen={fullScreen}
        overlay={overlay || fullScreen}
        role="status"
        aria-live="polite"
        aria-label={accessibleLabel}
        {...rest}
      >
        <SpinnerComponent
          variant={variant}
          size={size}
          {...(color ? { color } : {})}
        />
        {label && !fullScreen && (
          <LoadingLabel aria-hidden="true">{label}</LoadingLabel>
        )}
        {/* Screen reader only text */}
        <span
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {accessibleLabel}
        </span>
      </LoadingContainer>
    );
  }
);

// Set display name for debugging
Loading.displayName = 'Loading';

/**
 * Loading component variants for easy access
 */
export const LoadingVariants = {
  Spinner: 'spinner' as const,
  Dots: 'dots' as const,
  Pulse: 'pulse' as const,
  Bars: 'bars' as const,
} as const;

/**
 * Loading component sizes for easy access
 */
export const LoadingSizes = {
  ExtraSmall: 'xs' as const,
  Small: 'sm' as const,
  Medium: 'md' as const,
  Large: 'lg' as const,
  ExtraLarge: 'xl' as const,
} as const;
