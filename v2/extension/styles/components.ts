/**
 * Common styled component definitions and layout primitives
 */

import React from 'react';
import styled from '@emotion/styled';
import { css, type SerializedStyles } from '@emotion/react';
import { type ThemeType } from './theme.js';

/**
 * Layout primitive: Flexible Box component
 */
export interface BoxProps {
  readonly as?: React.ElementType;
  readonly padding?: keyof ThemeType['spacing'];
  readonly margin?: keyof ThemeType['spacing'];
  readonly backgroundColor?: string;
  readonly borderRadius?: keyof ThemeType['borderRadius'];
  readonly shadow?: keyof ThemeType['shadows'];
  readonly display?:
    | 'block'
    | 'inline-block'
    | 'flex'
    | 'inline-flex'
    | 'grid'
    | 'none';
  readonly position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  readonly overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  readonly width?: string;
  readonly height?: string;
  readonly minWidth?: string;
  readonly minHeight?: string;
  readonly maxWidth?: string;
  readonly maxHeight?: string;
}

export const Box = styled.div<BoxProps>`
  ${({ padding, theme }): string =>
    padding ? `padding: ${theme.spacing[padding]};` : ''}
  ${({ margin, theme }): string =>
    margin ? `margin: ${theme.spacing[margin]};` : ''}
  ${({ backgroundColor }): string =>
    backgroundColor ? `background-color: ${backgroundColor};` : ''}
  ${({ borderRadius, theme }): string =>
    borderRadius ? `border-radius: ${theme.borderRadius[borderRadius]};` : ''}
  ${({ shadow, theme }): string =>
    shadow ? `box-shadow: ${theme.shadows[shadow]};` : ''}
  ${({ display }): string => (display ? `display: ${display};` : '')}
  ${({ position }): string => (position ? `position: ${position};` : '')}
  ${({ overflow }): string => (overflow ? `overflow: ${overflow};` : '')}
  ${({ width }): string => (width ? `width: ${width};` : '')}
  ${({ height }): string => (height ? `height: ${height};` : '')}
  ${({ minWidth }): string => (minWidth ? `min-width: ${minWidth};` : '')}
  ${({ minHeight }): string => (minHeight ? `min-height: ${minHeight};` : '')}
  ${({ maxWidth }): string => (maxWidth ? `max-width: ${maxWidth};` : '')}
  ${({ maxHeight }): string => (maxHeight ? `max-height: ${maxHeight};` : '')}
`;

/**
 * Layout primitive: Flexbox container
 */
export interface FlexProps extends BoxProps {
  readonly direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  readonly align?:
    | 'stretch'
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'baseline';
  readonly justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  readonly wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  readonly gap?: keyof ThemeType['spacing'];
  readonly flex?: string | number;
}

export const Flex = styled(Box)<FlexProps>`
  display: flex;
  ${({ direction }) => direction && `flex-direction: ${direction};`}
  ${({ align }) => align && `align-items: ${align};`}
  ${({ justify }) => justify && `justify-content: ${justify};`}
  ${({ wrap }) => wrap && `flex-wrap: ${wrap};`}
  ${({ gap, theme }) => gap && `gap: ${theme.spacing[gap]};`}
  ${({ flex }) => flex && `flex: ${flex};`}
`;

/**
 * Layout primitive: Grid container
 */
export interface GridProps extends BoxProps {
  readonly columns?: number | string;
  readonly rows?: number | string;
  readonly gap?: keyof ThemeType['spacing'];
  readonly columnGap?: keyof ThemeType['spacing'];
  readonly rowGap?: keyof ThemeType['spacing'];
  readonly autoFlow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  readonly alignItems?: 'start' | 'end' | 'center' | 'stretch';
  readonly justifyItems?: 'start' | 'end' | 'center' | 'stretch';
}

export const Grid = styled(Box)<GridProps>`
  display: grid;
  ${({ columns }) =>
    columns &&
    `grid-template-columns: ${
      typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns
    };`}
  ${({ rows }) =>
    rows &&
    `grid-template-rows: ${
      typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows
    };`}
  ${({ gap, theme }) => gap && `gap: ${theme.spacing[gap]};`}
  ${({ columnGap, theme }) =>
    columnGap && `column-gap: ${theme.spacing[columnGap]};`}
  ${({ rowGap, theme }) => rowGap && `row-gap: ${theme.spacing[rowGap]};`}
  ${({ autoFlow }) => autoFlow && `grid-auto-flow: ${autoFlow};`}
  ${({ alignItems }) => alignItems && `align-items: ${alignItems};`}
  ${({ justifyItems }) => justifyItems && `justify-items: ${justifyItems};`}
`;

