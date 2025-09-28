/**
 * KeyboardLayout component - Main layout container for compact keyboard UI
 *
 * Provides the foundational structure and responsive layout for the keyboard
 * with support for different size variants, animation states, and platform themes.
 *
 * Features:
 * - Responsive grid-based layout with configurable sections
 * - Platform-agnostic theming with automatic dark mode detection
 * - Smooth animations with reduced motion support
 * - Flexible content organization with header, main, and footer sections
 * - Memory efficient rendering with conditional sections
 */

import React, { forwardRef, useMemo, type ReactNode, type CSSProperties } from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import {
  type Platform,
  type AnimationState,
  type KeyboardSize,
  type AccessibilityConfig,
  type PositionConfig,
  KeyboardDefaults,
} from './types.js';

/**
 * Props interface for KeyboardLayout component
 */
export interface KeyboardLayoutProps {
  readonly platform: Platform;
  readonly size?: KeyboardSize;
  readonly animationState?: AnimationState;
  readonly visible?: boolean;
  readonly reducedMotion?: boolean;
  readonly accessibility?: Partial<AccessibilityConfig>;
  readonly position?: Partial<PositionConfig>;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Get platform-specific styling for seamless integration
 */
const getPlatformLayoutStyles = (platform: Platform, theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.sm};
    line-height: ${theme.typography.lineHeight.relaxed};
  `;

  switch (platform) {
    case 'twitter':
      return `
        ${baseStyles}
        border: 1px solid rgb(207, 217, 222);
        background: rgb(255, 255, 255);
        color: rgb(15, 20, 25);
        
        @media (prefers-color-scheme: dark) {
          border-color: rgb(47, 51, 54);
          background: rgb(21, 24, 28);
          color: rgb(247, 249, 249);
        }
      `;
    
    case 'linkedin':
      return `
        ${baseStyles}
        border: 1px solid rgba(0, 0, 0, 0.15);
        background: #ffffff;
        color: rgba(0, 0, 0, 0.9);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      `;
    
    case 'reddit':
      return `
        ${baseStyles}
        border: 1px solid #edeff1;
        background: #ffffff;
        color: #1c1c1c;
        
        @media (prefers-color-scheme: dark) {
          border-color: #343536;
          background: #1a1a1b;
          color: #d7dadc;
        }
      `;
    
    default:
      return `
        ${baseStyles}
        border: 1px solid ${theme.colors.border.primary};
        background: ${theme.colors.background.primary};
        color: ${theme.colors.text.primary};
      `;
  }
};

/**
 * Get size-specific layout dimensions and spacing
 */
const getSizeStyles = (size: KeyboardSize, theme: ThemeType): string => {
  switch (size) {
    case 'xs':
      return `
        min-height: 24px;
        padding: ${theme.spacing[1]} ${theme.spacing[2]};
        gap: ${theme.spacing[1]};
        font-size: ${theme.typography.fontSize.xs};
      `;
    
    case 'sm':
      return `
        min-height: 32px;
        padding: ${theme.spacing[2]} ${theme.spacing[3]};
        gap: ${theme.spacing[2]};
        font-size: ${theme.typography.fontSize.sm};
      `;
    
    case 'md':
      return `
        min-height: 40px;
        padding: ${theme.spacing[3]} ${theme.spacing[4]};
        gap: ${theme.spacing[3]};
        font-size: ${theme.typography.fontSize.base};
      `;
    
    case 'lg':
      return `
        min-height: 48px;
        padding: ${theme.spacing[4]} ${theme.spacing[6]};
        gap: ${theme.spacing[4]};
        font-size: ${theme.typography.fontSize.lg};
      `;
    
    default:
      return getSizeStyles('sm', theme);
  }
};

/**
 * Animation keyframes and transitions for layout states
 */
const getLayoutAnimationStyles = (animationState: AnimationState, theme: ThemeType): string => {
  const duration = theme.transitions.duration.fast;
  const easing = theme.transitions.easing.easeOut;

  switch (animationState) {
    case 'entering':
      return `
        animation: layoutSlideIn ${duration} ${easing};
        
        @keyframes layoutSlideIn {
          from {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 200px;
          }
        }
      `;
    
    case 'exiting':
      return `
        animation: layoutSlideOut ${duration} ${easing};
        
