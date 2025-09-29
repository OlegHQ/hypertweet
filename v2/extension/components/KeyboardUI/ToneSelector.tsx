/**
 * ToneSelector component - Sophisticated tone selection interface with search and categorization
 *
 * Provides an advanced tone selection system with dropdown interface, visual previews,
 * search functionality, categorization, and user preference management.
 *
 * Features:
 * - Expandable dropdown with smooth animations
 * - Visual tone previews with examples and descriptions
 * - Search and filter functionality across tone collections
 * - Category-based organization (professional, casual, creative, etc.)
 * - Recent and favorite tone shortcuts for quick access
 * - User-defined custom tone support with persistence
 * - Platform-specific tone recommendations
 * - Accessibility with full keyboard navigation and screen reader support
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
  type ChangeEvent,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import { KeyboardButton } from './KeyboardButton.js';
import {
  type Platform,
  type TonePreset,
  type ToneMode,
  type ToneActionHandler,
  type KeyboardSize,
  createKeyboardError,
} from './types.js';

/**
 * Tone category for organization and filtering
 */
export type ToneCategory = 
  | 'all'
  | 'professional' 
  | 'casual' 
  | 'friendly' 
  | 'formal' 
  | 'creative'
  | 'recent'
  | 'favorites'
  | 'custom';

/**
 * Tone search and filter configuration
 */
export interface ToneFilterConfig {
  readonly category: ToneCategory;
  readonly searchQuery: string;
  readonly platformFilter?: Platform;
  readonly sortBy: 'name' | 'usage' | 'recent' | 'category';
  readonly showDescriptions: boolean;
}

/**
 * Custom tone definition for user-created tones
 */
export interface CustomTone {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly category: ToneCategory;
  readonly created: number;
  readonly modified: number;
  readonly usage: {
    readonly count: number;
    readonly lastUsed: number;
  };
}

/**
 * Props interface for ToneSelector component
 */
export interface ToneSelectorProps {
  readonly platform: Platform;
  readonly size?: KeyboardSize;
  readonly mode?: ToneMode;
  readonly selectedTone?: string;
  readonly expanded?: boolean;
  readonly tonePresets?: readonly TonePreset[];
  readonly customTones?: readonly CustomTone[];
  readonly recentTones?: readonly string[];
  readonly favoriteTones?: readonly string[];
  readonly maxRecent?: number;
  readonly maxVisible?: number;
  readonly showSearch?: boolean;
  readonly showCategories?: boolean;
  readonly showPreview?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onToneSelect: ToneActionHandler;
  readonly onTonePreview?: (tone: string, content: string) => void;
  readonly onToggleExpanded?: (expanded: boolean) => void;
  readonly onAddToFavorites?: (toneId: string) => void;
  readonly onRemoveFromFavorites?: (toneId: string) => void;
  readonly onCreateCustomTone?: (tone: CustomTone) => void;
  readonly onEditCustomTone?: (tone: CustomTone) => void;
  readonly onDeleteCustomTone?: (toneId: string) => void;
}

/**
 * Get platform-specific styling for tone selector
 */