/**
 * Typography: Text component with theme integration
 */
export interface TextProps {
  readonly as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  readonly size?: keyof ThemeType['typography']['fontSize'];
  readonly weight?: keyof ThemeType['typography']['fontWeight'];
  readonly lineHeight?: keyof ThemeType['typography']['lineHeight'];
  readonly color?: string;
  readonly align?: 'left' | 'center' | 'right' | 'justify';
  readonly transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  readonly decoration?: 'none' | 'underline' | 'overline' | 'line-through';
  readonly family?: 'sans' | 'mono';
}

export const Text = styled.p<TextProps>`
  margin: 0;
  ${({ size, theme }) =>
    size && `font-size: ${theme.typography.fontSize[size]};`}
  ${({ weight, theme }) =>
    weight && `font-weight: ${theme.typography.fontWeight[weight]};`}
  ${({ lineHeight, theme }) =>
    lineHeight && `line-height: ${theme.typography.lineHeight[lineHeight]};`}
  ${({ color, theme }) => `color: ${color ?? theme.colors.text.primary};`}
  ${({ align }) => align && `text-align: ${align};`}
  ${({ transform }) => transform && `text-transform: ${transform};`}
  ${({ decoration }) => decoration && `text-decoration: ${decoration};`}
  ${({ family, theme }) =>
    family && `font-family: ${theme.typography.fontFamily[family]};`}
`;

/**
 * Container component with responsive max-width
 */
export interface ContainerProps extends BoxProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  readonly center?: boolean;
}

const containerSizes = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

export const Container = styled(Box)<ContainerProps>`
  width: 100%;
  ${({ size = 'lg' }) => `max-width: ${containerSizes[size]};`}
  ${({ center = true }) => center && 'margin-left: auto; margin-right: auto;'}
  ${({ padding = 4, theme }) =>
    `padding-left: ${theme.spacing[padding]}; padding-right: ${theme.spacing[padding]};`}
`;

/**
 * Card component for content grouping
 */
export interface CardProps extends BoxProps {
  readonly variant?: 'default' | 'bordered' | 'elevated' | 'flat';
  readonly interactive?: boolean;
}

export const Card = styled(Box)<CardProps>`
  ${({ theme, variant = 'default' }) => {
    switch (variant) {
      case 'bordered':
        return `
          border: 1px solid ${theme.colors.border.primary};
          background-color: ${theme.colors.background.primary};
        `;
      case 'elevated':
        return `
          background-color: ${theme.colors.background.primary};
          box-shadow: ${theme.shadows.md};
        `;
      case 'flat':
        return `
          background-color: ${theme.colors.background.secondary};
        `;
      default:
        return `
          background-color: ${theme.colors.background.primary};
          border: 1px solid ${theme.colors.border.primary};
          box-shadow: ${theme.shadows.sm};
        `;
    }
  }}

  border-radius: ${({ theme, borderRadius = 'md' }) =>
    theme.borderRadius[borderRadius]};
  padding: ${({ theme, padding = 6 }) => theme.spacing[padding]};

  ${({ interactive, theme }) =>
    interactive &&
    `
    cursor: pointer;
    transition: all ${theme.transitions.duration.fast} ${theme.transitions.easing.easeOut};

    &:hover {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.lg};
    }

    &:active {
      transform: translateY(0);
    }
  `}
`;

/**
 * Divider component for visual separation
 */
export interface DividerProps {
  readonly orientation?: 'horizontal' | 'vertical';
  readonly spacing?: keyof ThemeType['spacing'];
  readonly color?: string;
  readonly thickness?: string;
}

export const Divider = styled.div<DividerProps>`
  ${({
    orientation = 'horizontal',
    theme,
    color,
    thickness = '1px',
    spacing = 4,
  }) => {
    const borderColor = color ?? theme.colors.border.primary;

    if (orientation === 'vertical') {
      return `
        width: ${thickness};
        height: 100%;
        background-color: ${borderColor};
        margin-left: ${theme.spacing[spacing]};
        margin-right: ${theme.spacing[spacing]};
      `;
    }

    return `
      height: ${thickness};
      width: 100%;
      background-color: ${borderColor};
      margin-top: ${theme.spacing[spacing]};
      margin-bottom: ${theme.spacing[spacing]};
    `;
  }}
`;

/**
 * Avatar component for user profiles
 */
export interface AvatarProps {
  readonly size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  readonly src?: string;
  readonly alt?: string;
  readonly initials?: string;
}

