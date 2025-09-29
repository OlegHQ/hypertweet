/**
 * TonePresets component - Comprehensive tone preset management system
 *
 * Provides advanced management for tone presets with creation, editing, organization,
 * and usage tracking capabilities for both built-in and user-defined tones.
 *
 * Features:
 * - Preset tone configuration and management interface
 * - User-defined custom tone creation and editing
 * - Recent usage tracking with intelligent suggestions
 * - Favorite tone management with quick access
 * - Category-based organization and filtering
 * - Import/export functionality for tone collections
 * - Usage analytics and tone performance metrics
 * - Comprehensive search and filtering capabilities
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
  type FormEvent,
} from 'react';
import styled from '@emotion/styled';
import { type ThemeType } from '../../styles/theme.js';
import { KeyboardButton, type ButtonContent } from './KeyboardButton.js';
import { ToneSelector, type ToneCategory, type CustomTone } from './ToneSelector.js';
import {
  type Platform,
  type TonePreset,
  type KeyboardSize,
  createKeyboardError,
} from './types.js';

/**
 * Tone preset management action types
 */
export type PresetAction = 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'duplicate' 
  | 'export' 
  | 'import'
  | 'favorite'
  | 'unfavorite'
  | 'reset';

/**
 * Tone collection for import/export
 */
export interface ToneCollection {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly created: number;
  readonly presets: readonly TonePreset[];
  readonly customTones: readonly CustomTone[];
  readonly metadata: {
    readonly author?: string;
    readonly tags?: readonly string[];
    readonly platform?: Platform;
  };
}

/**
 * Tone usage statistics
 */
export interface ToneUsageStats {
  readonly totalUses: number;
  readonly averageRating: number;
  readonly lastUsed: number;
  readonly usageByPlatform: Record<Platform, number>;
  readonly usageByDay: Record<string, number>;
  readonly successRate: number;
}

/**
 * Props interface for TonePresets component
 */
export interface TonePresetsProps {
  readonly platform: Platform;
  readonly size?: KeyboardSize;
  readonly tonePresets?: readonly TonePreset[];
  readonly customTones?: readonly CustomTone[];
  readonly favoriteTones?: readonly string[];
  readonly recentTones?: readonly string[];
  readonly usageStats?: Record<string, ToneUsageStats>;
  readonly mode?: 'compact' | 'expanded' | 'management';
  readonly showStats?: boolean;
  readonly showExport?: boolean;
  readonly showImport?: boolean;
  readonly maxVisible?: number;
  readonly maxRecent?: number;
  readonly allowCustom?: boolean;
  readonly allowDelete?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly onPresetAction?: (action: PresetAction, preset: TonePreset | CustomTone, data?: unknown) => Promise<void>;
  readonly onCreateTone?: (tone: Omit<CustomTone, 'id' | 'created' | 'modified' | 'usage'>) => Promise<CustomTone>;
  readonly onUpdateTone?: (tone: CustomTone) => Promise<void>;
  readonly onDeleteTone?: (toneId: string) => Promise<void>;
  readonly onFavoriteToggle?: (toneId: string, favorite: boolean) => Promise<void>;
  readonly onImportCollection?: (collection: ToneCollection) => Promise<void>;
  readonly onExportCollection?: (toneIds: readonly string[]) => Promise<ToneCollection>;
  readonly onUsageUpdate?: (toneId: string, stats: Partial<ToneUsageStats>) => Promise<void>;
}

/**
 * Form data for creating/editing tones
 */
interface ToneFormData {
  readonly name: string;
  readonly description: string;
  readonly prompt: string;
  readonly category: ToneCategory;
}

/**
 * Get platform-specific preset styling
 */
