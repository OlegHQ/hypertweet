/**
 * KeyboardButton component - Specialized button for keyboard UI interactions
 *
 * Provides a feature-rich button component optimized for keyboard interfaces
 * with platform-specific styling, advanced accessibility, and rich interactions.
 *
 * Features:
 * - Platform-adaptive styling with automatic theming
 * - Multiple visual variants and states (loading, disabled, active)
 * - Rich content support with icons, labels, and keyboard shortcuts
 * - Advanced accessibility with proper ARIA support and announcements
 * - Smooth animations and haptic feedback for enhanced UX
 * - Keyboard navigation optimized for grid and linear layouts
 */

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useState,
  type ReactNode, 
  type CSSProperties,
  type ButtonHTMLAttributes,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import {
  type Platform,
  type KeyboardSize,
  type ToneMode,
  type QuickAction,
  KeyboardDefaults,
} from './types.js';

/**
 * Button variants for different use cases and visual hierarchy
 */
export type ButtonVariant = 
  | 'primary'     // Main action, highest emphasis
  | 'secondary'   // Secondary action, medium emphasis  
  | 'ghost'       // Subtle action, minimal emphasis
  | 'tone'        // Tone selection button
  | 'action'      // Quick action button
  | 'toggle'      // Toggle state button
  | 'danger';     // Destructive action

/**
 * Button content configuration for rich display
 */
export interface ButtonContent {
  readonly icon?: ReactNode;
  readonly label: string;
  readonly shortcut?: string; // Keyboard shortcut display (e.g., "⌘K")
  readonly badge?: string | number; // Badge/count display
  readonly description?: string; // Tooltip/description text
}

/**
 * Props interface for KeyboardButton component
 */