const avatarSizes = {
  xs: '24px',
  sm: '32px',
  md: '40px',
  lg: '48px',
  xl: '64px',
} as const;

export const Avatar = styled.div<AvatarProps>`
  ${({ size = 'md' }) => `
    width: ${avatarSizes[size]};
    height: ${avatarSizes[size]};
  `}

  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.interactive.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  font-size: ${({ size = 'md' }) => {
    const fontSize = {
      xs: '0.625rem',
      sm: '0.75rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1.25rem',
    };
    return fontSize[size];
  }};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/**
 * Badge component for status indicators
 */
export interface BadgeProps {
  readonly variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly dot?: boolean;
}

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  white-space: nowrap;

  ${({ size = 'md', theme }) => {
    const sizeStyles = {
      sm: `
        padding: ${theme.spacing[1]} ${theme.spacing[2]};
        font-size: ${theme.typography.fontSize.xs};
        min-height: 20px;
      `,
      md: `
        padding: ${theme.spacing[1]} ${theme.spacing[3]};
        font-size: ${theme.typography.fontSize.sm};
        min-height: 24px;
      `,
      lg: `
        padding: ${theme.spacing[2]} ${theme.spacing[4]};
        font-size: ${theme.typography.fontSize.base};
        min-height: 32px;
      `,
    };
    return sizeStyles[size];
  }}

  ${({ variant = 'default', theme }) => {
    const variantStyles = {
      default: `
        background-color: ${theme.colors.interactive.secondary};
        color: ${theme.colors.text.primary};
      `,
      success: `
        background-color: ${theme.colors.status.successBackground};
        color: ${theme.colors.status.success};
      `,
      error: `
        background-color: ${theme.colors.status.errorBackground};
        color: ${theme.colors.status.error};
      `,
      warning: `
        background-color: ${theme.colors.status.warningBackground};
        color: ${theme.colors.status.warning};
      `,
      info: `
        background-color: ${theme.colors.status.infoBackground};
        color: ${theme.colors.status.info};
      `,
    };
    return variantStyles[variant];
  }}

  ${({ dot, size = 'md' }) =>
    dot &&
    `
    width: ${size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px'};
    height: ${size === 'sm' ? '8px' : size === 'lg' ? '12px' : '10px'};
    min-height: auto;
    padding: 0;
  `}
`;

/**
 * Skeleton loader component for loading states
 */
export interface SkeletonProps {
  readonly width?: string;
  readonly height?: string;
  readonly variant?: 'text' | 'rectangular' | 'circular';
  readonly animation?: boolean;
}

const skeletonAnimation = css`
  @keyframes skeleton-loading {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.6;
    }
  }
`;

export const Skeleton = styled.div<SkeletonProps>`
  ${skeletonAnimation}

  background-color: ${({ theme }) => theme.colors.border.primary};

  ${({ variant = 'text', width, height }) => {
    switch (variant) {
      case 'circular':
        return `
          border-radius: 50%;
          width: ${width ?? '40px'};
          height: ${height ?? width ?? '40px'};
        `;
      case 'rectangular':
        return `
          border-radius: 4px;
          width: ${width ?? '100%'};
          height: ${height ?? '20px'};
        `;
      default: // text
        return `
          border-radius: 4px;
          width: ${width ?? '100%'};
          height: ${height ?? '1em'};
        `;
    }
  }}

  ${({ animation = true }) =>
    animation &&
    `
    animation: skeleton-loading 1.5s ease-in-out infinite;
  `}
`;

/**
 * Utility function for responsive styles
 */
export const responsive = {
  sm: (styles: SerializedStyles) => css`
    @media (min-width: 640px) {
      ${styles}
    }
  `,
  md: (styles: SerializedStyles) => css`
    @media (min-width: 768px) {
      ${styles}
    }
  `,
  lg: (styles: SerializedStyles) => css`
    @media (min-width: 1024px) {
      ${styles}
    }
  `,
  xl: (styles: SerializedStyles) => css`
    @media (min-width: 1280px) {
      ${styles}
    }
  `,
  '2xl': (styles: SerializedStyles) => css`
    @media (min-width: 1536px) {
      ${styles}
    }
  `,
} as const;

/**
 * Utility function for hover states that respect reduced motion
 */
export const hoverStyles = (styles: SerializedStyles) => css`
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    &:hover {
      ${styles}
    }
  }
`;

/**
 * Utility function for focus styles
 */
export const focusRingStyles = (theme: ThemeType) => css`
  &:focus-visible {
    outline: 2px solid ${theme.colors.border.focus};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;
