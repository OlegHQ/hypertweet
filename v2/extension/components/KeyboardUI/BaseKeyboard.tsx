/**
 * BaseKeyboard component - Compact, thin keyboard UI for social media platforms
 * 
 * This is NOT a sidebar component, but a small inline keyboard that appears
 * directly under text areas to provide quick AI tone selection and generation.
 * 
 * Features:
 * - Platform-agnostic design with theme customization
 * - Smooth show/hide animations with reduced motion support
 * - Comprehensive accessibility (ARIA, keyboard navigation, screen readers)
 * - Integration with existing auth/tone systems
 * - Memory efficient with proper cleanup
 */

import React, { 
  forwardRef, 
  useCallback, 
  useEffect, 
  useMemo, 
  useState,
  useRef,
  type CSSProperties,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import { Button } from '../common/Button.js';
import { 
  type BaseKeyboardProps,
  type KeyboardState,
  type AnimationState,
  type KeyboardError,
  type ToneMode,
  type QuickAction,
  KeyboardDefaults,
  mergeAccessibilityConfig,
  mergePositionConfig,
  createKeyboardError,
  isPlatform,
  isKeyboardState,
  isToneMode,
} from './types.js';

/**
 * Get platform-specific styling for seamless integration
 */
const getPlatformStyles = (platform: BaseKeyboardProps['platform'], theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.sm};
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
        border: 1px solid rgba(0,0,0,0.15);
        background: #ffffff;
        color: rgba(0,0,0,0.9);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
 * Animation keyframes for smooth keyboard appearance
 */
const getAnimationStyles = (animationState: AnimationState, theme: ThemeType): string => {
  const duration = theme.transitions.duration.fast;
  const easing = theme.transitions.easing.easeOut;

  switch (animationState) {
    case 'entering':
      return `
        animation: slideIn ${duration} ${easing};
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 80px;
          }
        }
      `;
    
    case 'exiting':
      return `
        animation: slideOut ${duration} ${easing};
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
            max-height: 80px;
          }
          to {
            opacity: 0;
            transform: translateY(-8px);
            max-height: 0;
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
        max-height: 120px;
        transition: max-height ${duration} ${easing};
      `;
    
    default:
      return '';
  }
};

/**
 * Main keyboard container with responsive layout and platform integration
 */
const KeyboardContainer = styled.div<{
  readonly platform: BaseKeyboardProps['platform'];
  readonly animationState: AnimationState;
  readonly visible: boolean;
  readonly reducedMotion: boolean;
}>`
  /* Layout */
  display: ${({ visible }) => (visible ? 'flex' : 'none')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  
  /* Sizing */
  width: 100%;
  min-height: 32px;
  max-width: 600px;
  
  /* Spacing */
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  margin-top: ${({ theme }) => theme.spacing[2]};
  
  /* Styling */
  border-radius: ${({ theme }) => theme.borderRadius.md};
  position: relative;
  overflow: hidden;
  
  /* Platform-specific styles */
  ${({ platform, theme }) => getPlatformStyles(platform, theme)}
  
  /* Animation styles */
  ${({ animationState, theme, reducedMotion }) => 
    !reducedMotion ? getAnimationStyles(animationState, theme) : ''}
  
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
`;

/**
 * Header section with mode selector and quick actions
 */
const KeyboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  min-height: 24px;
`;

/**
 * Main content area with tone buttons and controls
 */
const KeyboardContent = styled.div<{ readonly expanded: boolean }>`
  display: ${({ expanded }) => (expanded ? 'flex' : 'none')};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  
  /* Smooth expansion animation */
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  transition: opacity ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Quick action buttons row
 */
const QuickActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  flex-wrap: wrap;
`;

/**
 * Tone buttons grid
 */
const ToneButtonsGrid = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  flex-wrap: wrap;
`;

/**
 * Error display component
 */
const ErrorDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.status.errorBackground};
  color: ${({ theme }) => theme.colors.status.error};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

/**
 * Loading indicator component
 */
const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[1]};
  opacity: 0.7;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

/**
 * Accessibility helper for screen reader announcements
 */
const AnnouncementRegion = styled.div`
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
`;

