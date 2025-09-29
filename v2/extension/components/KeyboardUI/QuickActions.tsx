/**
 * QuickActions component - Comprehensive quick action buttons for keyboard interactions
 *
 * Provides a sophisticated action button system with loading states, visual feedback,
 * keyboard shortcuts, and comprehensive interaction handling for common keyboard operations.
 *
 * Features:
 * - Generate button with loading states and progress indication
 * - Copy to clipboard functionality with success feedback
 * - Clear/reset text actions with confirmation prompts
 * - Settings quick access with dropdown menu
 * - Help/tutorial triggers with contextual information
 * - Keyboard shortcuts with visual hints and accessibility
 * - Platform-specific styling and behavior adaptation
 * - Comprehensive error handling with user-friendly feedback
 * - Accessibility with ARIA labels and keyboard navigation
 */

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useState, 
  useRef,
  useEffect,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import { KeyboardButton, type ButtonContent } from './KeyboardButton.js';
import {
  type Platform,
  type QuickAction,
  type QuickActionHandler,
  type KeyboardSize,
  type TargetElement,
  createKeyboardError,
} from './types.js';

/**
 * Action execution state for tracking operation progress
 */
export type ActionState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Quick action definition with enhanced metadata
 */
export interface QuickActionDef {
  readonly id: QuickAction;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly shortcut?: string;
  readonly variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  readonly confirmRequired?: boolean;
  readonly confirmMessage?: string;
  readonly loadingText?: string;
  readonly successText?: string;
  readonly errorText?: string;
  readonly platforms?: readonly Platform[];
  readonly disabled?: boolean;
}

/**
 * Action execution result for feedback
 */
export interface ActionResult {
  readonly success: boolean;
  readonly message?: string;
  readonly data?: unknown;
}

/**
 * Props interface for QuickActions component
 */
export interface QuickActionsProps {
  readonly platform: Platform;
  readonly size?: KeyboardSize;
  readonly targetElement?: TargetElement;
  readonly actions?: readonly QuickActionDef[];
  readonly layout?: 'horizontal' | 'vertical' | 'grid';
  readonly showLabels?: boolean;
  readonly showShortcuts?: boolean;
  readonly showTooltips?: boolean;
  readonly maxActions?: number;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onActionExecute: QuickActionHandler;
  readonly onActionStateChange?: (action: QuickAction, state: ActionState) => void;
  readonly onClipboardCopy?: (text: string) => Promise<void>;
  readonly onClearConfirm?: () => Promise<boolean>;
  readonly onSettingsOpen?: () => void;
  readonly onHelpOpen?: () => void;
  readonly onGenerate?: (options?: { tone?: string; context?: string }) => Promise<string>;
}

/**
 * Get platform-specific action styling
 */
const getPlatformActionStyles = (platform: Platform, theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
  `;

  switch (platform) {
    case 'twitter':
      return `
        ${baseStyles}
        --actions-primary: rgb(29, 155, 240);
        --actions-secondary: rgb(83, 100, 113);
        --actions-success: rgb(0, 186, 124);
        --actions-danger: rgb(244, 33, 46);
        --actions-bg: rgb(255, 255, 255);
        --actions-hover: rgba(15, 20, 25, 0.03);
        
        @media (prefers-color-scheme: dark) {
          --actions-bg: rgb(21, 24, 28);
          --actions-hover: rgba(247, 249, 249, 0.03);
        }
      `;
    
    case 'linkedin':
      return `
        ${baseStyles}
        --actions-primary: #0a66c2;
        --actions-secondary: rgba(0, 0, 0, 0.6);
        --actions-success: #057642;
        --actions-danger: #cc1016;
        --actions-bg: #ffffff;
        --actions-hover: rgba(0, 0, 0, 0.08);
      `;
    
    case 'reddit':
      return `
        ${baseStyles}
        --actions-primary: #ff4500;
        --actions-secondary: #7c7c83;
        --actions-success: #46d160;
        --actions-danger: #ea0027;
        --actions-bg: #ffffff;
        --actions-hover: rgba(26, 26, 27, 0.1);
        
        @media (prefers-color-scheme: dark) {
          --actions-bg: #1a1a1b;
          --actions-hover: rgba(215, 218, 220, 0.1);
        }
      `;
    
    default:
      return `
        ${baseStyles}
        --actions-primary: ${theme.colors.interactive.primary};
        --actions-secondary: ${theme.colors.text.secondary};
        --actions-success: ${theme.colors.status.success};
        --actions-danger: ${theme.colors.interactive.danger};
        --actions-bg: ${theme.colors.background.primary};
        --actions-hover: ${theme.colors.background.secondary};
      `;
  }
};

/**
 * Get layout-specific styling
 */
const getLayoutStyles = (layout: 'horizontal' | 'vertical' | 'grid'): string => {
  switch (layout) {
    case 'horizontal':
      return `
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--actions-gap);
        flex-wrap: wrap;
      `;
    
    case 'vertical':
      return `
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--actions-gap);
      `;
    
    case 'grid':
      return `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: var(--actions-gap);
        align-items: center;
      `;
    
    default:
      return getLayoutStyles('horizontal');
  }
};

/**
 * Main actions container
 */
const ActionsContainer = styled.div<{
  readonly platform: Platform;
  readonly size: KeyboardSize;
  readonly layout: 'horizontal' | 'vertical' | 'grid';
}>`
  /* Platform theming */
  ${({ platform, theme }) => getPlatformActionStyles(platform, theme)}
  
  /* Size-based spacing */
  ${({ size, theme }) => {
    switch (size) {
      case 'xs':
        return `--actions-gap: ${theme.spacing[1]};`;
      case 'sm':
        return `--actions-gap: ${theme.spacing[2]};`;
      case 'md':
        return `--actions-gap: ${theme.spacing[3]};`;
      case 'lg':
        return `--actions-gap: ${theme.spacing[4]};`;
      default:
        return `--actions-gap: ${theme.spacing[2]};`;
    }
  }}
  
  /* Layout styling */
  ${({ layout }) => getLayoutStyles(layout)}
  
  /* Container properties */
  width: 100%;
  position: relative;
