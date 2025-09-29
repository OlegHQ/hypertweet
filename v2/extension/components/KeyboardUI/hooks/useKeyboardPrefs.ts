import { useState, useCallback, useEffect, useRef } from 'react';
import {
  KeyboardStorage,
  KeyboardSettings,
  KeyboardVisibilitySettings,
  KeyboardShortcuts,
  PlatformSettings,
  DefaultToneSettings,
  UserBehaviorData,
  KeyboardStorageError,
} from '@/storage/keyboardStorage';

interface KeyboardPrefsState {
  readonly settings: KeyboardSettings | null;
  readonly isLoading: boolean;
  readonly error: KeyboardStorageError | null;
  readonly hasUnsavedChanges: boolean;
}

interface UseKeyboardPrefsResult {
  readonly state: KeyboardPrefsState;
  readonly settings: KeyboardSettings | null;
  readonly updateVisibility: (
    visibility: Partial<KeyboardVisibilitySettings>
  ) => Promise<void>;
  readonly updateShortcuts: (
    shortcuts: Partial<KeyboardShortcuts>
  ) => Promise<void>;
  readonly updatePlatformSettings: (
    platform: keyof PlatformSettings,
    settings: PlatformSettings[keyof PlatformSettings]
  ) => Promise<void>;
  readonly updateDefaultTone: (tone: DefaultToneSettings) => Promise<void>;
  readonly updateFullSettings: (
    settings: Partial<KeyboardSettings>
  ) => Promise<void>;
  readonly resetToDefaults: () => Promise<void>;
  readonly trackBehavior: (
    behavior: Partial<UserBehaviorData>
  ) => Promise<void>;
  readonly reloadSettings: () => Promise<void>;
  readonly isVisible: (platform?: 'twitter' | 'linkedin' | 'reddit') => boolean;
  readonly getShortcut: (action: keyof KeyboardShortcuts) => string;
  readonly hasChanges: boolean;
}

const STORAGE_CHANGE_DEBOUNCE = 300; // milliseconds
const STORAGE_LISTENER_KEY = 'keyboard_storage_listener';

