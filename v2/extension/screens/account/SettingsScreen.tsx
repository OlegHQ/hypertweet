/**
 * SettingsScreen component for managing extension preferences and configuration
 * Features extension settings, default tone selection, and data management
 */

import React, { useState, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import type { LoadingState, LayoutError } from '../../components/layout/types';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { SectionCard } from './components/SectionCard';

/**
 * Extension preferences interface
 */
interface ExtensionPreferences {
  readonly autoActivate: boolean;
  readonly showNotifications: boolean;
  readonly enableShortcuts: boolean;
  readonly defaultToneId?: string;
  readonly responseLength: 'short' | 'medium' | 'long';
  readonly theme: 'light' | 'dark' | 'auto';
  readonly autoSave: boolean;
  readonly contextAnalysis: boolean;
}

/**
 * Keyboard shortcut interface
 */
interface KeyboardShortcut {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly shortcut: string;
  readonly category: 'general' | 'tone' | 'editing';
}

/**
 * Data export options interface
 */
interface DataExportOptions {
  readonly includeTones: boolean;
  readonly includeHistory: boolean;
  readonly includeSettings: boolean;
  readonly format: 'json' | 'csv';
}

/**
 * Settings screen props interface
 */
export interface SettingsScreenProps {
  readonly preferences?: ExtensionPreferences;
  readonly shortcuts?: readonly KeyboardShortcut[];
  readonly availableTones?: readonly { id: string; name: string }[];
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onUpdatePreferences?: (preferences: ExtensionPreferences) => Promise<void>;
  readonly onUpdateShortcut?: (shortcutId: string, newShortcut: string) => Promise<void>;
  readonly onExportData?: (options: DataExportOptions) => Promise<void>;
  readonly onImportData?: (file: File) => Promise<void>;
  readonly onResetSettings?: () => Promise<void>;
  readonly className?: string;
}

/**
 * Form group styles
 */
const formGroupStyles = (theme: ThemeType) => css`
  margin-bottom: ${theme.spacing[4]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Label styles
 */
const labelStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
`;

/**
 * Checkbox styles
 */
const checkboxStyles = (theme: ThemeType) => css`
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.sm};
  background: ${theme.colors.background.primary};
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease-in-out;
  
  &:checked {
    background: ${theme.colors.interactive.primary};
    border-color: ${theme.colors.interactive.primary};
    
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Select styles
 */
const selectStyles = (theme: ThemeType) => css`
  width: 100%;
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.interactive.primary};
    box-shadow: 0 0 0 1px ${theme.colors.interactive.primary};
  }
`;

/**
 * Shortcut item styles
 */
const shortcutItemStyles = (theme: ThemeType) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background.secondary};
  border: 1px solid ${theme.colors.border.primary};
  margin-bottom: ${theme.spacing[2]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Shortcut info styles
 */

/**
 * Shortcut name styles
 */
const shortcutNameStyles = (theme: ThemeType) => css`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
  font-size: ${theme.typography.fontSize.sm};
`;

/**
 * Shortcut description styles
 */
const shortcutDescriptionStyles = (theme: ThemeType) => css`
  color: ${theme.colors.text.secondary};
  margin: 0;
  font-size: ${theme.typography.fontSize.xs};
`;

/**
 * Shortcut display styles
 */
const shortcutDisplayStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.sm};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.primary};
  min-width: 100px;
  text-align: center;
`;

/**
 * Mock preferences data
 */
const mockPreferences: ExtensionPreferences = {
  autoActivate: true,
  showNotifications: true,
  enableShortcuts: true,
  defaultToneId: 'professional',
  responseLength: 'medium',
  theme: 'auto',
  autoSave: true,
  contextAnalysis: true,
};

/**
 * Mock shortcuts data
 */
const mockShortcuts: readonly KeyboardShortcut[] = [
  {
    id: 'toggle-extension',
    name: 'Toggle Extension',
    description: 'Activate or deactivate the extension on current page',
    shortcut: 'Ctrl+Shift+T',
    category: 'general',
  },
  {
    id: 'quick-reply',
    name: 'Quick Reply',
    description: 'Open quick reply interface',
    shortcut: 'Ctrl+Shift+R',
    category: 'general',
  },
  {
    id: 'apply-default-tone',
    name: 'Apply Default Tone',
    description: 'Apply your default tone to current text',
    shortcut: 'Ctrl+Shift+D',
    category: 'tone',
  },
  {
    id: 'cycle-tones',
    name: 'Cycle Through Tones',
    description: 'Cycle through your favorite tones',
    shortcut: 'Ctrl+Shift+C',
    category: 'tone',
  },
];

/**
 * Mock available tones
 */
