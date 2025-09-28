/**
 * CompactKeyboard component - Demonstration of new KeyboardUI components integration
 *
 * This component showcases how to use the new KeyboardLayout, ButtonGrid, and
 * KeyboardButton components together to create a modern, compact keyboard UI.
 *
 * Features:
 * - Modular component architecture with clear separation of concerns
 * - Responsive layout adapting to different screen sizes and platforms
 * - Enhanced accessibility with comprehensive keyboard navigation
 * - Rich button interactions with tone selection and quick actions
 * - Platform-specific theming that matches native interface conventions
 */

import React, { 
  forwardRef, 
  useCallback, 
  useMemo, 
  useState,
  useRef,
  type CSSProperties,
} from 'react';
import { KeyboardLayout, type KeyboardLayoutProps } from './KeyboardLayout.js';
import { ButtonGrid, type GridItem } from './ButtonGrid.js';
import { KeyboardButton, type ButtonContent } from './KeyboardButton.js';
import {
  type BaseKeyboardProps,
  type ToneActionHandler,
  type QuickActionHandler,
  type QuickAction,
  createKeyboardError,
} from './types.js';

/**
 * Props interface for CompactKeyboard component
 */
export interface CompactKeyboardProps extends Omit<BaseKeyboardProps, 'onToneSelect' | 'onQuickAction'> {
  readonly onToneSelect?: ToneActionHandler;
  readonly onQuickAction?: QuickActionHandler;
  readonly showHeader?: boolean;
  readonly showFooter?: boolean;
  readonly quickTones?: readonly string[];
  readonly quickActions?: readonly QuickAction[];
}

/**
 * Default tone presets for quick access
 */
const DEFAULT_QUICK_TONES = [
  'professional',
  'friendly', 
  'casual',
  'formal',
] as const;

/**
 * Default quick actions for keyboard operations
 */
const DEFAULT_QUICK_ACTIONS: readonly QuickAction[] = [
  'generate',
  'copy',
  'clear',
  'settings',
] as const;

/**
 * CompactKeyboard component implementation
 */