const getPlatformSelectorStyles = (platform: Platform, theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.sm};
  `;

  switch (platform) {
    case 'twitter':
      return `
        ${baseStyles}
        --selector-bg: rgb(255, 255, 255);
        --selector-border: rgb(207, 217, 222);
        --selector-text: rgb(15, 20, 25);
        --selector-accent: rgb(29, 155, 240);
        --selector-hover: rgba(29, 155, 240, 0.1);
        
        @media (prefers-color-scheme: dark) {
          --selector-bg: rgb(21, 24, 28);
          --selector-border: rgb(47, 51, 54);
          --selector-text: rgb(247, 249, 249);
          --selector-hover: rgba(29, 155, 240, 0.1);
        }
      `;
    
    case 'linkedin':
      return `
        ${baseStyles}
        --selector-bg: #ffffff;
        --selector-border: rgba(0, 0, 0, 0.15);
        --selector-text: rgba(0, 0, 0, 0.9);
        --selector-accent: #0a66c2;
        --selector-hover: rgba(10, 102, 194, 0.1);
      `;
    
    case 'reddit':
      return `
        ${baseStyles}
        --selector-bg: #ffffff;
        --selector-border: #edeff1;
        --selector-text: #1c1c1c;
        --selector-accent: #ff4500;
        --selector-hover: rgba(255, 69, 0, 0.1);
        
        @media (prefers-color-scheme: dark) {
          --selector-bg: #1a1a1b;
          --selector-border: #343536;
          --selector-text: #d7dadc;
          --selector-hover: rgba(255, 69, 0, 0.1);
        }
      `;
    
    default:
      return `
        ${baseStyles}
        --selector-bg: ${theme.colors.background.primary};
        --selector-border: ${theme.colors.border.primary};
        --selector-text: ${theme.colors.text.primary};
        --selector-accent: ${theme.colors.interactive.primary};
        --selector-hover: ${theme.colors.background.secondary};
      `;
  }
};

/**
 * Get size-specific styling for tone selector
 */
const getSizeSelectorStyles = (size: KeyboardSize, theme: ThemeType): string => {
  switch (size) {
    case 'xs':
      return `
        --selector-height: 24px;
        --selector-padding: ${theme.spacing[1]} ${theme.spacing[2]};
        --selector-font-size: ${theme.typography.fontSize.xs};
        --selector-dropdown-max-height: 120px;
      `;
    
    case 'sm':
      return `
        --selector-height: 28px;
        --selector-padding: ${theme.spacing[2]} ${theme.spacing[3]};
        --selector-font-size: ${theme.typography.fontSize.sm};
        --selector-dropdown-max-height: 180px;
      `;
    
    case 'md':
      return `
        --selector-height: 32px;
        --selector-padding: ${theme.spacing[2]} ${theme.spacing[4]};
        --selector-font-size: ${theme.typography.fontSize.base};
        --selector-dropdown-max-height: 240px;
      `;
    
    case 'lg':
      return `
        --selector-height: 36px;
        --selector-padding: ${theme.spacing[3]} ${theme.spacing[6]};
        --selector-font-size: ${theme.typography.fontSize.lg};
        --selector-dropdown-max-height: 300px;
      `;
    
    default:
      return getSizeSelectorStyles('sm', theme);
  }
};

/**
 * Main selector container with dropdown functionality
 */
const SelectorContainer = styled.div<{
  readonly platform: Platform;
  readonly size: KeyboardSize;
  readonly expanded: boolean;
}>`
  /* Platform styling */
  ${({ platform, theme }) => getPlatformSelectorStyles(platform, theme)}
  
  /* Size styling */
  ${({ size, theme }) => getSizeSelectorStyles(size, theme)}
  
  /* Layout */
  position: relative;
  width: 100%;
  max-width: 300px;
  
  /* Container styling */
  background: var(--selector-bg);
  border: 1px solid var(--selector-border);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: var(--selector-text);
  
  /* Focus management */
  &:focus-within {
    outline: 2px solid var(--selector-accent);
    outline-offset: 2px;
  }
  
  /* Expanded state */
  ${({ expanded }) => expanded && `
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-bottom-color: transparent;
  `}
`;

/**
 * Selector trigger button
 */
const SelectorTrigger = styled.button<{
  readonly expanded: boolean;
}>`
  /* Reset */
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--selector-height);
  padding: var(--selector-padding);
  
  /* Typography */
  font-family: inherit;
  font-size: var(--selector-font-size);
  color: var(--selector-text);
  text-align: left;
  
  /* Interactions */
  transition: background-color ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  &:hover {
    background: var(--selector-hover);
  }
  
  &:focus-visible {
    outline: none; /* Handled by container */
  }
  
  /* Expanded indicator */
  &::after {
    content: '${({ expanded }) => expanded ? '▲' : '▼'}';
    font-size: 0.8em;
    opacity: 0.7;
    transition: transform ${({ theme }) => theme.transitions.duration.fast}
      ${({ theme }) => theme.transitions.easing.easeOut};
  }
`;

/**
 * Dropdown container with search and options
 */
const DropdownContainer = styled.div<{
  readonly expanded: boolean;
  readonly size: KeyboardSize;
}>`
  /* Positioning */
  position: absolute;
  top: 100%;
  left: -1px;
  right: -1px;
  z-index: 1000;
  
  /* Layout */
  display: ${({ expanded }) => expanded ? 'flex' : 'none'};
  flex-direction: column;
  max-height: var(--selector-dropdown-max-height);
  
  /* Styling */
  background: var(--selector-bg);
  border: 1px solid var(--selector-border);
  border-top: none;
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.md};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  
  /* Animation */
  opacity: ${({ expanded }) => expanded ? 1 : 0};
  transform: translateY(${({ expanded }) => expanded ? '0' : '-8px'});
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  /* Scrolling */
  overflow: hidden;
  
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    transform: none;
  }
