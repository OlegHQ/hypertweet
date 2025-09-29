/**
 * AdvancedKeyboard component - Comprehensive demonstration of Task C2 components
 *
 * Showcases the integration of ToneSelector, QuickActions, and TonePresets components
 * in a sophisticated keyboard interface that demonstrates advanced tone selection
 * and action management capabilities.
 *
 * Features:
 * - Advanced tone selection with search, categories, and favorites
 * - Comprehensive quick actions with loading states and feedback
 * - Tone preset management with creation, editing, and organization
 * - Seamless integration between all Task C2 components
 * - Platform-specific theming and behavior adaptation
 * - Enhanced user experience with smooth interactions and visual feedback
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
import { ToneSelector, type ToneCategory, type CustomTone } from './ToneSelector.js';
import { QuickActions, type QuickActionDef, type ActionState } from './QuickActions.js';
import { TonePresets, type ToneCollection, type ToneUsageStats } from './TonePresets.js';
import {
  type BaseKeyboardProps,
  type TonePreset,
  type ToneActionHandler,
  type QuickActionHandler,
  type QuickAction,
  createKeyboardError,
} from './types.js';

/**
 * Advanced keyboard mode for different interaction patterns
 */
export type AdvancedKeyboardMode = 'selector' | 'actions' | 'presets' | 'integrated';

/**
 * Props interface for AdvancedKeyboard component
 */
export interface AdvancedKeyboardProps extends Omit<BaseKeyboardProps, 'onToneSelect' | 'onQuickAction'> {
  readonly keyboardMode?: AdvancedKeyboardMode;
  readonly onToneSelect?: ToneActionHandler;
  readonly onQuickAction?: QuickActionHandler;
  readonly showSearch?: boolean;
  readonly showCategories?: boolean;
  readonly showPreview?: boolean;
  readonly showPresets?: boolean;
  readonly allowCustomTones?: boolean;
  readonly maxRecentTones?: number;
  readonly maxVisibleTones?: number;
  readonly tonePresets?: readonly TonePreset[];
  readonly customTones?: readonly CustomTone[];
  readonly favoriteTones?: readonly string[];
  readonly recentTones?: readonly string[];
  readonly usageStats?: Record<string, ToneUsageStats>;
  readonly onToneCreate?: (tone: Omit<CustomTone, 'id' | 'created' | 'modified' | 'usage'>) => Promise<CustomTone>;
  readonly onToneUpdate?: (tone: CustomTone) => Promise<void>;
  readonly onToneDelete?: (toneId: string) => Promise<void>;
  readonly onFavoriteToggle?: (toneId: string, favorite: boolean) => Promise<void>;
  readonly onUsageUpdate?: (toneId: string, stats: Partial<ToneUsageStats>) => Promise<void>;
}

/**
 * Default tone presets for advanced keyboard
 */