const mockAvailableTones = [
  { id: 'professional', name: 'Professional' },
  { id: 'casual', name: 'Casual' },
  { id: 'friendly', name: 'Friendly' },
  { id: 'formal', name: 'Formal' },
  { id: 'humorous', name: 'Humorous' },
];

/**
 * SettingsScreen component with comprehensive preference management
 */
export const SettingsScreen = forwardRef<HTMLDivElement, SettingsScreenProps>(
  (
    {
      preferences = mockPreferences,
      shortcuts = mockShortcuts,
      availableTones = mockAvailableTones,
      loading = 'idle',
      error,
      onUpdatePreferences,
      onExportData,
      onImportData,
      onResetSettings,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [localPreferences, setLocalPreferences] = useState(preferences);
    const [exportOptions, setExportOptions] = useState<DataExportOptions>({
      includeTones: true,
      includeHistory: true,
      includeSettings: true,
      format: 'json',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    const handlePreferenceChange = useCallback(
      <K extends keyof ExtensionPreferences>(
        key: K,
        value: ExtensionPreferences[K]
      ): void => {
        setLocalPreferences(prev => ({ ...prev, [key]: value }));
      },
      []
    );

    const handleSavePreferences = useCallback(async (): Promise<void> => {
      if (!onUpdatePreferences) return;

      try {
        setIsSaving(true);
        await onUpdatePreferences(localPreferences);
        setSuccessMessage('Settings saved successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      } finally {
        setIsSaving(false);
      }
    }, [localPreferences, onUpdatePreferences]);

    const handleExportData = useCallback(async (): Promise<void> => {
      if (!onExportData) return;

      try {
        await onExportData(exportOptions);
        setSuccessMessage('Data exported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      }
    }, [exportOptions, onExportData]);

    const handleImportData = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file || !onImportData) return;

        try {
          await onImportData(file);
          setSuccessMessage('Data imported successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch {
          // Error handling would be managed by parent component
        }
      },
      [onImportData]
    );

    const handleResetSettings = useCallback(async (): Promise<void> => {
      if (!onResetSettings || !confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
      }

      try {
        await onResetSettings();
        setSuccessMessage('Settings reset to defaults!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      }
    }, [onResetSettings]);

    return (
      <PageContainer
        ref={ref}
        title="Settings"
        description="Customize your extension preferences and behavior"
        loading={loading}
        {...error && { error }}
        {...className && { className }}
        maxWidth="lg"
        padding="lg"
      >
        {successMessage && (
          <Alert status="success" variant="subtle" style={{ marginBottom: theme.spacing[6] }}>
            {successMessage}
          </Alert>
        )}

        {/* General Preferences */}
        <SectionCard
          title="General Preferences"
          description="Configure basic extension behavior and appearance"
          actions={
            <Button
              variant="primary"
              onClick={handleSavePreferences}
              disabled={isSaving}
              loading={isSaving}
            >
              Save Changes
            </Button>
          }
          css={{ marginBottom: theme.spacing[6] }}
        >
          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              <input
                type="checkbox"
                css={checkboxStyles(theme)}
                checked={localPreferences.autoActivate}
                onChange={e => handlePreferenceChange('autoActivate', e.target.checked)}
              />
              Auto-activate on supported websites
            </label>
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs 
            }}>
              Automatically enable the extension on Twitter, LinkedIn, and Reddit
            </p>
          </div>

          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              <input
                type="checkbox"
                css={checkboxStyles(theme)}
                checked={localPreferences.showNotifications}
                onChange={e => handlePreferenceChange('showNotifications', e.target.checked)}
              />
              Show notifications
            </label>
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs 
            }}>
              Display notifications for successful actions and errors
            </p>
          </div>

          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              <input
                type="checkbox"
                css={checkboxStyles(theme)}
                checked={localPreferences.autoSave}
                onChange={e => handlePreferenceChange('autoSave', e.target.checked)}
              />
              Auto-save drafts
            </label>
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs 
            }}>
              Automatically save your drafts as you type
            </p>
          </div>

          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              Default Tone
            </label>
            <select
              css={selectStyles(theme)}
              value={localPreferences.defaultToneId || ''}
              onChange={e => handlePreferenceChange('defaultToneId', e.target.value || undefined)}
            >
              <option value="">No default tone</option>
              {availableTones.map(tone => (
                <option key={tone.id} value={tone.id}>
                  {tone.name}
                </option>
              ))}
            </select>
          </div>

          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              Response Length
            </label>
            <select
              css={selectStyles(theme)}
              value={localPreferences.responseLength}
              onChange={e => handlePreferenceChange('responseLength', e.target.value as 'short' | 'medium' | 'long')}
            >
              <option value="short">Short (1-2 sentences)</option>
              <option value="medium">Medium (2-4 sentences)</option>
              <option value="long">Long (4+ sentences)</option>
            </select>
          </div>

          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              Theme
            </label>
            <select
              css={selectStyles(theme)}
              value={localPreferences.theme}
              onChange={e => handlePreferenceChange('theme', e.target.value as 'light' | 'dark' | 'auto')}
            >
              <option value="auto">Auto (System)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </SectionCard>

        {/* Keyboard Shortcuts */}
        <SectionCard
          title="Keyboard Shortcuts"
          description="Customize keyboard shortcuts for quick access"
          actions={
            <label css={labelStyles(theme)}>
              <input
                type="checkbox"
                css={checkboxStyles(theme)}
                checked={localPreferences.enableShortcuts}
                onChange={e => handlePreferenceChange('enableShortcuts', e.target.checked)}
              />
              Enable shortcuts
            </label>
          }
          css={{ marginBottom: theme.spacing[6] }}
        >
          {shortcuts.map(shortcut => (
            <div key={shortcut.id} css={shortcutItemStyles(theme)}>
              <div style={{ flex: 1 }}>
                <h4 css={shortcutNameStyles(theme)}>{shortcut.name}</h4>
                <p css={shortcutDescriptionStyles(theme)}>{shortcut.description}</p>
              </div>
              <div css={shortcutDisplayStyles(theme)}>
                {shortcut.shortcut}
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Data Management */}
        <SectionCard
          title="Data Management"
          description="Export, import, or reset your extension data"
          css={{ marginBottom: theme.spacing[6] }}
        >
          <div css={formGroupStyles(theme)}>
            <h4 style={{ 
              margin: `0 0 ${theme.spacing[3]} 0`,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary 
            }}>
              Export Data
            </h4>
            
            <div style={{ marginBottom: theme.spacing[3] }}>
              <label css={labelStyles(theme)}>
                <input
                  type="checkbox"
                  css={checkboxStyles(theme)}
                  checked={exportOptions.includeTones}
                  onChange={e => setExportOptions(prev => ({ ...prev, includeTones: e.target.checked }))}
                />
                Include tones
              </label>
              
              <label css={labelStyles(theme)}>
                <input
                  type="checkbox"
                  css={checkboxStyles(theme)}
                  checked={exportOptions.includeHistory}
                  onChange={e => setExportOptions(prev => ({ ...prev, includeHistory: e.target.checked }))}
                />
                Include history
              </label>
              
              <label css={labelStyles(theme)}>
                <input
                  type="checkbox"
                  css={checkboxStyles(theme)}
                  checked={exportOptions.includeSettings}
                  onChange={e => setExportOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                />
                Include settings
              </label>
            </div>
            
            <div style={{ display: 'flex', gap: theme.spacing[2], marginBottom: theme.spacing[3] }}>
              <select
                css={selectStyles(theme)}
                value={exportOptions.format}
                onChange={e => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
                style={{ flex: 1 }}
              >
                <option value="json">JSON Format</option>
                <option value="csv">CSV Format</option>
              </select>
              
              <Button variant="secondary" onClick={handleExportData}>
                Export Data
              </Button>
            </div>
          </div>

          <div css={formGroupStyles(theme)}>
            <h4 style={{ 
              margin: `0 0 ${theme.spacing[3]} 0`,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary 
            }}>
              Import Data
            </h4>
            
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportData}
              style={{ 
                marginBottom: theme.spacing[3],
                padding: theme.spacing[2],
                border: `1px solid ${theme.colors.border.primary}`,
                borderRadius: theme.borderRadius.md,
                background: theme.colors.background.primary,
                color: theme.colors.text.primary,
                fontSize: theme.typography.fontSize.sm
              }}
            />
          </div>

          <div css={formGroupStyles(theme)}>
            <h4 style={{ 
              margin: `0 0 ${theme.spacing[3]} 0`,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary 
            }}>
              Reset Settings
            </h4>
            
            <Button variant="danger" onClick={handleResetSettings}>
              Reset All Settings
            </Button>
            
            <p style={{ 
              margin: `${theme.spacing[2]} 0 0 0`,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs 
            }}>
              This will reset all preferences to their default values. This action cannot be undone.
            </p>
          </div>
        </SectionCard>

        {/* Advanced Options */}
        <SectionCard
          title="Advanced Options"
          description="Advanced features and experimental settings"
        >
          <div css={formGroupStyles(theme)}>
            <label css={labelStyles(theme)}>
              <input
                type="checkbox"
                css={checkboxStyles(theme)}
                checked={localPreferences.contextAnalysis}
                onChange={e => handlePreferenceChange('contextAnalysis', e.target.checked)}
              />
              Enable context analysis
            </label>
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.xs 
            }}>
              Analyze conversation context for better tone recommendations (experimental)
            </p>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }
);

SettingsScreen.displayName = 'SettingsScreen';