        @keyframes layoutSlideOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
            max-height: 200px;
          }
          to {
            opacity: 0;
            transform: translateY(-12px) scale(0.98);
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
        }
      `;
    
    case 'collapsed':
      return `
        max-height: 32px;
        overflow: hidden;
        transition: max-height ${duration} ${easing};
      `;
    
    case 'expanded':
      return `
        max-height: 200px;
        transition: max-height ${duration} ${easing};
      `;
    
    default:
      return '';
  }
};

/**
 * Main layout container with responsive design and accessibility
 */
const LayoutContainer = styled.div<{
  readonly platform: Platform;
  readonly size: KeyboardSize;
  readonly animationState: AnimationState;
  readonly visible: boolean;
  readonly reducedMotion: boolean;
}>`
  /* Layout structure */
  display: ${({ visible }) => (visible ? 'flex' : 'none')};
  flex-direction: column;
  align-items: stretch;
  
  /* Responsive sizing */
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
  
  /* Layout spacing and styling */
  ${({ size, theme }) => getSizeStyles(size, theme)}
  
  /* Platform-specific appearance */
  ${({ platform, theme }) => getPlatformLayoutStyles(platform, theme)}
  
  /* Responsive design */
  border-radius: ${({ theme }) => theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  
  /* Animation handling */
  ${({ animationState, theme, reducedMotion }) => 
    !reducedMotion ? getLayoutAnimationStyles(animationState, theme) : ''}
  
  /* Focus management */
  &:focus-within {
    outline: 2px solid ${({ theme }) => theme.colors.border.focus};
    outline-offset: 2px;
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none !important;
  }
  
  /* Responsive breakpoints */
  @media (max-width: 480px) {
    margin-left: -${({ theme }) => theme.spacing[2]};
    margin-right: -${({ theme }) => theme.spacing[2]};
    border-radius: 0;
    max-width: none;
  }
`;

/**
 * Header section for title, controls, and quick actions
 */
const LayoutHeader = styled.header<{ readonly hasContent: boolean }>`
  display: ${({ hasContent }) => (hasContent ? 'flex' : 'none')};
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
  min-height: 24px;
  
  /* Subtle bottom border for visual separation */
  border-bottom: 1px solid transparent;
  padding-bottom: ${({ theme }) => theme.spacing[1]};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  
  /* Show border when content is present */
  ${({ hasContent, theme }) => hasContent && `
    border-bottom-color: ${theme.colors.border.secondary};
  `}
`;

/**
 * Main content area for primary keyboard elements
 */
const LayoutMain = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  flex: 1;
  min-height: 0; /* Allow flexbox shrinking */
`;

/**
 * Footer section for additional controls and status
 */
const LayoutFooter = styled.footer<{ readonly hasContent: boolean }>`
  display: ${({ hasContent }) => (hasContent ? 'flex' : 'none')};
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  flex-shrink: 0;
  min-height: 20px;
  
  /* Subtle top border for visual separation */
  border-top: 1px solid transparent;
  padding-top: ${({ theme }) => theme.spacing[1]};
  margin-top: ${({ theme }) => theme.spacing[1]};
  
  /* Show border when content is present */
  ${({ hasContent, theme }) => hasContent && `
    border-top-color: ${theme.colors.border.secondary};
  `}
  
  /* Smaller text for footer content */
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  opacity: 0.8;
`;

/**
 * KeyboardLayout component implementation
 */
export const KeyboardLayout = forwardRef<HTMLDivElement, KeyboardLayoutProps>(
  (props, ref) => {
    const {
      platform,
      size = 'sm',
      animationState = 'idle',
      visible = true,
      reducedMotion = false,
      accessibility,
      position,
      className,
      style,
      children,
      header,
      footer,
      onKeyDown,
    } = props;

    // Memoize computed values for performance
    const mergedAccessibility = useMemo(() => 
      accessibility ? {
        ...KeyboardDefaults.ACCESSIBILITY,
        ...accessibility,
        announcements: {
          ...KeyboardDefaults.ACCESSIBILITY.announcements,
          ...accessibility.announcements,
        },
        keyboardNavigation: {
          ...KeyboardDefaults.ACCESSIBILITY.keyboardNavigation,
          ...accessibility.keyboardNavigation,
        },
        reducedMotion: {
          ...KeyboardDefaults.ACCESSIBILITY.reducedMotion,
          ...accessibility.reducedMotion,
        },
      } : KeyboardDefaults.ACCESSIBILITY,
      [accessibility]
    );

    const mergedPosition = useMemo(() => 
      position ? {
        ...KeyboardDefaults.POSITION,
        ...position,
        offset: {
          ...KeyboardDefaults.POSITION.offset,
          ...position.offset,
        },
      } : KeyboardDefaults.POSITION,
      [position]
    );

    // Compute final container styles
    const containerStyle: CSSProperties = useMemo(() => ({
      ...style,
      position: mergedPosition.placement === 'floating' ? 'absolute' : 'relative',
      zIndex: KeyboardDefaults.PLATFORM_CONFIGS[platform].styling.zIndexOffset,
      ...(mergedPosition.placement === 'floating' && {
        left: mergedPosition.offset.x,
        top: mergedPosition.offset.y,
      }),
    }), [style, mergedPosition, platform]);

    // Early return if not visible and not animating
    if (!visible && animationState === 'idle') {
      return null;
    }

    const hasHeader = Boolean(header);
    const hasFooter = Boolean(footer);

    return (
      <LayoutContainer
        ref={ref}
        platform={platform}
        size={size}
        animationState={animationState}
        visible={visible}
        reducedMotion={reducedMotion || !mergedAccessibility.reducedMotion.respectPreference}
        className={className}
        style={containerStyle}
        onKeyDown={onKeyDown}
        role="toolbar"
        aria-label={`Compact AI keyboard for ${platform}`}
        aria-expanded={animationState === 'expanded'}
        aria-hidden={!visible}
      >
        <LayoutHeader hasContent={hasHeader}>
          {header}
        </LayoutHeader>

        <LayoutMain>
          {children}
        </LayoutMain>

        <LayoutFooter hasContent={hasFooter}>
          {footer}
        </LayoutFooter>
      </LayoutContainer>
    );
  }
);

// Set display name for debugging
KeyboardLayout.displayName = 'KeyboardLayout';