const getPlatformPresetStyles = (platform: Platform, theme: ThemeType): string => {
  const baseStyles = `
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.sm};
  `;

  switch (platform) {
    case 'twitter':
      return `
        ${baseStyles}
        --presets-bg: rgb(255, 255, 255);
        --presets-border: rgb(207, 217, 222);
        --presets-text: rgb(15, 20, 25);
        --presets-accent: rgb(29, 155, 240);
        --presets-hover: rgba(29, 155, 240, 0.1);
        --presets-success: rgb(0, 186, 124);
        --presets-danger: rgb(244, 33, 46);
        
        @media (prefers-color-scheme: dark) {
          --presets-bg: rgb(21, 24, 28);
          --presets-border: rgb(47, 51, 54);
          --presets-text: rgb(247, 249, 249);
          --presets-hover: rgba(29, 155, 240, 0.1);
        }
      `;
    
    case 'linkedin':
      return `
        ${baseStyles}
        --presets-bg: #ffffff;
        --presets-border: rgba(0, 0, 0, 0.15);
        --presets-text: rgba(0, 0, 0, 0.9);
        --presets-accent: #0a66c2;
        --presets-hover: rgba(10, 102, 194, 0.1);
        --presets-success: #057642;
        --presets-danger: #cc1016;
      `;
    
    case 'reddit':
      return `
        ${baseStyles}
        --presets-bg: #ffffff;
        --presets-border: #edeff1;
        --presets-text: #1c1c1c;
        --presets-accent: #ff4500;
        --presets-hover: rgba(255, 69, 0, 0.1);
        --presets-success: #46d160;
        --presets-danger: #ea0027;
        
        @media (prefers-color-scheme: dark) {
          --presets-bg: #1a1a1b;
          --presets-border: #343536;
          --presets-text: #d7dadc;
          --presets-hover: rgba(255, 69, 0, 0.1);
        }
      `;
    
    default:
      return `
        ${baseStyles}
        --presets-bg: ${theme.colors.background.primary};
        --presets-border: ${theme.colors.border.primary};
        --presets-text: ${theme.colors.text.primary};
        --presets-accent: ${theme.colors.interactive.primary};
        --presets-hover: ${theme.colors.background.secondary};
        --presets-success: ${theme.colors.status.success};
        --presets-danger: ${theme.colors.interactive.danger};
      `;
  }
};

/**
 * Main presets container
 */
const PresetsContainer = styled.div<{
  readonly platform: Platform;
  readonly size: KeyboardSize;
  readonly mode: 'compact' | 'expanded' | 'management';
}>`
  /* Platform theming */
  ${({ platform, theme }) => getPlatformPresetStyles(platform, theme)}
  
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  width: 100%;
  
  /* Sizing based on mode */
  ${({ mode }) => {
    switch (mode) {
      case 'compact':
        return `max-height: 200px; overflow-y: auto;`;
      case 'expanded':
        return `max-height: 400px; overflow-y: auto;`;
      case 'management':
        return `min-height: 300px; max-height: 600px; overflow-y: auto;`;
      default:
        return '';
    }
  }}
  
  /* Styling */
  background: var(--presets-bg);
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing[3]};
  color: var(--presets-text);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--presets-border);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: var(--presets-accent);
  }
`;

/**
 * Presets header with actions
 */
const PresetsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  padding-bottom: ${({ theme }) => theme.spacing[2]};
  border-bottom: 1px solid var(--presets-border);
`;

/**
 * Header title
 */
const HeaderTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: var(--presets-text);
`;

/**
 * Header actions
 */
const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Preset list container
 */
const PresetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

/**
 * Individual preset item
 */
const PresetItem = styled.div<{
  readonly favorite: boolean;
  readonly recent: boolean;
}>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: ${({ favorite, recent }) => 
    favorite ? 'var(--presets-hover)' : 
    recent ? 'rgba(var(--presets-accent), 0.05)' : 
    'transparent'};
  transition: all ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  
  &:hover {
    background: var(--presets-hover);
    border-color: var(--presets-accent);
  }
  
  /* Favorite indicator */
  ${({ favorite }) => favorite && `
    position: relative;
    
    &::before {
      content: '★';
      position: absolute;
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--presets-accent);
      font-size: 0.8em;
    }
  `}
`;

/**
 * Preset content
 */
const PresetContent = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * Preset name
 */
const PresetName = styled.div`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: var(--presets-text);
  margin-bottom: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Preset description
 */
const PresetDescription = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: var(--presets-text);
  opacity: 0.7;
  line-height: ${({ theme }) => theme.typography.lineHeight.snug};
`;

/**
 * Preset actions
 */
const PresetActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Preset stats
 */
const PresetStats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: var(--presets-text);
  opacity: 0.6;
`;

/**
 * Form container for creating/editing tones
 */
const ToneForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]};
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: var(--presets-bg);
`;

/**
 * Form field
 */
const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[1]};
`;

/**
 * Form label
 */
const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: var(--presets-text);
`;

/**
 * Form input
 */
const FormInput = styled.input`
  padding: ${({ theme }) => theme.spacing[2]};
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: var(--presets-bg);
  color: var(--presets-text);
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: var(--presets-accent);
    box-shadow: 0 0 0 2px rgba(var(--presets-accent), 0.2);
  }
  
  &::placeholder {
    color: var(--presets-text);
    opacity: 0.5;
  }
`;

/**
 * Form textarea
 */
const FormTextarea = styled.textarea`
  padding: ${({ theme }) => theme.spacing[2]};
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: var(--presets-bg);
  color: var(--presets-text);
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--presets-accent);
    box-shadow: 0 0 0 2px rgba(var(--presets-accent), 0.2);
  }
  
  &::placeholder {
    color: var(--presets-text);
    opacity: 0.5;
  }
`;

/**
 * Form select
 */
const FormSelect = styled.select`
  padding: ${({ theme }) => theme.spacing[2]};
  border: 1px solid var(--presets-border);
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: var(--presets-bg);
  color: var(--presets-text);
  font-family: inherit;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: var(--presets-accent);
    box-shadow: 0 0 0 2px rgba(var(--presets-accent), 0.2);
  }
`;

/**
 * Form actions
 */
const FormActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[2]};
  justify-content: flex-end;
`;

/**
 * Empty state
 */
const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[3]};
  color: var(--presets-text);
  opacity: 0.6;