export interface KeyboardButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'content'> {
  readonly variant?: ButtonVariant;
  readonly size?: KeyboardSize;
  readonly platform: Platform;
  readonly content: ButtonContent | string; // Simple string or rich content
  readonly loading?: boolean;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly tone?: string; // Associated tone for tone buttons
  readonly action?: QuickAction; // Associated action for action buttons
  readonly mode?: ToneMode; // Context mode for styling
  readonly showTooltip?: boolean;
  readonly hapticFeedback?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  readonly onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Get platform-specific button styling with native feel
 */
const getPlatformButtonStyles = (platform: Platform, variant: ButtonVariant, theme: ThemeType): string => {
  const baseTransition = `transition: all ${theme.transitions.duration.fast} ${theme.transitions.easing.easeOut}`;

  switch (platform) {
    case 'twitter':
      switch (variant) {
        case 'primary':
          return `
            ${baseTransition};
            background: rgb(29, 155, 240);
            color: rgb(255, 255, 255);
            border: 1px solid rgb(29, 155, 240);
            
            &:hover:not(:disabled) {
              background: rgb(26, 140, 216);
              border-color: rgb(26, 140, 216);
            }
            
            &:active {
              background: rgb(24, 113, 184);
            }
          `;
        
        case 'secondary':
          return `
            ${baseTransition};
            background: transparent;
            color: rgb(29, 155, 240);
            border: 1px solid rgb(207, 217, 222);
            
            &:hover:not(:disabled) {
              background: rgba(29, 155, 240, 0.1);
            }
            
            @media (prefers-color-scheme: dark) {
              color: rgb(29, 155, 240);
              border-color: rgb(47, 51, 54);
              
              &:hover:not(:disabled) {
                background: rgba(29, 155, 240, 0.1);
              }
            }
          `;
        
        case 'ghost':
          return `
            ${baseTransition};
            background: transparent;
            color: rgb(83, 100, 113);
            border: none;
            
            &:hover:not(:disabled) {
              background: rgba(15, 20, 25, 0.03);
              color: rgb(15, 20, 25);
            }
            
            @media (prefers-color-scheme: dark) {
              color: rgb(139, 152, 165);
              
              &:hover:not(:disabled) {
                background: rgba(247, 249, 249, 0.03);
                color: rgb(247, 249, 249);
              }
            }
          `;
        
        default:
          return getPlatformButtonStyles(platform, 'ghost', theme);
      }
    
    case 'linkedin':
      switch (variant) {
        case 'primary':
          return `
            ${baseTransition};
            background: #0a66c2;
            color: #ffffff;
            border: 1px solid #0a66c2;
            
            &:hover:not(:disabled) {
              background: #095296;
              border-color: #095296;
            }
            
            &:active {
              background: #084d8b;
            }
          `;
        
        case 'secondary':
          return `
            ${baseTransition};
            background: transparent;
            color: #0a66c2;
            border: 1px solid #0a66c2;
            
            &:hover:not(:disabled) {
              background: rgba(10, 102, 194, 0.1);
              border-color: #004182;
            }
          `;
        
        case 'ghost':
          return `
            ${baseTransition};
            background: transparent;
            color: rgba(0, 0, 0, 0.6);
            border: none;
            
            &:hover:not(:disabled) {
              background: rgba(0, 0, 0, 0.08);
              color: rgba(0, 0, 0, 0.9);
            }
          `;
        
        default:
          return getPlatformButtonStyles(platform, 'ghost', theme);
      }
    
    case 'reddit':
      switch (variant) {
        case 'primary':
          return `
            ${baseTransition};
            background: #ff4500;
            color: #ffffff;
            border: 1px solid #ff4500;
            
            &:hover:not(:disabled) {
              background: #e63d00;
              border-color: #e63d00;
            }
            
            &:active {
              background: #cc3700;
            }
          `;
        
        case 'secondary':
          return `
            ${baseTransition};
            background: transparent;
            color: #ff4500;
            border: 1px solid #edeff1;
            
            &:hover:not(:disabled) {
              background: rgba(255, 69, 0, 0.1);
              border-color: #ff4500;
            }
            
            @media (prefers-color-scheme: dark) {
              border-color: #343536;
              
              &:hover:not(:disabled) {
                border-color: #ff4500;
              }
            }
          `;
        
        case 'ghost':
          return `
            ${baseTransition};
            background: transparent;
            color: #7c7c83;
            border: none;
            
            &:hover:not(:disabled) {
              background: rgba(26, 26, 27, 0.1);
              color: #1c1c1c;
            }
            
            @media (prefers-color-scheme: dark) {
              color: #818384;
              
              &:hover:not(:disabled) {
                background: rgba(215, 218, 220, 0.1);
                color: #d7dadc;
              }
            }
          `;
        
        default:
          return getPlatformButtonStyles(platform, 'ghost', theme);
      }
    
    default:
      return `
        ${baseTransition};
        background: ${theme.colors.background.primary};
        color: ${theme.colors.text.primary};
        border: 1px solid ${theme.colors.border.primary};
        
        &:hover:not(:disabled) {
          background: ${theme.colors.background.secondary};
        }
      `;
  }
};

/**
 * Get size-specific button dimensions and typography
 */
const getSizeButtonStyles = (size: KeyboardSize, theme: ThemeType): string => {
  switch (size) {
    case 'xs':
      return `
        height: 24px;
        padding: 0 ${theme.spacing[2]};
        font-size: ${theme.typography.fontSize.xs};
        border-radius: ${theme.borderRadius.sm};
        min-width: 32px;
      `;
    
    case 'sm':
      return `
        height: 28px;
        padding: 0 ${theme.spacing[3]};
        font-size: ${theme.typography.fontSize.sm};
        border-radius: ${theme.borderRadius.sm};
        min-width: 40px;
      `;
    
    case 'md':
      return `
        height: 32px;
        padding: 0 ${theme.spacing[4]};
        font-size: ${theme.typography.fontSize.base};
        border-radius: ${theme.borderRadius.md};
        min-width: 48px;
      `;
    
    case 'lg':
      return `
        height: 36px;
        padding: 0 ${theme.spacing[6]};
        font-size: ${theme.typography.fontSize.lg};
        border-radius: ${theme.borderRadius.md};
        min-width: 56px;
      `;
    
    default:
      return getSizeButtonStyles('sm', theme);
  }
};

/**
 * Main button container with comprehensive styling
 */
const StyledButton = styled.button<{
  readonly platform: Platform;
  readonly variant: ButtonVariant;
  readonly size: KeyboardSize;
  readonly loading: boolean;
  readonly active: boolean;
}>`
  /* Reset default button styles */
  border: none;
  outline: none;
  background: none;
  font-family: inherit;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  
  /* Layout and positioning */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[1]};
  position: relative;
  white-space: nowrap;
  text-decoration: none;
  box-sizing: border-box;
  
  /* Typography */
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  line-height: 1;
  letter-spacing: 0;
  
  /* Size-specific styles */
  ${({ size, theme }) => getSizeButtonStyles(size, theme)}
  
  /* Platform and variant styling */
  ${({ platform, variant, theme }) => getPlatformButtonStyles(platform, variant, theme)}
  
  /* Active state */
  ${({ active, theme }) => active && `
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    transform: translateY(1px);
  `}
  
  /* Loading state */
  ${({ loading }) => loading && `
    pointer-events: none;
    opacity: 0.7;
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Focus styles */
  &:focus-visible {
    outline: 2px solid;
    outline-offset: 2px;
    outline-color: currentColor;
  }
  