export const CompactKeyboard = forwardRef<HTMLDivElement, CompactKeyboardProps>(
  (props, ref) => {
    const {
      platform,
      targetElement,
      visible = true,
      loading = false,
      error = null,
      mode = 'quick',
      position,
      accessibility,
      className,
      style,
      onToneSelect,
      onQuickAction,
      onStateChange,
      onError,
      onVisibilityChange,
      showHeader = true,
      showFooter = false,
      quickTones = DEFAULT_QUICK_TONES,
      quickActions = DEFAULT_QUICK_ACTIONS,
    } = props;

    // Component state
    const [expanded, setExpanded] = useState<boolean>(false);
    const [announcement, setAnnouncement] = useState<string>('');
    const [activeAction, setActiveAction] = useState<string | null>(null);
    
    const layoutRef = useRef<HTMLDivElement>(null);

    // Create tone button grid items
    const toneGridItems = useMemo((): readonly GridItem[] => {
      return quickTones.map((tone) => {
        const content: ButtonContent = {
          label: tone.charAt(0).toUpperCase() + tone.slice(1),
          description: `Generate ${tone} tone response`,
          icon: getToneIcon(tone),
        };

        return {
          id: `tone-${tone}`,
          content: (
            <KeyboardButton
              platform={platform}
              variant="tone"
              size="sm"
              content={content}
              tone={tone}
              mode={mode}
              loading={loading && activeAction === tone}
              disabled={loading}
              onClick={() => handleToneSelect(tone)}
              onFocus={() => setAnnouncement(`${tone} tone selected`)}
            />
          ),
          group: 'tones',
          priority: tone === 'professional' ? 'high' : 'medium',
          'aria-label': `Generate ${tone} tone response`,
        };
      });
    }, [quickTones, platform, mode, loading, activeAction]);

    // Create action button grid items
    const actionGridItems = useMemo((): readonly GridItem[] => {
      return quickActions.map((action) => {
        const content: ButtonContent = {
          label: getActionLabel(action),
          description: getActionDescription(action),
          icon: getActionIcon(action),
          shortcut: getActionShortcut(action),
        };

        const variant = action === 'generate' ? 'primary' : 
                      action === 'clear' ? 'danger' :
                      action === 'copy' ? 'secondary' : 'ghost';

        return {
          id: `action-${action}`,
          content: (
            <KeyboardButton
              platform={platform}
              variant={variant}
              size="sm"
              content={content}
              action={action}
              mode={mode}
              loading={loading && activeAction === action}
              disabled={loading}
              onClick={() => handleQuickAction(action)}
              onFocus={() => setAnnouncement(`${getActionLabel(action)} action focused`)}
            />
          ),
          group: 'actions',
          priority: action === 'generate' ? 'high' : 'medium',
          'aria-label': getActionDescription(action),
        };
      });
    }, [quickActions, platform, mode, loading, activeAction]);

    // Combine all grid items
    const allGridItems = useMemo(() => [
      ...toneGridItems,
      ...actionGridItems,
    ], [toneGridItems, actionGridItems]);

    // Event handlers with proper error handling
    const handleToneSelect = useCallback(async (tone: string): Promise<void> => {
      try {
        setActiveAction(tone);
        setAnnouncement(`Generating ${tone} tone...`);
        
        await onToneSelect?.({ 
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
        setAnnouncement(`Error generating ${tone} tone`);
      } finally {
        setActiveAction(null);
      }
    }, [onToneSelect, mode, targetElement, platform, onError]);

    const handleQuickAction = useCallback(async (action: QuickAction): Promise<void> => {
      try {
        if (action === 'toggle') {
          setExpanded(prev => !prev);
          setAnnouncement(expanded ? 'Keyboard collapsed' : 'Keyboard expanded');
          return;
        }
        
        setActiveAction(action);
        setAnnouncement(`Executing ${getActionLabel(action)}...`);
        
        await onQuickAction?.({ action, targetElement });
        
        setAnnouncement(`${getActionLabel(action)} completed`);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR', 
          `Failed to execute ${action}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
        setAnnouncement(`Error executing ${action}`);
      } finally {
        setActiveAction(null);
      }
    }, [onQuickAction, targetElement, platform, onError, expanded]);

    // Grid navigation handler
    const handleGridNavigation = useCallback((direction: 'up' | 'down' | 'left' | 'right', currentItem: GridItem): void => {
      const currentIndex = allGridItems.findIndex(item => item.id === currentItem.id);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      
      switch (direction) {
        case 'left':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'right':
          nextIndex = Math.min(allGridItems.length - 1, currentIndex + 1);
          break;
        case 'up':
          // Move up in grid (approximately)
          nextIndex = Math.max(0, currentIndex - 4);
          break;
        case 'down':
          // Move down in grid (approximately)
          nextIndex = Math.min(allGridItems.length - 1, currentIndex + 4);
          break;
      }

      if (nextIndex !== currentIndex) {
        const nextElement = layoutRef.current?.querySelector(`[data-index="${nextIndex}"]`) as HTMLElement;
        nextElement?.focus();
      }
    }, [allGridItems]);

    // Header content with toggle and settings
    const headerContent = useMemo(() => {
      if (!showHeader) return null;

      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: 0.8 }}>
            AI Keyboard
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <KeyboardButton
              platform={platform}
              variant="ghost"
              size="xs"
              content={{
                label: expanded ? '−' : '+',
                description: expanded ? 'Collapse keyboard' : 'Expand keyboard',
              }}
              onClick={() => handleQuickAction('toggle')}
            />
            <KeyboardButton
              platform={platform}
              variant="ghost"
              size="xs"
              content={{
                label: '⚙️',
                description: 'Open keyboard settings',
              }}
              onClick={() => handleQuickAction('settings')}
              disabled={loading}
            />
          </div>
        </div>
      );
    }, [showHeader, expanded, platform, loading, handleQuickAction]);

    // Footer content with status and metrics
    const footerContent = useMemo(() => {
      if (!showFooter) return null;

      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            {mode} mode
          </span>
          {loading && (
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              Processing...
            </span>
          )}
        </div>
      );
    }, [showFooter, mode, loading]);

    // Compute layout props
    const layoutProps: KeyboardLayoutProps = {
      platform,
      size: 'sm',
      animationState: expanded ? 'expanded' : 'collapsed',
      visible,
      accessibility,
      position,
      className,
      style,
      header: headerContent,
      footer: footerContent,
      onKeyDown: (e) => {
        // Handle escape to close
        if (e.key === 'Escape') {
          onVisibilityChange?.(false);
        }
      },
    };

    // Don't render if not visible
    if (!visible) {
      return null;
    }

    return (
      <KeyboardLayout ref={ref} {...layoutProps}>
        {/* Accessibility announcements */}
        {announcement && (
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
            {announcement}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            role="alert"
            style={{
              padding: '0.5rem',
              marginBottom: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'rgb(239, 68, 68)',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ⚠️ {error.message}
          </div>
        )}

        {/* Main button grid */}
        <ButtonGrid
          ref={layoutRef}
          items={allGridItems}
          platform={platform}
          size="sm"
          layout="adaptive"
          columns="auto"
          gap="sm"
          maxRows={expanded ? undefined : 2}
          accessibility={accessibility}
          onKeyboardNavigate={handleGridNavigation}
        />
      </KeyboardLayout>
    );
  }
);

// Helper functions for button content

function getToneIcon(tone: string): string {
  const icons: Record<string, string> = {
    professional: '💼',
    friendly: '😊',
    casual: '👋',
    formal: '🎩',
    creative: '🎨',
    technical: '⚙️',
    persuasive: '💡',
  };
  return icons[tone] ?? '📝';
}

function getActionIcon(action: QuickAction): string {
  const icons: Record<QuickAction, string> = {
    generate: '✨',
    copy: '📋',
    clear: '🗑️',
    settings: '⚙️',
    help: '❓',
    toggle: '⚡',
  };
  return icons[action] ?? '🔧';
}

function getActionLabel(action: QuickAction): string {
  const labels: Record<QuickAction, string> = {
    generate: 'Generate',
    copy: 'Copy',
    clear: 'Clear',
    settings: 'Settings',
    help: 'Help',
    toggle: 'Toggle',
  };
  return labels[action] ?? action;
}

function getActionDescription(action: QuickAction): string {
  const descriptions: Record<QuickAction, string> = {
    generate: 'Generate AI response',
    copy: 'Copy to clipboard',
    clear: 'Clear text',
    settings: 'Open keyboard settings',
    help: 'Show help information',
    toggle: 'Toggle keyboard visibility',
  };
  return descriptions[action] ?? `Execute ${action} action`;
}

function getActionShortcut(action: QuickAction): string | undefined {
  const shortcuts: Record<QuickAction, string | undefined> = {
    generate: '⌘G',
    copy: '⌘C',
    clear: '⌘K',
    settings: '⌘,',
    help: '⌘?',
    toggle: '⌘T',
  };
  return shortcuts[action];
}

// Set display name for debugging
CompactKeyboard.displayName = 'CompactKeyboard';