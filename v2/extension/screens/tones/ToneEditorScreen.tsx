/**
 * ToneEditorScreen component for creating and editing tones
 * Features form validation, auto-save, preview functionality, and comprehensive editing tools
 */

import React, { useState, useEffect, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { Loading } from '../../components/common/Loading';
import { TonePreview } from './components/TonePreview';
import {
  type Tone,
  type ToneFormData,
  type ToneValidationResult,
  type ToneCategory,
  toneCategories,
  sampleTexts,
} from './types';

/**
 * Tone editor screen props interface
 */
export interface ToneEditorScreenProps {
  readonly mode: 'create' | 'edit' | 'duplicate';
  readonly initialTone?: Tone;
  readonly loading?: 'idle' | 'loading' | 'error';
  readonly error?: string;
  readonly onSave?: (data: ToneFormData) => Promise<void>;
  readonly onCancel?: () => void;
  readonly onDelete?: (tone: Tone) => Promise<void>;
  readonly onPreview?: (tone: Partial<Tone>) => void;
  readonly className?: string;
}

/**
 * Editor layout styles
 */
const editorLayoutStyles = (theme: ThemeType) => css`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: ${theme.spacing[6]};
  align-items: start;

  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[4]};
  }
`;

/**
 * Form container styles
 */
const formContainerStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[6]};
`;

/**
 * Form section styles
 */
const formSectionStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[6]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Section title styles
 */
const sectionTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[4]} 0;
`;

/**
 * Form field styles
 */
const formFieldStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[4]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Label styles
 */
const labelStyles = (theme: ThemeType) => css`
  display: block;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

/**
 * Required indicator styles
 */
const requiredStyles = (theme: ThemeType) => css`
  color: ${theme.colors.status.error};
  margin-left: ${theme.spacing[1]};
`;

/**
 * Textarea styles
 */
const textareaStyles = (theme: ThemeType) => css`
  width: 100%;
  min-height: 120px;
  padding: ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-family: ${theme.typography.fontFamily.sans};
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.relaxed};
  resize: vertical;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: ${theme.colors.interactive.primary};
    box-shadow: 0 0 0 2px ${theme.colors.interactive.primary}20;
  }

  &::placeholder {
    color: ${theme.colors.text.tertiary};
  }

  &:disabled {
    background-color: ${theme.colors.background.secondary};
    cursor: not-allowed;
  }
`;

/**
 * Select styles
 */
const selectStyles = (theme: ThemeType) => css`
  width: 100%;
  padding: ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  background-color: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${theme.colors.interactive.primary};
    box-shadow: 0 0 0 2px ${theme.colors.interactive.primary}20;
  }

  &:disabled {
    background-color: ${theme.colors.background.secondary};
    cursor: not-allowed;
  }
`;

/**
 * Checkbox container styles
 */
const checkboxContainerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Checkbox styles
 */
const checkboxStyles = (theme: ThemeType) => css`
  width: 16px;
  height: 16px;
  accent-color: ${theme.colors.interactive.primary};
`;

/**
 * Tags input container styles
 */
const tagsContainerStyles = (theme: ThemeType) => css`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[2]};
`;

/**
 * Tag styles
 */
const tagStyles = (theme: ThemeType) => css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  background-color: ${theme.colors.interactive.primary}20;
  color: ${theme.colors.interactive.primary};
  border: 1px solid ${theme.colors.interactive.primary}40;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.xs};
`;

/**
 * Tag remove button styles
 */
const tagRemoveStyles = (_theme: ThemeType) => css`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: inherit;
  font-size: 12px;

  &:hover {
    opacity: 0.7;
  }
`;

/**
 * Character count styles
 */
const characterCountStyles = (theme: ThemeType, isOverLimit: boolean) => css`
  font-size: ${theme.typography.fontSize.xs};
  color: ${isOverLimit
    ? theme.colors.status.error
    : theme.colors.text.tertiary};
  text-align: right;
  margin-top: ${theme.spacing[1]};
`;

/**
 * Preview panel styles
 */
const previewPanelStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[6]};
  position: sticky;
  top: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.lg}) {
    position: static;
  }
`;

/**
 * Preview content styles
 */
const previewContentStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.secondary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[4]};
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Preview text styles
 */
const previewTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.primary};
  line-height: ${theme.typography.lineHeight.relaxed};
  margin: 0;
`;

/**
 * Actions bar styles
 */
const actionsBarStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[4]} ${theme.spacing[6]};
  background-color: ${theme.colors.background.secondary};
  border-top: 1px solid ${theme.colors.border.primary};
  margin: ${theme.spacing[6]} -${theme.spacing[6]} -${theme.spacing[6]};
  border-radius: 0 0 ${theme.borderRadius.lg} ${theme.borderRadius.lg};