  /* Pressed state */
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  
  /* Smooth scaling on interaction */
  &:active:not(:disabled) {
    transform: scale(0.98) translateY(1px);
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
`;

/**
 * Content wrapper for button internal layout
 */
const ButtonContentWrapper = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  line-height: 1;
`;

/**
 * Icon wrapper with proper sizing
 */
const IconWrapper = styled.span<{ readonly size: KeyboardSize }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  ${({ size }) => {
    switch (size) {
      case 'xs': return 'width: 12px; height: 12px;';
      case 'sm': return 'width: 14px; height: 14px;';
      case 'md': return 'width: 16px; height: 16px;';
      case 'lg': return 'width: 18px; height: 18px;';
      default: return 'width: 14px; height: 14px;';
    }
  }}
`;

/**
 * Badge for counts or status indicators
 */
const Badge = styled.span<{ readonly size: KeyboardSize }>`
  background: currentColor;
  color: var(--button-bg-color, #ffffff);
  border-radius: 10px;
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  line-height: 1;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${({ theme }) => theme.spacing[1]};
  
  ${({ size }) => {
    switch (size) {
      case 'xs': return 'font-size: 9px; min-width: 12px; height: 12px;';
      case 'sm': return 'font-size: 10px; min-width: 14px; height: 14px;';
      case 'md': return 'font-size: 11px; min-width: 16px; height: 16px;';
      case 'lg': return 'font-size: 12px; min-width: 18px; height: 18px;';
      default: return 'font-size: 10px; min-width: 14px; height: 14px;';
    }
  }}
`;

/**
 * Shortcut display for keyboard shortcuts
 */
const Shortcut = styled.span<{ readonly size: KeyboardSize }>`
  opacity: 0.6;
  margin-left: ${({ theme }) => theme.spacing[1]};
  font-family: ${({ theme }) => theme.typography.fontFamily.mono};
  
  ${({ size }) => {
    switch (size) {
      case 'xs': return 'font-size: 9px;';
      case 'sm': return 'font-size: 10px;';
      case 'md': return 'font-size: 11px;';
      case 'lg': return 'font-size: 12px;';
      default: return 'font-size: 10px;';
    }
  }}
`;

/**
 * Loading spinner component
 */
const LoadingSpinner = styled.div<{ readonly size: KeyboardSize }>`
  ${({ size }) => {
    const spinnerSize = {
      xs: '10px',
      sm: '12px', 
      md: '14px',
      lg: '16px',
    }[size] || '12px';
    
    return `
      width: ${spinnerSize};
      height: ${spinnerSize};
    `;
  }}
  
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: ${({ theme }) => theme.spacing[1]};
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: currentColor;
    opacity: 0.5;
  }
`;

/**
 * KeyboardButton component implementation
 */
export const KeyboardButton = forwardRef<HTMLButtonElement, KeyboardButtonProps>(
  (props, ref) => {
    const {
      variant = 'ghost',
      size = 'sm',
      platform,
      content,
      loading = false,
      active = false,
      disabled = false,
      tone,
      action,
      mode,
      showTooltip = false,
      hapticFeedback = false,
      className,
      style,
      onClick,
      onFocus,
      onBlur,
      onKeyDown,
      ...buttonProps
    } = props;

    const [isPressed, setIsPressed] = useState<boolean>(false);

    // Parse content prop into structured content
    const parsedContent = useMemo(() => {
      if (typeof content === 'string') {
        return { label: content };
      }
      return content;
    }, [content]);

    // Handle click with haptic feedback
    const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
      if (disabled || loading) return;
      
      // Trigger haptic feedback on supported devices
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      onClick?.(event);
    }, [disabled, loading, hapticFeedback, onClick]);

    // Handle mouse/touch press states for enhanced feedback
    const handleMouseDown = useCallback((): void => {
      if (!disabled && !loading) {
        setIsPressed(true);
      }
    }, [disabled, loading]);

    const handleMouseUp = useCallback((): void => {
      setIsPressed(false);
    }, []);

    const handleMouseLeave = useCallback((): void => {
      setIsPressed(false);
    }, []);

    // Compute ARIA attributes
    const ariaLabel = useMemo(() => {
      const parts: string[] = [parsedContent.label];
      
      if (parsedContent.description) {
        parts.push(parsedContent.description);
      }
      
      if (tone) {
        parts.push(`Tone: ${tone}`);
      }
      
      if (action) {
        parts.push(`Action: ${action}`);
      }
      
      if (parsedContent.shortcut) {
        parts.push(`Shortcut: ${parsedContent.shortcut}`);
      }
      
      return parts.join(', ');
    }, [parsedContent, tone, action]);

    return (
      <StyledButton
        ref={ref}
        platform={platform}
        variant={variant}
        size={size}
        loading={loading}
        active={active || isPressed}
        disabled={disabled}
        className={className}
        style={style}
        onClick={handleClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        aria-pressed={active}
        aria-disabled={disabled}
        aria-busy={loading}
        title={showTooltip ? parsedContent.description : undefined}
        data-tone={tone}
        data-action={action}
        data-mode={mode}
        {...buttonProps}
      >
        <ButtonContentWrapper>
          {loading && <LoadingSpinner size={size} />}
          
          {parsedContent.icon && (
            <IconWrapper size={size}>
              {parsedContent.icon}
            </IconWrapper>
          )}
          
          <span>{parsedContent.label}</span>
          
          {parsedContent.shortcut && (
            <Shortcut size={size}>
              {parsedContent.shortcut}
            </Shortcut>
          )}
          
          {parsedContent.badge && (
            <Badge size={size}>
              {parsedContent.badge}
            </Badge>
          )}
        </ButtonContentWrapper>
      </StyledButton>
    );
  }
);

// Set display name for debugging
KeyboardButton.displayName = 'KeyboardButton';