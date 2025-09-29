/**
 * Compact keyboard settings panel accessible from keyboard UI
 */

import React, { useState, useCallback } from 'react';
import styled from '@emotion/styled';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useKeyboardPrefs } from '../hooks/useKeyboardPrefs';
import { useKeyboardTones } from '../hooks/useTones';
import type {
  KeyboardVisibilitySettings,
  KeyboardShortcuts,
  PlatformSettings,
  DefaultToneSettings,
} from '@/storage/keyboardStorage';

interface KeyboardSettingsProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onToggle: () => void;
}

/**
 * Settings panel wrapper
 */
const SettingsPanel = styled.div<{ readonly isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 9999;
  width: 320px;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  transform: ${({ isOpen }) => isOpen ? 'translateY(8px)' : 'translateY(0px)'};
  opacity: ${({ isOpen }) => isOpen ? 1 : 0};
  visibility: ${({ isOpen }) => isOpen ? 'visible' : 'hidden'};
  transition: all ${({ theme }) => theme.transitions.duration.normal}
    ${({ theme }) => theme.transitions.easing.easeOut};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Settings header
 */
const SettingsHeader = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * Settings title
 */
const SettingsTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

/**
 * Settings content container
 */
const SettingsContent = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  max-height: 400px;
  overflow-y: auto;

  /* Webkit scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background.secondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border.secondary};
    border-radius: 3px;

    &:hover {
      background: ${({ theme }) => theme.colors.border.primary};
    }
  }
`;

/**
 * Settings section wrapper
 */
const SettingsSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Section title
 */
const SectionTitle = styled.h4`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing[3]} 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
`;

/**
 * Settings row for form controls
 */
const SettingsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Settings label
 */
const SettingsLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  flex: 1;
  margin-right: ${({ theme }) => theme.spacing[3]};
`;

/**
 * Toggle switch component
 */
const ToggleSwitch = styled.input<{
  readonly checked: boolean;
}>`
  position: relative;
  width: 44px;
  height: 24px;
  background: ${({ checked, theme }) =>
    checked ? theme.colors.interactive.primary : theme.colors.background.tertiary};
  border-radius: 12px;
  border: none;
  outline: none;
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.duration.fast}
    ${({ theme }) => theme.transitions.easing.easeOut};
  appearance: none;
  type: checkbox;

  &::before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ checked }) => (checked ? '22px' : '2px')};
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.text.inverse};
    border-radius: 50%;
    transition: left ${({ theme }) => theme.transitions.duration.fast}
      ${({ theme }) => theme.transitions.easing.easeOut};
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &::before {
      transition: none;
    }
  }
`;

/**
 * Select dropdown component
 */
const Select = styled.select`
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[3]}`};
  border: 1px solid ${({ theme }) => theme.colors.border.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.border.focus};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.border.focus}33;
  }
`;

/**
 * Platform settings grid
 */
const PlatformGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: ${({ theme }) => theme.spacing[2]};
  align-items: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

/**
 * Platform name
 */
const PlatformName = styled.span`
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-transform: capitalize;
`;

/**
 * Compact toggle for platform settings
 */
const CompactToggle = styled(ToggleSwitch)`
  width: 32px;
  height: 18px;

  &::before {
    width: 14px;
    height: 14px;
    top: 2px;
    left: ${({ checked }) => (checked ? '16px' : '2px')};
  }
`;

/**
 * Main keyboard settings component
 */