`;

/**
 * Default categories for tone creation
 */
const TONE_CATEGORIES: readonly { value: ToneCategory; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'creative', label: 'Creative' },
  { value: 'custom', label: 'Custom' },
] as const;

/**
 * TonePresets component implementation
 */
export const TonePresets = forwardRef<HTMLDivElement, TonePresetsProps>(
  (props, ref) => {
    const {
      platform,
      size = 'sm',
      tonePresets = [],
      customTones = [],
      favoriteTones = [],
      recentTones = [],
      usageStats = {},
      mode = 'compact',
      showStats = true,
      showExport = true,
      showImport = true,
      maxVisible = 20,
      maxRecent = 5,
      allowCustom = true,
      allowDelete = true,
      className,
      style,
      onPresetAction,
      onCreateTone,
      onUpdateTone,
      onDeleteTone,
      onFavoriteToggle,
      onImportCollection,
      onExportCollection,
      onUsageUpdate,
    } = props;

    // Component state
    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingTone, setEditingTone] = useState<CustomTone | null>(null);
    const [formData, setFormData] = useState<ToneFormData>({
      name: '',
      description: '',
      prompt: '',
      category: 'custom',
    });
    const [selectedTones, setSelectedTones] = useState<Set<string>>(new Set());

    // Refs for form management
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Combine all tones for display
    const allTones = useMemo(() => {
      const combined: Array<(TonePreset | CustomTone) & { type: 'preset' | 'custom' }> = [
        ...tonePresets.map(tone => ({ ...tone, type: 'preset' as const })),
        ...customTones.map(tone => ({ ...tone, type: 'custom' as const })),
      ];

      // Sort by recent usage, then favorites, then alphabetical
      return combined
        .sort((a, b) => {
          const aIsRecent = recentTones.includes(a.id);
          const bIsRecent = recentTones.includes(b.id);
          const aIsFavorite = favoriteTones.includes(a.id);
          const bIsFavorite = favoriteTones.includes(b.id);

          if (aIsRecent !== bIsRecent) return aIsRecent ? -1 : 1;
          if (aIsFavorite !== bIsFavorite) return aIsFavorite ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, maxVisible);
    }, [tonePresets, customTones, recentTones, favoriteTones, maxVisible]);

    // Handle form submission
    const handleFormSubmit = useCallback(async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
      
      if (!formData.name.trim() || !formData.prompt.trim()) {
        return;
      }

      try {
        if (editingTone) {
          // Update existing tone
          const updatedTone: CustomTone = {
            ...editingTone,
            name: formData.name.trim(),
            description: formData.description.trim(),
            prompt: formData.prompt.trim(),
            category: formData.category,
            modified: Date.now(),
          };
          
          await onUpdateTone?.(updatedTone);
        } else {
          // Create new tone
          const newToneData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            prompt: formData.prompt.trim(),
            category: formData.category,
          };
          
          await onCreateTone?.(newToneData);
        }

        // Reset form
        setFormData({
          name: '',
          description: '',
          prompt: '',
          category: 'custom',
        });
        setShowForm(false);
        setEditingTone(null);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Failed to ${editingTone ? 'update' : 'create'} tone: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        console.error('Tone form error:', error);
      }
    }, [formData, editingTone, onCreateTone, onUpdateTone, platform]);

    // Handle form input changes
    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handle tone actions
    const handleToneAction = useCallback(async (action: PresetAction, tone: TonePreset | CustomTone): Promise<void> => {
      try {
        switch (action) {
          case 'edit':
            if ('prompt' in tone) {
              setEditingTone(tone);
              setFormData({
                name: tone.name,
                description: tone.description,
                prompt: tone.prompt,
                category: tone.category,
              });
              setShowForm(true);
            }
            break;

          case 'delete':
            if (allowDelete && ('prompt' in tone)) {
              await onDeleteTone?.(tone.id);
            }
            break;

          case 'favorite':
            await onFavoriteToggle?.(tone.id, true);
            break;

          case 'unfavorite':
            await onFavoriteToggle?.(tone.id, false);
            break;

          case 'duplicate':
            if (allowCustom) {
              const duplicatedTone = {
                name: `${tone.name} (Copy)`,
                description: tone.description,
                prompt: 'tone' in tone ? tone.tone : tone.prompt,
                category: 'category' in tone ? tone.category : 'custom' as ToneCategory,
              };
              await onCreateTone?.(duplicatedTone);
            }
            break;

          default:
            await onPresetAction?.(action, tone);
            break;
        }
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Action '${action}' failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        console.error('Tone action error:', error);
      }
    }, [allowDelete, allowCustom, onDeleteTone, onFavoriteToggle, onCreateTone, onPresetAction, platform]);

    // Handle import
    const handleImport = useCallback((): void => {
      fileInputRef.current?.click();
    }, []);

    // Handle file selection for import
    const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const collection: ToneCollection = JSON.parse(text);
        await onImportCollection?.(collection);
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Import failed: ${err instanceof Error ? err.message : 'Invalid file format'}`,
          platform
        );
        console.error('Import error:', error);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, [onImportCollection, platform]);

    // Handle export
    const handleExport = useCallback(async (): Promise<void> => {
      try {
        const exportIds = selectedTones.size > 0 ? Array.from(selectedTones) : allTones.map(t => t.id);
        const collection = await onExportCollection?.(exportIds);
        
        if (collection) {
          // Create download link
          const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${collection.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        const error = createKeyboardError(
          'API_ERROR',
          `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          platform
        );
        console.error('Export error:', error);
      }
    }, [selectedTones, allTones, onExportCollection, platform]);

    return (
      <PresetsContainer
        ref={ref}
        platform={platform}
        size={size}
        mode={mode}
        className={className}
        style={style}
        role="region"
        aria-label="Tone presets management"
      >
        {/* Header with actions */}
        <PresetsHeader>
          <HeaderTitle>Tone Presets</HeaderTitle>
          <HeaderActions>
            {allowCustom && (
              <KeyboardButton
                platform={platform}
                variant="ghost"
                size="xs"
                content={{
                  icon: '➕',
                  label: mode === 'management' ? 'New' : '',
                  description: 'Create new tone',
                }}
                onClick={() => {
                  setEditingTone(null);
                  setFormData({
                    name: '',
                    description: '',
                    prompt: '',
                    category: 'custom',
                  });
                  setShowForm(true);
                }}
              />
            )}
            
            {showImport && (
              <KeyboardButton
                platform={platform}
                variant="ghost"
                size="xs"
                content={{
                  icon: '📥',
                  label: mode === 'management' ? 'Import' : '',
                  description: 'Import tone collection',
                }}
                onClick={handleImport}
              />
            )}
            
            {showExport && (
              <KeyboardButton
                platform={platform}
                variant="ghost"
                size="xs"
                content={{
                  icon: '📤',
                  label: mode === 'management' ? 'Export' : '',
                  description: 'Export tone collection',
                }}
                onClick={handleExport}
              />
            )}
          </HeaderActions>
        </PresetsHeader>

        {/* Tone creation/editing form */}
        {showForm && (
          <ToneForm ref={formRef} onSubmit={handleFormSubmit}>
            <FormField>
              <FormLabel htmlFor="tone-name">Name</FormLabel>
              <FormInput
                id="tone-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter tone name"
                required
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="tone-description">Description</FormLabel>
              <FormInput
                id="tone-description"
                name="description"
                type="text"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the tone's purpose"
              />
            </FormField>

            <FormField>
              <FormLabel htmlFor="tone-category">Category</FormLabel>
              <FormSelect
                id="tone-category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                {TONE_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </FormSelect>
            </FormField>

            <FormField>
              <FormLabel htmlFor="tone-prompt">Prompt</FormLabel>
              <FormTextarea
                id="tone-prompt"
                name="prompt"
                value={formData.prompt}
                onChange={handleInputChange}
                placeholder="Enter the AI prompt for this tone"
                required
              />
            </FormField>

            <FormActions>
              <KeyboardButton
                platform={platform}
                variant="ghost"
                size="sm"
                content="Cancel"
                onClick={() => {
                  setShowForm(false);
                  setEditingTone(null);
                }}
              />
              <KeyboardButton
                platform={platform}
                variant="primary"
                size="sm"
                content={editingTone ? 'Update' : 'Create'}
                onClick={() => formRef.current?.requestSubmit()}
              />
            </FormActions>
          </ToneForm>
        )}

        {/* Tone list */}
        <PresetList>
          {allTones.length > 0 ? (
            allTones.map((tone) => {
              const isFavorite = favoriteTones.includes(tone.id);
              const isRecent = recentTones.includes(tone.id);
              const stats = usageStats[tone.id];

              return (
                <PresetItem
                  key={tone.id}
                  favorite={isFavorite}
                  recent={isRecent}
                >
                  <PresetContent>
                    <PresetName>{tone.name}</PresetName>
                    <PresetDescription>{tone.description}</PresetDescription>
                    {showStats && stats && (
                      <PresetStats>
                        <span>Used {stats.totalUses} times</span>
                        <span>Success rate: {Math.round(stats.successRate * 100)}%</span>
                      </PresetStats>
                    )}
                  </PresetContent>

                  <PresetActions>
                    <KeyboardButton
                      platform={platform}
                      variant="ghost"
                      size="xs"
                      content={{
                        icon: isFavorite ? '★' : '☆',
                        label: '',
                        description: isFavorite ? 'Remove from favorites' : 'Add to favorites',
                      }}
                      onClick={() => handleToneAction(isFavorite ? 'unfavorite' : 'favorite', tone)}
                    />

                    {tone.type === 'custom' && (
                      <>
                        <KeyboardButton
                          platform={platform}
                          variant="ghost"
                          size="xs"
                          content={{
                            icon: '✏️',
                            label: '',
                            description: 'Edit tone',
                          }}
                          onClick={() => handleToneAction('edit', tone)}
                        />

                        {allowDelete && (
                          <KeyboardButton
                            platform={platform}
                            variant="ghost"
                            size="xs"
                            content={{
                              icon: '🗑️',
                              label: '',
                              description: 'Delete tone',
                            }}
                            onClick={() => handleToneAction('delete', tone)}
                          />
                        )}
                      </>
                    )}

                    <KeyboardButton
                      platform={platform}
                      variant="ghost"
                      size="xs"
                      content={{
                        icon: '📋',
                        label: '',
                        description: 'Duplicate tone',
                      }}
                      onClick={() => handleToneAction('duplicate', tone)}
                    />
                  </PresetActions>
                </PresetItem>
              );
            })
          ) : (
            <EmptyState>
              {allowCustom 
                ? "No tones available. Create your first tone to get started."
                : "No tones available."}
            </EmptyState>
          )}
        </PresetList>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

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
          {showForm ? `${editingTone ? 'Editing' : 'Creating'} tone form opened` : ''}
        </div>
      </PresetsContainer>
    );
  }
);

// Set display name for debugging
TonePresets.displayName = 'TonePresets';