export const useKeyboardPrefs = (): UseKeyboardPrefsResult => {
  const [state, setState] = useState<KeyboardPrefsState>({
    settings: null,
    isLoading: true,
    error: null,
    hasUnsavedChanges: false,
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKnownSettingsRef = useRef<KeyboardSettings | null>(null);
  const storageListenerRef = useRef<
    ((changes: Record<string, chrome.storage.StorageChange>) => void) | null
  >(null);

  // Load initial settings
  const loadSettings = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const settings = await KeyboardStorage.getSettings();
      lastKnownSettingsRef.current = settings;

      setState(prev => ({
        ...prev,
        settings,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as KeyboardStorageError,
      }));
    }
  }, []);

  // Update visibility settings
  const updateVisibility = useCallback(
    async (visibility: Partial<KeyboardVisibilitySettings>): Promise<void> => {
      if (!state.settings) return;

      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      try {
        const updatedSettings: KeyboardSettings = {
          ...state.settings,
          visibility: {
            ...state.settings.visibility,
            ...visibility,
          },
          updatedAt: Date.now(),
        };

        await KeyboardStorage.saveSettings(updatedSettings);

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          hasUnsavedChanges: false,
          error: null,
        }));

        lastKnownSettingsRef.current = updatedSettings;
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          error: error as KeyboardStorageError,
        }));
      }
    },
    [state.settings]
  );

  // Update keyboard shortcuts
  const updateShortcuts = useCallback(
    async (shortcuts: Partial<KeyboardShortcuts>): Promise<void> => {
      if (!state.settings) return;

      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      try {
        const updatedShortcuts: KeyboardShortcuts = {
          ...state.settings.shortcuts,
          ...shortcuts,
          selectTone: {
            ...state.settings.shortcuts.selectTone,
            ...(shortcuts.selectTone ?? {}),
          },
        };

        await KeyboardStorage.saveShortcuts(updatedShortcuts);

        const updatedSettings: KeyboardSettings = {
          ...state.settings,
          shortcuts: updatedShortcuts,
          updatedAt: Date.now(),
        };

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          hasUnsavedChanges: false,
          error: null,
        }));

        lastKnownSettingsRef.current = updatedSettings;
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          error: error as KeyboardStorageError,
        }));
      }
    },
    [state.settings]
  );

  // Update platform-specific settings
  const updatePlatformSettings = useCallback(
    async (
      platform: keyof PlatformSettings,
      platformSettings: PlatformSettings[keyof PlatformSettings]
    ): Promise<void> => {
      if (!state.settings) return;

      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      try {
        await KeyboardStorage.savePlatformSettings(platform, platformSettings);

        const updatedSettings: KeyboardSettings = {
          ...state.settings,
          platformSettings: {
            ...state.settings.platformSettings,
            [platform]: platformSettings,
          },
          updatedAt: Date.now(),
        };

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          hasUnsavedChanges: false,
          error: null,
        }));

        lastKnownSettingsRef.current = updatedSettings;
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          error: error as KeyboardStorageError,
        }));
      }
    },
    [state.settings]
  );

  // Update default tone settings
  const updateDefaultTone = useCallback(
    async (tone: DefaultToneSettings): Promise<void> => {
      if (!state.settings) return;

      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      try {
        await KeyboardStorage.saveDefaultTone(tone);

        const updatedSettings: KeyboardSettings = {
          ...state.settings,
          defaultTone: tone,
          updatedAt: Date.now(),
        };

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          hasUnsavedChanges: false,
          error: null,
        }));

        lastKnownSettingsRef.current = updatedSettings;
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          error: error as KeyboardStorageError,
        }));
      }
    },
    [state.settings]
  );

  // Update full settings (bulk update)
  const updateFullSettings = useCallback(
    async (settings: Partial<KeyboardSettings>): Promise<void> => {
      if (!state.settings) return;

      setState(prev => ({ ...prev, hasUnsavedChanges: true }));

      try {
        const updatedSettings: KeyboardSettings = {
          ...state.settings,
          ...settings,
          updatedAt: Date.now(),
        };

        await KeyboardStorage.saveSettings(updatedSettings);

        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          hasUnsavedChanges: false,
          error: null,
        }));

        lastKnownSettingsRef.current = updatedSettings;
      } catch (error) {
        setState(prev => ({
          ...prev,
          hasUnsavedChanges: false,
          error: error as KeyboardStorageError,
        }));
      }
    },
    [state.settings]
  );

  // Reset to default settings
  const resetToDefaults = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));

    try {
      // Clear all data to trigger default settings reload
      await KeyboardStorage.clearAllData();

      // Reload settings which will create new defaults
      await loadSettings();

      setState(prev => ({ ...prev, hasUnsavedChanges: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        error: error as KeyboardStorageError,
      }));
    }
  }, [loadSettings]);

  // Track user behavior for smart defaults
  const trackBehavior = useCallback(
    async (behavior: Partial<UserBehaviorData>): Promise<void> => {
      try {
        await KeyboardStorage.updateUserBehavior(behavior);
      } catch (error) {
        // Don't update state for behavior tracking errors - they're non-critical
        console.warn('Failed to track keyboard behavior:', error);
      }
    },
    []
  );

  // Reload settings from storage
  const reloadSettings = useCallback(async (): Promise<void> => {
    await loadSettings();
  }, [loadSettings]);

  // Check if keyboard should be visible for a platform
  const isVisible = useCallback(
    (platform?: 'twitter' | 'linkedin' | 'reddit'): boolean => {
      if (!state.settings) return true; // Default to visible

      const { visibility, platformSettings } = state.settings;

      // Global visibility check
      if (!visibility.showOnFocus) return false;

      // Platform-specific check
      if (platform && !platformSettings[platform].enabled) {
        return false;
      }

      return true;
    },
    [state.settings]
  );

  // Get shortcut for an action
  const getShortcut = useCallback(
    (action: keyof KeyboardShortcuts): string => {
      if (!state.settings) return '';

      const shortcut = state.settings.shortcuts[action];

      if (typeof shortcut === 'string') {
        return shortcut;
      }

      // For selectTone which is a Record<string, string>
      return '';
    },
    [state.settings]
  );

  // Listen for external storage changes (from other tabs/windows)
  const setupStorageListener = useCallback((): void => {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>
    ): void => {
      // Debounce rapid changes to avoid excessive re-renders
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        let hasRelevantChanges = false;

        // Check if any keyboard-related keys changed
        for (const key of Object.keys(changes)) {
          if (key.startsWith('keyboard_')) {
            hasRelevantChanges = true;
            break;
          }
        }

        if (hasRelevantChanges) {
          void reloadSettings();
        }
      }, STORAGE_CHANGE_DEBOUNCE);
    };

    // Remove existing listener if any
    if (storageListenerRef.current) {
      chrome.storage.onChanged.removeListener(storageListenerRef.current);
    }

    // Add new listener
    chrome.storage.onChanged.addListener(listener);
    storageListenerRef.current = listener;
  }, [reloadSettings]);

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
    setupStorageListener();

    return () => {
      // Cleanup
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (storageListenerRef.current) {
        chrome.storage.onChanged.removeListener(storageListenerRef.current);
      }
    };
  }, [loadSettings, setupStorageListener]);

  return {
    state,
    settings: state.settings,
    updateVisibility,
    updateShortcuts,
    updatePlatformSettings,
    updateDefaultTone,
    updateFullSettings,
    resetToDefaults,
    trackBehavior,
    reloadSettings,
    isVisible,
    getShortcut,
    hasChanges: state.hasUnsavedChanges,
  };
};