`;

/**
 * Action group styles
 */
const actionGroupStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[2]};
`;

/**
 * Auto-save status styles
 */
const autoSaveStatusStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Helper text styles
 */
const helperTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.tertiary};
  margin-top: ${theme.spacing[1]};
`;

/**
 * Icon components
 */
const SaveIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

/**
 * Validation logic
 */
const validateForm = (data: ToneFormData): ToneValidationResult => {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Required field validation
  if (!data.name.trim()) {
    errors['name'] = 'Name is required';
  } else if (data.name.length > 50) {
    errors['name'] = 'Name must be 50 characters or less';
  }

  if (!data.description.trim()) {
    errors['description'] = 'Description is required';
  } else if (data.description.length > 200) {
    errors['description'] = 'Description must be 200 characters or less';
  }

  if (!data.content.trim()) {
    errors.content = 'Content is required';
  } else if (data.content.length > 2000) {
    errors.content = 'Content must be 2000 characters or less';
  }

  // Warnings
  if (data.content.length < 50) {
    warnings.content =
      'Consider adding more detail to improve tone effectiveness';
  }

  if (data.tags.length === 0) {
    warnings.tags = 'Tags help with organization and discovery';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

/**
 * Generate preview text based on current form data
 */
const generatePreviewText = (data: ToneFormData): string => {
  if (!data.content.trim()) {
    return 'Enter tone content to see preview...';
  }

  const sampleText = sampleTexts['generic'];

  // Simple preview generation based on content
  return `${sampleText} [Applied with ${data.name || 'your tone'} style]`;
};

/**
 * Default form data
 */
const getDefaultFormData = (
  mode: 'create' | 'edit' | 'duplicate',
  initialTone?: Tone
): ToneFormData => {
  if (mode === 'create') {
    return {
      name: '',
      description: '',
      content: '',
      category: 'custom',
      tags: [],
      isActive: true,
    };
  }

  if (initialTone) {
    return {
      name:
        mode === 'duplicate' ? `${initialTone.name} (Copy)` : initialTone.name,
      description: initialTone.description,
      content: initialTone.content,
      category: initialTone.category,
      tags: initialTone.tags,
      isActive: initialTone.isActive,
    };
  }

  return getDefaultFormData('create');
};

/**
 * Hook for managing editor state
 */
const useEditorState = (
  mode: 'create' | 'edit' | 'duplicate',
  initialTone?: Tone,
  onSave?: (data: ToneFormData) => Promise<void>
) => {
  const [formData, setFormData] = useState<ToneFormData>(() =>
    getDefaultFormData(mode, initialTone)
  );
  const [validation, setValidation] = useState<ToneValidationResult>(() =>
    validateForm(getDefaultFormData(mode, initialTone))
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [newTag, setNewTag] = useState('');

  // Validate form when data changes
  useEffect(() => {
    const result = validateForm(formData);
    setValidation(result);
  }, [formData]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && validation.isValid && onSave) {
      const autoSave = async (): Promise<void> => {
        try {
          setIsSaving(true);
          await onSave(formData);
          setLastSaved(new Date());
          setIsDirty(false);
        } catch {
          // Handle error
        } finally {
          setIsSaving(false);
        }
      };

      const timer = setTimeout(() => void autoSave(), 2000);

      return () => clearTimeout(timer);
    }
  }, [formData, isDirty, validation.isValid, onSave]);

  const updateField = useCallback(
    (field: keyof ToneFormData, value: ToneFormData[typeof field]) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
    },
    []
  );

  const addTag = useCallback(
    (tag: string) => {
      const trimmedTag = tag.trim().toLowerCase();
      if (trimmedTag && !formData.tags.includes(trimmedTag)) {
        updateField('tags', [...formData.tags, trimmedTag]);
      }
    },
    [formData.tags, updateField]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      updateField(
        'tags',
        formData.tags.filter(tag => tag !== tagToRemove)
      );
    },
    [formData.tags, updateField]
  );

  return {
    formData,
    validation,
    isDirty,
    isSaving,
    lastSaved,
    newTag,
    setNewTag,
    updateField,
    addTag,
    removeTag,
  };
};

/**
 * Tone editor screen component with comprehensive editing features
 */
export const ToneEditorScreen = forwardRef<
  HTMLDivElement,
  ToneEditorScreenProps
>(
  (
    {
      mode,
      initialTone,
      loading = 'idle',
      error,
      onSave,
      onCancel,
      onDelete,
      className,
    },
    ref
  ) => {
    const {
      formData,
      validation,
      isDirty,
      isSaving,
      lastSaved,
      newTag,
      setNewTag,
      updateField,
      addTag,
      removeTag,
    } = useEditorState(mode, initialTone, onSave);

    const [showPreview, setShowPreview] = useState(false);
    const [previewTone, setPreviewTone] = useState<Partial<Tone> | null>(null);

    const isLoading = loading === 'loading' || isSaving;
    const canSave = validation.isValid && isDirty;

    // Event handlers
    const handleSave = useCallback(async () => {
      if (onSave && validation.isValid) {
        await onSave(formData);
      }
    }, [onSave, formData, validation.isValid]);

    const handleTagKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          if (newTag.trim()) {
            addTag(newTag);
            setNewTag('');
          }
        }
      },
      [newTag, addTag]
    );

    const handlePreview = useCallback(() => {
      const mockTone: Partial<Tone> = {
        id: 'preview',
        name: formData.name || 'Preview Tone',
        description: formData.description,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        isActive: formData.isActive,
        stats: {
          totalUses: 0,
          successRate: 85,
          averageEngagement: 75,
          responseTime: 1.5,
        },
      };
      setPreviewTone(mockTone);
      setShowPreview(true);
    }, [formData]);

    const pageTitle =
      mode === 'create'
        ? 'Create New Tone'
        : mode === 'duplicate'
          ? 'Duplicate Tone'
          : 'Edit Tone';

    const pageDescription =
      mode === 'create'
        ? 'Define a new tone for AI-powered response generation'
        : mode === 'duplicate'
          ? 'Create a copy of an existing tone with modifications'
          : 'Modify tone settings and content';

    return (
      <PageContainer
        ref={ref}
        title={pageTitle}
        description={pageDescription}
        loading={loading}
        {...(error && { error })}
        {...(className && { className })}
        maxWidth="xl"
        padding="lg"
      >
        <div css={editorLayoutStyles(defaultTheme)}>
          {/* Main Form */}
          <div css={formContainerStyles(defaultTheme)}>
            {/* Basic Information */}
            <div css={formSectionStyles(defaultTheme)}>
              <h3 css={sectionTitleStyles(defaultTheme)}>Basic Information</h3>

              <div css={formFieldStyles(defaultTheme)}>
                <label css={labelStyles(defaultTheme)} htmlFor="tone-name">
                  Name <span css={requiredStyles(defaultTheme)}>*</span>
                </label>
                <Input
                  id="tone-name"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Enter tone name..."
                  disabled={isLoading}
                  errorMessage={validation.errors['name']}
                />
                <div
                  css={characterCountStyles(
                    defaultTheme,
                    formData.name.length > 50
                  )}
                >
                  {formData.name.length}/50 characters
                </div>
              </div>

              <div css={formFieldStyles(defaultTheme)}>
                <label
                  css={labelStyles(defaultTheme)}
                  htmlFor="tone-description"
                >
                  Description <span css={requiredStyles(defaultTheme)}>*</span>
                </label>
                <textarea
                  id="tone-description"
                  css={textareaStyles(defaultTheme)}
                  value={formData.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe what this tone is for and how it should sound..."
                  disabled={isLoading}
                  rows={3}
                />
                {validation.errors['description'] && (
                  <Alert status="error" variant="subtle" size="sm">
                    {validation.errors['description']}
                  </Alert>
                )}
                <div
                  css={characterCountStyles(
                    theme,
                    formData.description.length > 200
                  )}
                >
                  {formData.description.length}/200 characters
                </div>
              </div>

              <div css={formFieldStyles(defaultTheme)}>
                <label css={labelStyles(defaultTheme)} htmlFor="tone-category">
                  Category
                </label>
                <select
                  id="tone-category"
                  css={selectStyles(defaultTheme)}
                  value={formData.category}
                  onChange={e =>
                    updateField('category', e.target.value as ToneCategory)
                  }
                  disabled={isLoading}
                >
                  {Object.entries(toneCategories).map(([key, category]) => (
                    <option key={key} value={key}>
                      {category.label} - {category.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tone Content */}
            <div css={formSectionStyles(defaultTheme)}>
              <h3 css={sectionTitleStyles(defaultTheme)}>Tone Instructions</h3>

              <div css={formFieldStyles(defaultTheme)}>
                <label css={labelStyles(defaultTheme)} htmlFor="tone-content">
                  Content <span css={requiredStyles(defaultTheme)}>*</span>
                </label>
                <textarea
                  id="tone-content"
                  css={textareaStyles(defaultTheme)}
                  value={formData.content}
                  onChange={e => updateField('content', e.target.value)}
                  placeholder="Provide detailed instructions for how responses should be written in this tone..."
                  disabled={isLoading}
                  rows={8}
                />
                {validation.errors.content && (
                  <Alert status="error" variant="subtle" size="sm">
                    {validation.errors.content}
                  </Alert>
                )}
                {validation.warnings.content && (
                  <Alert variant="warning" size="sm">
                    {validation.warnings.content}
                  </Alert>
                )}
                <div
                  css={characterCountStyles(
                    theme,
                    formData.content.length > 2000
                  )}
                >
                  {formData.content.length}/2000 characters
                </div>
                <div css={helperTextStyles(defaultTheme)}>
                  Be specific about tone, style, length, and any formatting
                  preferences.
                </div>
              </div>
            </div>

            {/* Tags and Settings */}
            <div css={formSectionStyles(defaultTheme)}>
              <h3 css={sectionTitleStyles(defaultTheme)}>
                Organization & Settings
              </h3>

              <div css={formFieldStyles(defaultTheme)}>
                <label css={labelStyles(defaultTheme)} htmlFor="tone-tags">
                  Tags
                </label>
                <div css={tagsContainerStyles(defaultTheme)}>
                  {formData.tags.map(tag => (
                    <span key={tag} css={tagStyles(defaultTheme)}>
                      {tag}
                      <button
                        type="button"
                        css={tagRemoveStyles(defaultTheme)}
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove ${tag} tag`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  id="tone-tags"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add tags (press Enter or comma to add)..."
                  disabled={isLoading}
                />
                {validation.warnings.tags && (
                  <Alert variant="info" size="sm">
                    {validation.warnings.tags}
                  </Alert>
                )}
                <div css={helperTextStyles(defaultTheme)}>
                  Tags help organize and find tones. Separate with commas or
                  Enter.
                </div>
              </div>

              <div css={formFieldStyles(defaultTheme)}>
                <div css={checkboxContainerStyles(defaultTheme)}>
                  <input
                    id="tone-active"
                    type="checkbox"
                    css={checkboxStyles(defaultTheme)}
                    checked={formData.isActive}
                    onChange={e => updateField('isActive', e.target.checked)}
                    disabled={isLoading}
                  />
                  <label css={labelStyles(defaultTheme)} htmlFor="tone-active">
                    Active (available for use)
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div css={actionsBarStyles(defaultTheme)}>
              <div css={autoSaveStatusStyles(defaultTheme)}>
                {isSaving && (
                  <>
                    <Loading size="sm" />
                    Saving...
                  </>
                )}
                {lastSaved && !isSaving && (
                  <>
                    <SaveIcon />
                    Saved {lastSaved.toLocaleTimeString()}
                  </>
                )}
                {isDirty && !isSaving && <span>Unsaved changes</span>}
              </div>

              <div css={actionGroupStyles(defaultTheme)}>
                {onCancel && (
                  <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}

                {mode === 'edit' && onDelete && initialTone && (
                  <Button
                    variant="danger"
                    onClick={() => void onDelete(initialTone)}
                    disabled={isLoading}
                  >
                    Delete
                  </Button>
                )}

                <Button
                  variant="primary"
                  onClick={() => void handleSave()}
                  disabled={!canSave || isLoading}
                  icon={<SaveIcon />}
                  iconPosition="left"
                >
                  {mode === 'create' ? 'Create Tone' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div css={previewPanelStyles(defaultTheme)}>
            <h3 css={sectionTitleStyles(defaultTheme)}>Live Preview</h3>

            <div css={previewContentStyles(defaultTheme)}>
              {formData.content ? (
                <p css={previewTextStyles(defaultTheme)}>
                  {generatePreviewText(formData)}
                </p>
              ) : (
                <p
                  css={previewTextStyles(defaultTheme)}
                  style={{ fontStyle: 'italic' }}
                >
                  Enter tone content to see preview...
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              onClick={handlePreview}
              disabled={!formData.content.trim() || isLoading}
              style={{ width: '100%', marginBottom: theme.spacing[4] }}
            >
              Advanced Preview
            </Button>

            {formData.content && (
              <div
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                }}
              >
                <p>
                  <strong>Category:</strong>{' '}
                  {toneCategories[formData.category].label}
                </p>
                <p>
                  <strong>Tags:</strong>{' '}
                  {formData.tags.length > 0 ? formData.tags.join(', ') : 'None'}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  {formData.isActive ? 'Active' : 'Inactive'}
                </p>
                <p>
                  <strong>Content length:</strong> {formData.content.length}{' '}
                  characters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Preview Modal */}
        {showPreview && previewTone && (
          <TonePreview
            tone={previewTone as Tone}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
          />
        )}
      </PageContainer>
    );
  }
);

ToneEditorScreen.displayName = 'ToneEditorScreen';