`;

/**
 * Search input for filtering tones
 */
const SearchInput = styled.input`
  /* Reset */
  border: none;
  outline: none;
  background: none;
  
  /* Layout */
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  
  /* Typography */
  font-family: inherit;
  font-size: var(--selector-font-size);
  color: var(--selector-text);
  
  /* Styling */
  border-bottom: 1px solid var(--selector-border);
  
  &::placeholder {
    color: var(--selector-text);
    opacity: 0.6;
  }
  
  &:focus {
    background: var(--selector-hover);
  }
`;

/**
 * Category filter tabs
 */
const CategoryTabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-bottom: 1px solid var(--selector-border);
`;

/**
 * Individual category tab
 */
const CategoryTab = styled.button<{
  readonly active: boolean;
}>`
  /* Reset */
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  
  /* Layout */
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  
  /* Typography */
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: var(--selector-text);
  opacity: ${({ active }) => active ? 1 : 0.6};
  
  /* Styling */
  background: ${({ active }) => active ? 'var(--selector-hover)' : 'transparent'};
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  &:hover {
    opacity: 1;
    background: var(--selector-hover);
  }
  
  &:focus-visible {
    outline: 1px solid var(--selector-accent);
    outline-offset: 1px;
  }
`;

/**
 * Tone options list
 */
const ToneOptionsList = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: calc(var(--selector-dropdown-max-height) - 120px);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--selector-border);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--selector-accent);
  }
`;

/**
 * Individual tone option
 */
const ToneOption = styled.button<{
  readonly selected: boolean;
  readonly favorite: boolean;
}>`
  /* Reset */
  background: none;
  border: none;
  outline: none;
  cursor: pointer;
  
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  text-align: left;
  
  /* Typography */
  font-family: inherit;
  font-size: var(--selector-font-size);
  color: var(--selector-text);
  
  /* Styling */
  background: ${({ selected }) => selected ? 'var(--selector-hover)' : 'transparent'};
  transition: background-color ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  &:hover {
    background: var(--selector-hover);
  }
  
  &:focus-visible {
    outline: 1px solid var(--selector-accent);
    outline-offset: -1px;
  }
  
  /* Favorite indicator */
  ${({ favorite }) => favorite && `
    position: relative;
    
    &::before {
      content: '★';
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--selector-accent);
      font-size: 0.8em;
    }
  `}
`;

/**
 * Tone option content
 */
const ToneOptionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * Tone option name
 */
const ToneOptionName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Tone option description
 */
const ToneOptionDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  opacity: 0.7;
  line-height: ${({ theme }) => theme.typography.lineHeight.snug};
`;

/**
 * Empty state message
 */
const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[3]};
  text-align: center;
  color: var(--selector-text);
  opacity: 0.6;
  font-size: var(--selector-font-size);