const ADVANCED_TONE_PRESETS: readonly TonePreset[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Business-appropriate tone for professional communication',
    tone: 'professional',
    category: 'professional',
    platforms: ['linkedin', 'twitter', 'reddit'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable tone for social interactions',
    tone: 'friendly',
    category: 'friendly',
    platforms: ['twitter', 'reddit', 'linkedin'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed and informal tone for everyday conversations',
    tone: 'casual',
    category: 'casual',
    platforms: ['twitter', 'reddit'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'formal',
    name: 'Formal',
    description: 'Structured and official tone for formal communications',
    tone: 'formal',
    category: 'formal',
    platforms: ['linkedin'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Imaginative and expressive tone for creative content',
    tone: 'creative',
    category: 'creative',
    platforms: ['twitter', 'reddit'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Precise and detailed tone for technical discussions',
    tone: 'technical',
    category: 'professional',
    platforms: ['reddit', 'linkedin'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'persuasive',
    name: 'Persuasive',
    description: 'Compelling and convincing tone for influential communication',
    tone: 'persuasive',
    category: 'professional',
    platforms: ['linkedin', 'twitter'],
    usage: { count: 0, lastUsed: 0 },
  },
  {
    id: 'empathetic',
    name: 'Empathetic',
    description: 'Understanding and supportive tone for sensitive topics',
    tone: 'empathetic',
    category: 'friendly',
    platforms: ['twitter', 'reddit', 'linkedin'],
    usage: { count: 0, lastUsed: 0 },
  },
] as const;

/**
 * Advanced quick actions with enhanced functionality
 */
const ADVANCED_QUICK_ACTIONS: readonly QuickActionDef[] = [
  {
    id: 'generate',
    label: 'Generate',
    description: 'Generate AI-powered response with selected tone',
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
    successText: 'Settings opened!',
    errorText: 'Settings unavailable',
  },
] as const;

/**
 * AdvancedKeyboard component implementation
 */
export const AdvancedKeyboard = forwardRef<HTMLDivElement, AdvancedKeyboardProps>(
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
      keyboardMode = 'integrated',
      onToneSelect,
      onQuickAction,
      onStateChange,
      onError,
      onVisibilityChange,
      showSearch = true,
      showCategories = true,
      showPreview = true,
      showPresets = true,
      allowCustomTones = true,
      maxRecentTones = 8,
      maxVisibleTones = 20,
      tonePresets = ADVANCED_TONE_PRESETS,
      customTones = [],
      favoriteTones = [],
      recentTones = [],
      usageStats = {},
      onToneCreate,
      onToneUpdate,
      onToneDelete,
      onFavoriteToggle,
      onUsageUpdate,
    } = props;

    // Component state
    const [selectedTone, setSelectedTone] = useState<string>('');
    const [selectorExpanded, setSelectorExpanded] = useState<boolean>(false);
    const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
    const [announcement, setAnnouncement] = useState<string>('');

    const layoutRef = useRef<HTMLDivElement>(null);

    // Handle tone selection with usage tracking
    const handleToneSelect = useCallback(async (params: Parameters<ToneActionHandler>[0]): Promise<void> => {
      try {
        setSelectedTone(params.tone);
        setAnnouncement(`Selected ${params.tone} tone`);
        
        // Update usage statistics
        if (onUsageUpdate) {
          const currentStats = usageStats[params.tone] || {
            totalUses: 0,
            averageRating: 0,
            lastUsed: 0,
            usageByPlatform: {} as Record<typeof platform, number>,
            usageByDay: {},
            successRate: 1,
          };

          await onUsageUpdate(params.tone, {
            ...currentStats,
            totalUses: currentStats.totalUses + 1,
            lastUsed: Date.now(),
            usageByPlatform: {
              ...currentStats.usageByPlatform,
              [platform]: (currentStats.usageByPlatform[platform] || 0) + 1,
            },
          });
        }

        await onToneSelect?.(params);
        setAnnouncement(`${params.tone} tone applied successfully`);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Failed to select tone: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
        setAnnouncement(`Error selecting ${params.tone} tone`);
      }
    }, [onToneSelect, onUsageUpdate, usageStats, platform, onError]);

    // Handle quick actions with state management
    const handleQuickAction = useCallback(async (params: Parameters<QuickActionHandler>[0]): Promise<void> => {
      try {
        setActionStates(prev => ({ ...prev, [params.action]: 'loading' }));
        setAnnouncement(`Executing ${params.action} action`);
        
        await onQuickAction?.(params);
        
        setActionStates(prev => ({ ...prev, [params.action]: 'success' }));
        setAnnouncement(`${params.action} action completed successfully`);

        // Reset action state after feedback
        setTimeout(() => {
          setActionStates(prev => ({ ...prev, [params.action]: 'idle' }));
        }, 2000);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Failed to execute action: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
        setActionStates(prev => ({ ...prev, [params.action]: 'error' }));
        setAnnouncement(`Error executing ${params.action} action`);

        // Reset error state after feedback
        setTimeout(() => {
          setActionStates(prev => ({ ...prev, [params.action]: 'idle' }));
        }, 3000);
      }
    }, [onQuickAction, onError, platform]);

    // Handle custom tone management
    const handleToneCreate = useCallback(async (toneData: Omit<CustomTone, 'id' | 'created' | 'modified' | 'usage'>): Promise<CustomTone> => {
      if (!onToneCreate) {
        throw new Error('Tone creation not supported');
      }
      
      const newTone = await onToneCreate(toneData);
      setAnnouncement(`Created new tone: ${newTone.name}`);
      return newTone;
    }, [onToneCreate]);

    // Handle favorite toggling with feedback
    const handleFavoriteToggle = useCallback(async (toneId: string, favorite: boolean): Promise<void> => {
      try {
        await onFavoriteToggle?.(toneId, favorite);
        const action = favorite ? 'added to' : 'removed from';
        setAnnouncement(`Tone ${action} favorites`);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Failed to update favorites: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        onError?.(error);
      }
    }, [onFavoriteToggle, onError, platform]);

    // Render content based on keyboard mode
    const renderKeyboardContent = useCallback(() => {
      switch (keyboardMode) {
        case 'selector':
          return (
            <ToneSelector
              platform={platform}
              size="sm"
              mode={mode}
              selectedTone={selectedTone}
              expanded={selectorExpanded}
              tonePresets={tonePresets}
              customTones={customTones}
              recentTones={recentTones}
              favoriteTones={favoriteTones}
              maxRecent={maxRecentTones}
              maxVisible={maxVisibleTones}
              showSearch={showSearch}
              showCategories={showCategories}
              showPreview={showPreview}
              onToneSelect={handleToneSelect}
              onToggleExpanded={setSelectorExpanded}
              onAddToFavorites={(toneId) => handleFavoriteToggle(toneId, true)}
              onRemoveFromFavorites={(toneId) => handleFavoriteToggle(toneId, false)}
            />
          );

        case 'actions':
          return (
            <QuickActions
              platform={platform}
              size="sm"
              targetElement={targetElement}
              actions={ADVANCED_QUICK_ACTIONS}
              layout="horizontal"
              showLabels={true}
              showShortcuts={true}
              showTooltips={true}
              loading={loading}
              onActionExecute={handleQuickAction}
              onActionStateChange={(action, state) => {
                setActionStates(prev => ({ ...prev, [action]: state }));
              }}
            />
          );

        case 'presets':
          return showPresets ? (
            <TonePresets
              platform={platform}
              size="sm"
              tonePresets={tonePresets}
              customTones={customTones}
              favoriteTones={favoriteTones}
              recentTones={recentTones}
              usageStats={usageStats}
              mode="compact"
              showStats={true}
              showExport={true}
              showImport={true}
              allowCustom={allowCustomTones}
              allowDelete={allowCustomTones}
              maxVisible={maxVisibleTones}
              maxRecent={maxRecentTones}
              onCreateTone={handleToneCreate}
              onUpdateTone={onToneUpdate}
              onDeleteTone={onToneDelete}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ) : null;

        case 'integrated':
        default:
          return (
            <>
              {/* Tone Selection Section */}
              <div style={{ marginBottom: '1rem' }}>
                <ToneSelector
                  platform={platform}
                  size="sm"
                  mode={mode}
                  selectedTone={selectedTone}
                  tonePresets={tonePresets}
                  customTones={customTones}
                  recentTones={recentTones}
                  favoriteTones={favoriteTones}
                  maxRecent={maxRecentTones}
                  maxVisible={maxVisibleTones}
                  showSearch={showSearch}
                  showCategories={showCategories}
                  showPreview={showPreview}
                  onToneSelect={handleToneSelect}
                  onAddToFavorites={(toneId) => handleFavoriteToggle(toneId, true)}
                  onRemoveFromFavorites={(toneId) => handleFavoriteToggle(toneId, false)}
                />
              </div>

              {/* Quick Actions Section */}
              <div style={{ marginBottom: showPresets ? '1rem' : '0' }}>
                <QuickActions
                  platform={platform}
                  size="sm"
                  targetElement={targetElement}
                  actions={ADVANCED_QUICK_ACTIONS}
                  layout="horizontal"
                  showLabels={true}
                  showShortcuts={false}
                  showTooltips={true}
                  loading={loading}
                  onActionExecute={handleQuickAction}
                  onActionStateChange={(action, state) => {
                    setActionStates(prev => ({ ...prev, [action]: state }));
                  }}
                />
              </div>

              {/* Tone Presets Section */}
              {showPresets && (
                <TonePresets
                  platform={platform}
                  size="sm"
                  tonePresets={tonePresets}
                  customTones={customTones}
                  favoriteTones={favoriteTones}
                  recentTones={recentTones}
                  usageStats={usageStats}
                  mode="compact"
                  showStats={false}
                  showExport={false}
                  showImport={false}
                  allowCustom={allowCustomTones}
                  allowDelete={allowCustomTones}
                  maxVisible={6}
                  maxRecent={maxRecentTones}
                  onCreateTone={handleToneCreate}
                  onUpdateTone={onToneUpdate}
                  onDeleteTone={onToneDelete}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              )}
            </>
          );
      }
    }, [
      keyboardMode,
      platform,
      mode,
      selectedTone,
      selectorExpanded,
      tonePresets,
      customTones,
      recentTones,
      favoriteTones,
      maxRecentTones,
      maxVisibleTones,
      showSearch,
      showCategories,
      showPreview,
      showPresets,
      allowCustomTones,
      usageStats,
      loading,
      targetElement,
      handleToneSelect,
      handleQuickAction,
      handleToneCreate,
      handleFavoriteToggle,
      onToneUpdate,
      onToneDelete,
    ]);

    // Layout props
    const layoutProps: KeyboardLayoutProps = {
      platform,
      size: 'md',
      visible,
      accessibility,
      position,
      className,
      style,
      header: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: 0.8 }}>
            Advanced AI Keyboard
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            {selectedTone ? `Tone: ${selectedTone}` : 'No tone selected'}
          </span>
        </div>
      ),
      onKeyDown: (e) => {
        if (e.key === 'Escape') {
          onVisibilityChange?.(false);
        }
      },
    };

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

        {/* Main keyboard content */}
        {renderKeyboardContent()}
      </KeyboardLayout>
    );
  }
);

// Set display name for debugging
AdvancedKeyboard.displayName = 'AdvancedKeyboard';