/**
 * Hook for managing keyboard state and side effects
 */
const useKeyboardState = (props: BaseKeyboardProps) => {
  const [currentState, setCurrentState] = useState<KeyboardState>(
    props.loading ? 'loading' : props.visible ? 'visible' : 'hidden'
  );
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [expanded, setExpanded] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');
  
  const prevVisible = useRef<boolean>(Boolean(props.visible));
  
  // Handle visibility changes with animations
  useEffect(() => {
    const wasVisible = prevVisible.current;
    const isVisible = Boolean(props.visible);
    
    if (wasVisible !== isVisible) {
      if (isVisible) {
        setCurrentState('visible');
        setAnimationState('entering');
        props.onVisibilityChange?.(true);
        
        // Complete animation
        const timer = setTimeout(() => {
          setAnimationState('idle');
        }, 150);
        
        return () => clearTimeout(timer);
      } else {
        setAnimationState('exiting');
        
        // Hide after animation
        const timer = setTimeout(() => {
          setCurrentState('hidden');
          setAnimationState('idle');
          setExpanded(false);
          props.onVisibilityChange?.(false);
        }, 150);
        
        return () => clearTimeout(timer);
      }
    }
    
    prevVisible.current = isVisible;
  }, [props.visible, props.onVisibilityChange]);
  
  // Handle loading state
  useEffect(() => {
    if (props.loading) {
      setCurrentState('loading');
      setAnnouncement('AI keyboard loading');
    } else if (currentState === 'loading') {
      setCurrentState(props.visible ? 'visible' : 'hidden');
    }
  }, [props.loading, props.visible, currentState]);
  
  // Handle error state
  useEffect(() => {
    if (props.error) {
      setCurrentState('error');
      setAnnouncement(`Error: ${props.error.message}`);
      props.onError?.(props.error);
    }
  }, [props.error, props.onError]);
  
  return {
    currentState,
    animationState,
    expanded,
    setExpanded,
    announcement,
    setAnnouncement,
  };
};

/**
 * BaseKeyboard component implementation
 */