`;

/**
 * Default tone categories with icons and labels
 */
const DEFAULT_CATEGORIES: readonly { category: ToneCategory; label: string; icon: string }[] = [
  { category: 'all', label: 'All', icon: '📝' },
  { category: 'professional', label: 'Professional', icon: '💼' },
  { category: 'casual', label: 'Casual', icon: '👋' },
  { category: 'friendly', label: 'Friendly', icon: '😊' },
  { category: 'formal', label: 'Formal', icon: '🎩' },
  { category: 'creative', label: 'Creative', icon: '🎨' },
  { category: 'recent', label: 'Recent', icon: '⏰' },
  { category: 'favorites', label: 'Favorites', icon: '⭐' },
  { category: 'custom', label: 'Custom', icon: '⚙️' },
] as const;

/**
 * Default tone presets for demonstration
 */
const DEFAULT_TONE_PRESETS: readonly TonePreset[] = [
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
] as const;

/**
 * ToneSelector component implementation
 */
export const ToneSelector = forwardRef<HTMLDivElement, ToneSelectorProps>(
  (props, ref) => {
    const {
      platform,
      size = 'sm',
      mode = 'quick',
      selectedTone,
      expanded: controlledExpanded,
      tonePresets = DEFAULT_TONE_PRESETS,
      customTones = [],
      recentTones = [],
      favoriteTones = [],
      maxRecent = 5,
      maxVisible = 10,
      showSearch = true,
      showCategories = true,
      showPreview = true,
      placeholder = 'Select tone...',
      className,
      style,
      onToneSelect,
      onTonePreview,
      onToggleExpanded,
      onAddToFavorites,
      onRemoveFromFavorites,
      onCreateCustomTone,
      onEditCustomTone,
      onDeleteCustomTone,
    } = props;

    // Component state
    const [internalExpanded, setInternalExpanded] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<ToneCategory>('all');
    const [focusedIndex, setFocusedIndex] = useState<number>(-1);

    // Refs for managing focus
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Determine expanded state (controlled vs uncontrolled)
    const expanded = controlledExpanded ?? internalExpanded;

    // Filter and sort tones based on current settings
    const filteredTones = useMemo(() => {
      let allTones: Array<TonePreset | CustomTone> = [];

      // Add appropriate tones based on category
      switch (selectedCategory) {
        case 'recent':
          allTones = recentTones
            .slice(0, maxRecent)
            .map(toneId => tonePresets.find(t => t.id === toneId) ?? customTones.find(t => t.id === toneId))
            .filter((tone): tone is TonePreset | CustomTone => Boolean(tone));
          break;
        
        case 'favorites':
          allTones = favoriteTones
            .map(toneId => tonePresets.find(t => t.id === toneId) ?? customTones.find(t => t.id === toneId))
            .filter((tone): tone is TonePreset | CustomTone => Boolean(tone));
          break;
        
        case 'custom':
          allTones = [...customTones];
          break;
        
        case 'all':
          allTones = [...tonePresets, ...customTones];
          break;
        
        default:
          allTones = [...tonePresets, ...customTones].filter(tone => 
            'category' in tone ? tone.category === selectedCategory : false
          );
          break;
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        allTones = allTones.filter(tone =>
          tone.name.toLowerCase().includes(query) ||
          tone.description.toLowerCase().includes(query) ||
          ('tone' in tone ? tone.tone.toLowerCase().includes(query) : 
           'prompt' in tone ? tone.prompt.toLowerCase().includes(query) : false)
        );
      }

      // Apply platform filter
      allTones = allTones.filter(tone =>
        'platforms' in tone ? tone.platforms.includes(platform) : true
      );

      // Sort tones (default by usage, then name)
      allTones.sort((a, b) => {
        // Primary sort by usage count
        const usageDiff = b.usage.count - a.usage.count;
        if (usageDiff !== 0) return usageDiff;
        
        // Secondary sort by last used
        const recentDiff = b.usage.lastUsed - a.usage.lastUsed;
        if (recentDiff !== 0) return recentDiff;
        
        // Tertiary sort by name
        return a.name.localeCompare(b.name);
      });

      return allTones.slice(0, maxVisible);
    }, [
      selectedCategory,
      searchQuery,
      tonePresets,
      customTones,
      recentTones,
      favoriteTones,
      maxRecent,
      maxVisible,
      platform,
    ]);

    // Handle tone selection
    const handleToneSelect = useCallback(async (tone: TonePreset | CustomTone): Promise<void> => {
      try {
        const toneValue = 'tone' in tone ? tone.tone : tone.prompt;
        await onToneSelect({
          tone: toneValue,
          mode,
          targetElement: {} as any, // This will be provided by the parent component
        });

        // Close dropdown after selection
        if (controlledExpanded === undefined) {
          setInternalExpanded(false);
        }
        onToggleExpanded?.(false);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Failed to select tone: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        console.error('Tone selection error:', error);
      }
    }, [onToneSelect, mode, platform, controlledExpanded, onToggleExpanded]);

    // Handle dropdown toggle
    const handleToggle = useCallback((): void => {
      const newExpanded = !expanded;
      
      if (controlledExpanded === undefined) {
        setInternalExpanded(newExpanded);
      }
      onToggleExpanded?.(newExpanded);

      // Focus search input when opening
      if (newExpanded && showSearch) {
        setTimeout(() => {
          searchRef.current?.focus();
        }, 100);
      }
    }, [expanded, controlledExpanded, onToggleExpanded, showSearch]);

    // Handle search input change
    const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
      setSearchQuery(e.target.value);
      setFocusedIndex(-1);
    }, []);

    // Handle category selection
    const handleCategorySelect = useCallback((category: ToneCategory): void => {
      setSelectedCategory(category);
      setFocusedIndex(-1);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>): void => {
      if (!expanded) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          handleToggle();
          triggerRef.current?.focus();
          break;
        
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(filteredTones.length - 1, prev + 1));
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(-1, prev - 1));
          break;
        
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && filteredTones[focusedIndex]) {
            void handleToneSelect(filteredTones[focusedIndex]);
          }
          break;
        
        default:
          break;
      }
    }, [expanded, handleToggle, filteredTones, focusedIndex, handleToneSelect]);

    // Handle favorite toggle
    const handleFavoriteToggle = useCallback((toneId: string, isFavorite: boolean): void => {
      if (isFavorite) {
        onRemoveFromFavorites?.(toneId);
      } else {
        onAddToFavorites?.(toneId);
      }
    }, [onAddToFavorites, onRemoveFromFavorites]);

    // Get selected tone display name
    const selectedToneDisplay = useMemo(() => {
      if (!selectedTone) return placeholder;
      
      const tone = [...tonePresets, ...customTones].find(t => 
        ('tone' in t ? t.tone === selectedTone : 'prompt' in t ? t.prompt === selectedTone : false)
      );
      
      return tone?.name ?? selectedTone;
    }, [selectedTone, tonePresets, customTones, placeholder]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          if (controlledExpanded === undefined) {
            setInternalExpanded(false);
          }
          onToggleExpanded?.(false);
        }
      };

      if (expanded) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [expanded, controlledExpanded, onToggleExpanded]);

    return (
      <SelectorContainer
        ref={containerRef}
        platform={platform}
        size={size}
        expanded={expanded}
        className={className}
        style={style}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={expanded}
        aria-haspopup="listbox"
        aria-label="Tone selector"
      >
        <SelectorTrigger
          ref={triggerRef}
          expanded={expanded}
          onClick={handleToggle}
          aria-label={`Select tone. Current: ${selectedToneDisplay}`}
        >
          <span>{selectedToneDisplay}</span>
        </SelectorTrigger>

        <DropdownContainer expanded={expanded} size={size}>
          {showSearch && (
            <SearchInput
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search tones..."
              aria-label="Search tones"
            />
          )}

          {showCategories && (
            <CategoryTabs>
              {DEFAULT_CATEGORIES.map((cat) => (
                <CategoryTab
                  key={cat.category}
                  active={selectedCategory === cat.category}
                  onClick={() => handleCategorySelect(cat.category)}
                  aria-label={`Filter by ${cat.label}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </CategoryTab>
              ))}
            </CategoryTabs>
          )}

          <ToneOptionsList role="listbox" aria-label="Available tones">
            {filteredTones.length > 0 ? (
              filteredTones.map((tone, index) => {
                const toneId = tone.id;
                const isFavorite = favoriteTones.includes(toneId);
                const isSelected = 'tone' in tone ? 
                  tone.tone === selectedTone : 
                  'prompt' in tone ? tone.prompt === selectedTone : false;

                return (
                  <ToneOption
                    key={toneId}
                    selected={isSelected}
                    favorite={isFavorite}
                    onClick={() => handleToneSelect(tone)}
                    onDoubleClick={() => handleFavoriteToggle(toneId, isFavorite)}
                    role="option"
                    aria-selected={isSelected}
                    aria-label={`${tone.name}. ${tone.description}${isFavorite ? '. Favorited' : ''}`}
                    data-index={index}
                  >
                    <ToneOptionContent>
                      <ToneOptionName>{tone.name}</ToneOptionName>
                      {showPreview && (
                        <ToneOptionDescription>{tone.description}</ToneOptionDescription>
                      )}
                    </ToneOptionContent>
                  </ToneOption>
                );
              })
            ) : (
              <EmptyState>
                {searchQuery ? 'No tones match your search' : 'No tones available'}
              </EmptyState>
            )}
          </ToneOptionsList>
        </DropdownContainer>

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
          {expanded ? `Tone selector expanded. ${filteredTones.length} tones available.` : ''}
        </div>
      </SelectorContainer>
    );
  }
);

// Set display name for debugging
ToneSelector.displayName = 'ToneSelector';