`;

/**
 * Action feedback overlay for success/error states
 */
const ActionFeedback = styled.div<{
  readonly state: ActionState;
  readonly visible: boolean;
}>`
  /* Positioning */
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  z-index: 10;
  
  /* Layout */
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  
  /* Styling */
  background: ${({ state }) => {
    switch (state) {
      case 'success': return 'var(--actions-success)';
      case 'error': return 'var(--actions-danger)';
      default: return 'var(--actions-primary)';
    }
  }};
  color: white;
  border-radius: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  
  /* Animation */
  opacity: ${({ visible }) => visible ? 1 : 0};
  transform: scale(${({ visible }) => visible ? 1 : 0.95});
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }
`;

/**
 * Confirmation dialog for destructive actions
 */
const ConfirmDialog = styled.div<{
  readonly visible: boolean;
}>`
  /* Positioning */
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: ${({ theme }) => theme.spacing[2]};
  
  /* Layout */
  display: ${({ visible }) => visible ? 'flex' : 'none'};
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  
  /* Styling */
  background: var(--actions-bg);
  border: 1px solid var(--actions-secondary);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[3]};
  box-shadow: ${({ theme }) => theme.shadows.md};
  
  /* Animation */
  opacity: ${({ visible }) => visible ? 1 : 0};
  transform: translateY(${({ visible }) => visible ? '0' : '-8px'});
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }
`;

/**
 * Confirmation dialog message
 */
const ConfirmMessage = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: var(--actions-secondary);
  line-height: ${({ theme }) => theme.typography.lineHeight.normal};
`;

/**
 * Confirmation dialog actions
 */
const ConfirmActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
`;

/**
 * Default quick actions with comprehensive definitions
 */
const DEFAULT_QUICK_ACTIONS: readonly QuickActionDef[] = [
  {
    id: 'generate',
    label: 'Generate',
    description: 'Generate AI-powered response',
    icon: '✨',
    shortcut: '⌘G',
    variant: 'primary',
    loadingText: 'Generating...',
    successText: 'Generated!',
    errorText: 'Generation failed',
  },
  {
    id: 'copy',
    label: 'Copy',
    description: 'Copy content to clipboard',
    icon: '📋',
    shortcut: '⌘C',
    variant: 'secondary',
    loadingText: 'Copying...',
    successText: 'Copied!',
    errorText: 'Copy failed',
  },
  {
    id: 'clear',
    label: 'Clear',
    description: 'Clear current text',
    icon: '🗑️',
    shortcut: '⌘K',
    variant: 'danger',
    confirmRequired: true,
    confirmMessage: 'Are you sure you want to clear the current text? This action cannot be undone.',
    loadingText: 'Clearing...',
    successText: 'Cleared!',
    errorText: 'Clear failed',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open keyboard settings',
    icon: '⚙️',
    shortcut: '⌘,',
    variant: 'ghost',
    loadingText: 'Opening...',
    successText: 'Opened!',
    errorText: 'Settings unavailable',
  },
  {
    id: 'help',
    label: 'Help',
    description: 'Show help and tutorials',
    icon: '❓',
    shortcut: '⌘?',
    variant: 'ghost',
    loadingText: 'Loading...',
    successText: 'Help opened!',
    errorText: 'Help unavailable',
  },
] as const;

/**
 * QuickActions component implementation
 */
export const QuickActions = forwardRef<HTMLDivElement, QuickActionsProps>(
  (props, ref) => {
    const {
      platform,
      size = 'sm',
      targetElement,
      actions = DEFAULT_QUICK_ACTIONS,
      layout = 'horizontal',
      showLabels = true,
      showShortcuts = false,
      showTooltips = true,
      maxActions = 8,
      loading = false,
      disabled = false,
      className,
      style,
      onActionExecute,
      onActionStateChange,
      onClipboardCopy,
      onClearConfirm,
      onSettingsOpen,
      onHelpOpen,
      onGenerate,
    } = props;

    // Component state
    const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
    const [feedbackVisible, setFeedbackVisible] = useState<Record<string, boolean>>({});
    const [confirmVisible, setConfirmVisible] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<QuickActionDef | null>(null);

    // Refs for managing interactions
    const containerRef = useRef<HTMLDivElement>(null);
    const feedbackTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

    // Filter actions by platform and limit
    const filteredActions = useMemo(() => {
      return actions
        .filter(action => !action.platforms || action.platforms.includes(platform))
        .slice(0, maxActions);
    }, [actions, platform, maxActions]);

    // Update action state with feedback
    const updateActionState = useCallback((actionId: QuickAction, state: ActionState): void => {
      setActionStates(prev => ({ ...prev, [actionId]: state }));
      onActionStateChange?.(actionId, state);

      // Show feedback for success/error states
      if (state === 'success' || state === 'error') {
        setFeedbackVisible(prev => ({ ...prev, [actionId]: true }));
        
        // Clear existing timeout
        if (feedbackTimeouts.current[actionId]) {
          clearTimeout(feedbackTimeouts.current[actionId]);
        }
        
        // Hide feedback after delay
        feedbackTimeouts.current[actionId] = setTimeout(() => {
          setFeedbackVisible(prev => ({ ...prev, [actionId]: false }));
          setActionStates(prev => ({ ...prev, [actionId]: 'idle' }));
        }, 2000);
      }
    }, [onActionStateChange]);

    // Handle action execution with comprehensive error handling
    const handleActionExecute = useCallback(async (action: QuickActionDef): Promise<void> => {
      if (disabled || loading || actionStates[action.id] === 'loading') {
        return;
      }

      try {
        // Check if confirmation is required
        if (action.confirmRequired && confirmVisible !== action.id) {
          setConfirmAction(action);
          setConfirmVisible(action.id);
          return;
        }

        // Clear confirmation state
        setConfirmVisible(null);
        setConfirmAction(null);

        // Update to loading state
        updateActionState(action.id, 'loading');

        // Handle specific actions with built-in functionality
        switch (action.id) {
          case 'copy':
            if (onClipboardCopy && targetElement?.textArea) {
              const text = (targetElement.textArea as HTMLInputElement | HTMLTextAreaElement).value || 
                          targetElement.textArea.textContent || '';
              await onClipboardCopy(text);
            } else {
              // Fallback to navigator clipboard
              const text = targetElement?.textArea ? 
                (targetElement.textArea as HTMLInputElement | HTMLTextAreaElement).value || 
                targetElement.textArea.textContent || '' : '';
              await navigator.clipboard.writeText(text);
            }
            updateActionState(action.id, 'success');
            break;

          case 'clear':
            if (onClearConfirm) {
              const confirmed = await onClearConfirm();
              if (!confirmed) {
                updateActionState(action.id, 'idle');
                return;
              }
            }
            
            // Execute clear action
            if (targetElement) {
              await onActionExecute({ action: action.id, targetElement });
            }
            updateActionState(action.id, 'success');
            break;

          case 'settings':
            if (onSettingsOpen) {
              onSettingsOpen();
            } else if (targetElement) {
              await onActionExecute({ action: action.id, targetElement });
            }
            updateActionState(action.id, 'success');
            break;

          case 'help':
            if (onHelpOpen) {
              onHelpOpen();
            } else if (targetElement) {
              await onActionExecute({ action: action.id, targetElement });
            }
            updateActionState(action.id, 'success');
            break;

          case 'generate':
            if (onGenerate) {
              await onGenerate();
            } else if (targetElement) {
              await onActionExecute({ action: action.id, targetElement });
            }
            updateActionState(action.id, 'success');
            break;

          default:
            // Execute custom action
            if (targetElement) {
              await onActionExecute({ action: action.id, targetElement });
            }
            updateActionState(action.id, 'success');
            break;
        }
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Action '${action.id}' failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        console.error('Action execution error:', error);
        updateActionState(action.id, 'error');
      }
    }, [
      disabled,
      loading,
      actionStates,
      confirmVisible,
      updateActionState,
      onActionExecute,
      onClipboardCopy,
      onClearConfirm,
      onSettingsOpen,
      onHelpOpen,
      onGenerate,
      targetElement,
      platform,
    ]);

    // Handle confirmation dialog
    const handleConfirm = useCallback((confirmed: boolean): void => {
      if (confirmed && confirmAction) {
        void handleActionExecute(confirmAction);
      } else {
        setConfirmVisible(null);
        setConfirmAction(null);
      }
    }, [confirmAction, handleActionExecute]);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>): void => {
      // Check for action shortcuts
      const shortcutAction = filteredActions.find(action => {
        if (!action.shortcut) return false;
        
        const shortcut = action.shortcut.toLowerCase();
        const key = e.key.toLowerCase();
        const hasCmd = e.metaKey || e.ctrlKey;
        const hasShift = e.shiftKey;
        
        // Handle common shortcuts
        if (shortcut.includes('⌘') && hasCmd) {
          const shortcutKey = shortcut.replace(/⌘|\s/g, '');
          return key === shortcutKey || (shortcut.includes('?') && key === '/' && hasShift);
        }
        
        return false;
      });

      if (shortcutAction) {
        e.preventDefault();
        void handleActionExecute(shortcutAction);
      }
    }, [filteredActions, handleActionExecute]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        Object.values(feedbackTimeouts.current).forEach(timeout => {
          clearTimeout(timeout);
        });
      };
    }, []);

    return (
      <ActionsContainer
        ref={ref}
        platform={platform}
        size={size}
        layout={layout}
        className={className}
        style={style}
        onKeyDown={handleKeyDown}
        role="toolbar"
        aria-label="Quick actions"
      >
        {filteredActions.map((action) => {
          const actionState = actionStates[action.id] ?? 'idle';
          const isLoading = actionState === 'loading' || loading;
          const isDisabled = disabled || (action.disabled ?? false) || isLoading;

          // Build button content
          const buttonContent: ButtonContent = {
            icon: action.icon,
            label: showLabels ? action.label : '',
            shortcut: showShortcuts ? action.shortcut : undefined,
            description: showTooltips ? action.description : undefined,
          };

          // Determine button text based on state
          let displayText = action.label;
          if (isLoading && action.loadingText) {
            displayText = action.loadingText;
          } else if (actionState === 'success' && action.successText) {
            displayText = action.successText;
          } else if (actionState === 'error' && action.errorText) {
            displayText = action.errorText;
          }

          return (
            <div key={action.id} style={{ position: 'relative' }}>
              <KeyboardButton
                platform={platform}
                variant={action.variant}
                size={size}
                content={{
                  ...buttonContent,
                  label: showLabels ? displayText : '',
                }}
                action={action.id}
                loading={isLoading}
                disabled={isDisabled}
                showTooltip={showTooltips}
                onClick={() => handleActionExecute(action)}
                aria-label={`${action.description}${action.shortcut ? `. Shortcut: ${action.shortcut}` : ''}`}
              />

              {/* Action feedback overlay */}
              <ActionFeedback
                state={actionState}
                visible={feedbackVisible[action.id] || false}
              >
                {actionState === 'success' ? '✓' : actionState === 'error' ? '✗' : '⟳'}
              </ActionFeedback>

              {/* Confirmation dialog */}
              {confirmVisible === action.id && (
                <ConfirmDialog visible={true}>
                  <ConfirmMessage>
                    {action.confirmMessage ?? `Are you sure you want to ${action.label.toLowerCase()}?`}
                  </ConfirmMessage>
                  <ConfirmActions>
                    <KeyboardButton
                      platform={platform}
                      variant="ghost"
                      size="xs"
                      content="Cancel"
                      onClick={() => handleConfirm(false)}
                    />
                    <KeyboardButton
                      platform={platform}
                      variant={action.variant}
                      size="xs"
                      content="Confirm"
                      onClick={() => handleConfirm(true)}
                    />
                  </ConfirmActions>
                </ConfirmDialog>
              )}
            </div>
          );
        })}

        {/* Screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
          }}
        >
          {Object.entries(actionStates)
            .filter(([, state]) => state === 'success' || state === 'error')
            .map(([actionId, state]) => {
              const action = filteredActions.find(a => a.id === actionId);
              return action ? `${action.label} ${state === 'success' ? 'completed' : 'failed'}` : '';
            })
            .join(', ')}
        </div>
      </ActionsContainer>
    );
  }
);

// Set display name for debugging
QuickActions.displayName = 'QuickActions';