export const BaseKeyboard = forwardRef<HTMLDivElement, BaseKeyboardProps>(
  (props, ref) => {
    const {
      platform,
      targetElement,
      visible = false,
      loading = false,
      error = null,
      mode = 'quick',
      position: positionProp,
      accessibility: accessibilityProp,
      className,
      style,
      onToneSelect,
      onQuickAction,
      onStateChange,
      onError,
      onVisibilityChange,
    } = props;

    // Merge configurations with defaults
    const position = useMemo(() => 
      mergePositionConfig(positionProp), 
      [positionProp]
    );
    
    const accessibility = useMemo(() => 
      mergeAccessibilityConfig(accessibilityProp), 
      [accessibilityProp]
    );

    // State management
    const {
      currentState,
      animationState,
      expanded,
      setExpanded,
      announcement,
      setAnnouncement,
    } = useKeyboardState(props);

    // Detect reduced motion preference
    const [reducedMotion, setReducedMotion] = useState<boolean>(false);
    
    useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent): void => {
        setReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Quick tone presets for rapid access
    const quickTones = useMemo(() => [
      { id: 'professional', label: 'Professional', tone: 'professional' },
      { id: 'friendly', label: 'Friendly', tone: 'friendly' },
      { id: 'casual', label: 'Casual', tone: 'casual' },
      { id: 'formal', label: 'Formal', tone: 'formal' },
    ], []);

    // Event handlers with proper error handling
    const handleToneSelect = useCallback(async (tone: string): Promise<void> => {
      try {
        setAnnouncement(`Generating ${tone} tone`);
        await onToneSelect({ 
          tone, 
          mode, 
          targetElement 
        });
        setAnnouncement(`${tone} tone generated successfully`);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR', 
          `Failed to generate ${tone} tone: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
      }
    }, [onToneSelect, mode, targetElement, platform, onError]);

    const handleQuickAction = useCallback(async (action: QuickAction): Promise<void> => {
      try {
        if (action === 'toggle') {
          setExpanded(prev => !prev);
          setAnnouncement(expanded ? 'Keyboard collapsed' : 'Keyboard expanded');
          return;
        }
        
        setAnnouncement(`Executing ${action} action`);
        await onQuickAction({ action, targetElement });
        setAnnouncement(`${action} action completed`);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR', 
          `Failed to execute ${action}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
      }
    }, [onQuickAction, targetElement, platform, onError, expanded]);

    // Keyboard navigation support
    const handleKeyDown = useCallback((e: React.KeyboardEvent): void => {
      if (!accessibility.keyboardNavigation.enabled) return;

      switch (e.key) {
        case 'Escape':
          if (accessibility.keyboardNavigation.escapeToClose) {
            e.preventDefault();
            onVisibilityChange?.(false);
            setAnnouncement('Keyboard closed');
          }
          break;
        
        case 'Enter':
        case ' ':
          if (e.target instanceof HTMLButtonElement) {
            e.preventDefault();
            e.target.click();
          }
          break;
        
        case 'Tab':
          // Let default tab behavior work for focus management
          break;
        
        default:
          break;
      }
    }, [accessibility.keyboardNavigation, onVisibilityChange]);

    // State change notifications
    useEffect(() => {
      onStateChange?.(currentState);
    }, [currentState, onStateChange]);

    // Don't render if hidden and not animating
    if (currentState === 'hidden' && animationState === 'idle') {
      return null;
    }

    const containerStyle: CSSProperties = {
      ...style,
      position: position.placement === 'floating' ? 'absolute' : 'relative',
      zIndex: KeyboardDefaults.PLATFORM_CONFIGS[platform].styling.zIndexOffset,
      ...(position.placement === 'floating' && {
        left: position.offset.x,
        top: position.offset.y,
      }),
    };

    return (
      <KeyboardContainer
        ref={ref}
        platform={platform}
        animationState={animationState}
        visible={currentState !== 'hidden'}
        reducedMotion={reducedMotion || !accessibility.reducedMotion.respectPreference}
        className={className}
        style={containerStyle}
        onKeyDown={handleKeyDown}
        role="toolbar"
        aria-label={`AI keyboard for ${platform}`}
        aria-expanded={expanded}
        aria-busy={loading}
      >
        {/* Screen reader announcements */}
        {accessibility.announcements.enabled && (
          <AnnouncementRegion
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {announcement}
          </AnnouncementRegion>
        )}

        {/* Error display */}
        {error && (
          <ErrorDisplay role="alert">
            ⚠️ {error.message}
          </ErrorDisplay>
        )}

        {/* Main keyboard header */}
        <KeyboardHeader>
          <QuickActionsRow>
            {quickTones.map((tonePreset) => (
              <Button
                key={tonePreset.id}
                variant="ghost"
                size="sm"
                onClick={() => handleToneSelect(tonePreset.tone)}
                disabled={loading}
                aria-label={`Generate ${tonePreset.label} tone`}
              >
                {tonePreset.label}
              </Button>
            ))}
          </QuickActionsRow>

          <QuickActionsRow>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction('toggle')}
              aria-label={expanded ? 'Collapse keyboard' : 'Expand keyboard'}
              aria-expanded={expanded}
            >
              {expanded ? '−' : '+'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction('settings')}
              disabled={loading}
              aria-label="Open keyboard settings"
            >
              ⚙️
            </Button>
          </QuickActionsRow>
        </KeyboardHeader>

        {/* Expanded content area */}
        <KeyboardContent expanded={expanded}>
          <ToneButtonsGrid>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleQuickAction('generate')}
              disabled={loading}
              loading={loading}
              aria-label="Generate AI response"
            >
              Generate
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleQuickAction('copy')}
              disabled={loading}
              aria-label="Copy to clipboard"
            >
              Copy
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleQuickAction('clear')}
              disabled={loading}
              aria-label="Clear text"
            >
              Clear
            </Button>
          </ToneButtonsGrid>

          {loading && (
            <LoadingIndicator>
              <span>🤖</span>
              Generating AI response...
            </LoadingIndicator>
          )}
        </KeyboardContent>
      </KeyboardContainer>
    );
  }
);

// Set display name for debugging
BaseKeyboard.displayName = 'BaseKeyboard';