export const KeyboardSettings: React.FC<KeyboardSettingsProps> = ({
  isOpen,
  onClose,
  onToggle,
}) => {
  const {
    settings,
    updateVisibility,
    updateShortcuts,
    updatePlatformSettings,
    updateDefaultTone,
    resetToDefaults,
    state: { isLoading, error },
  } = useKeyboardPrefs();

  const { state: tonesState } = useKeyboardTones();
  const [isResetting, setIsResetting] = useState(false);

  const handleVisibilityChange = useCallback(
    (key: keyof KeyboardVisibilitySettings, value: boolean | string | number) => {
      if (!settings) return;

      const updates = { [key]: value } as Partial<KeyboardVisibilitySettings>;
      void updateVisibility(updates);
    },
    [settings, updateVisibility]
  );

  const handleShortcutChange = useCallback(
    (key: keyof KeyboardShortcuts, value: string) => {
      if (!settings) return;

      const updates = { [key]: value } as Partial<KeyboardShortcuts>;
      void updateShortcuts(updates);
    },
    [settings, updateShortcuts]
  );

  const handlePlatformChange = useCallback(
    (platform: keyof PlatformSettings, key: string, value: boolean | string) => {
      if (!settings) return;

      const currentSettings = settings.platformSettings[platform];
      const updatedSettings = {
        ...currentSettings,
        [key]: value,
      };

      void updatePlatformSettings(platform, updatedSettings);
    },
    [settings, updatePlatformSettings]
  );

  const handleDefaultToneChange = useCallback(
    (toneId: string) => {
      if (!settings) return;

      const updates: DefaultToneSettings = {
        ...settings.defaultTone,
        toneId: toneId || null,
      };

      void updateDefaultTone(updates);
    },
    [settings, updateDefaultTone]
  );

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
    } finally {
      setIsResetting(false);
    }
  }, [resetToDefaults]);

  if (!settings) {
    return null;
  }

  return (
    <SettingsPanel isOpen={isOpen}>
      <SettingsHeader>
        <SettingsTitle>Keyboard Settings</SettingsTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Close settings"
        >
          ×
        </Button>
      </SettingsHeader>

      <SettingsContent>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#dc2626',
            }}
          >
            {error.message}
          </div>
        )}

        {/* Visibility Settings */}
        <SettingsSection>
          <SectionTitle>Visibility</SectionTitle>
          
          <SettingsRow>
            <SettingsLabel>Show on focus</SettingsLabel>
            <ToggleSwitch
              checked={settings.visibility.showOnFocus}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleVisibilityChange('showOnFocus', e.target.checked)
              }
            />
          </SettingsRow>

          <SettingsRow>
            <SettingsLabel>Auto-hide</SettingsLabel>
            <ToggleSwitch
              checked={settings.visibility.autoHide}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleVisibilityChange('autoHide', e.target.checked)
              }
            />
          </SettingsRow>

          <SettingsRow>
            <SettingsLabel>Position</SettingsLabel>
            <Select
              value={settings.visibility.position}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleVisibilityChange('position', e.target.value)
              }
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="floating">Floating</option>
            </Select>
          </SettingsRow>

          <SettingsRow>
            <SettingsLabel>Size</SettingsLabel>
            <Select
              value={settings.visibility.size}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleVisibilityChange('size', e.target.value)
              }
            >
              <option value="compact">Compact</option>
              <option value="standard">Standard</option>
              <option value="large">Large</option>
            </Select>
          </SettingsRow>
        </SettingsSection>

        {/* Default Tone */}
        <SettingsSection>
          <SectionTitle>Default Tone</SectionTitle>
          
          <SettingsRow>
            <SettingsLabel>Default tone</SettingsLabel>
            <Select
              value={settings.defaultTone.toneId ?? ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleDefaultToneChange(e.target.value)}
            >
              <option value="">None</option>
              {tonesState.recentTones.map((tone) => (
                <option key={tone.id} value={tone.id}>
                  {tone.name}
                </option>
              ))}
            </Select>
          </SettingsRow>

          <SettingsRow>
            <SettingsLabel>Use contextual suggestions</SettingsLabel>
            <ToggleSwitch
              checked={settings.defaultTone.useContextualSuggestions}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const updates: DefaultToneSettings = {
                  ...settings.defaultTone,
                  useContextualSuggestions: e.target.checked,
                };
                void updateDefaultTone(updates);
              }}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Platform Settings */}
        <SettingsSection>
          <SectionTitle>Platform Settings</SectionTitle>
          
          {(['twitter', 'linkedin', 'reddit'] as const).map((platform) => (
            <PlatformGrid key={platform}>
              <PlatformName>{platform}</PlatformName>
              <CompactToggle
                checked={settings.platformSettings[platform].enabled}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePlatformChange(platform, 'enabled', e.target.checked)
                }
                aria-label={`Enable ${platform} integration`}
              />
              <CompactToggle
                checked={settings.platformSettings[platform].autoShow}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handlePlatformChange(platform, 'autoShow', e.target.checked)
                }
                aria-label={`Auto-show on ${platform}`}
                disabled={!settings.platformSettings[platform].enabled}
              />
            </PlatformGrid>
          ))}
        </SettingsSection>

        {/* Keyboard Shortcuts */}
        <SettingsSection>
          <SectionTitle>Shortcuts</SectionTitle>
          
          <SettingsRow>
            <SettingsLabel>Toggle keyboard</SettingsLabel>
            <Input
              type="text"
              value={settings.shortcuts.toggleKeyboard}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleShortcutChange('toggleKeyboard', e.target.value)
              }
              placeholder="Ctrl+Shift+K"
              fullWidth={false}
              style={{ minWidth: '140px', fontSize: '12px' }}
            />
          </SettingsRow>

          <SettingsRow>
            <SettingsLabel>Quick generate</SettingsLabel>
            <Input
              type="text"
              value={settings.shortcuts.quickGenerate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleShortcutChange('quickGenerate', e.target.value)
              }
              placeholder="Ctrl+Enter"
              fullWidth={false}
              style={{ minWidth: '140px', fontSize: '12px' }}
            />
          </SettingsRow>
        </SettingsSection>

        {/* Reset Section */}
        <SettingsSection>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            loading={isResetting}
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Defaults
          </Button>
        </SettingsSection>
      </SettingsContent>
    </SettingsPanel>
  );
};