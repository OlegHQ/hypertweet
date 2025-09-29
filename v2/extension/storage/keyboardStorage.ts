/**
 * Chrome storage wrapper for keyboard UI preferences and settings
 */

/**
 * Keyboard preference storage keys
 */
export enum KeyboardStorageKey {
  KEYBOARD_SETTINGS = 'keyboard_settings',
  DEFAULT_TONE = 'keyboard_default_tone',
  SHORTCUTS = 'keyboard_shortcuts',
  PLATFORM_SETTINGS = 'keyboard_platform_settings',
  RECENT_TONES = 'keyboard_recent_tones',
  USER_BEHAVIOR = 'keyboard_user_behavior',
}

/**
 * Keyboard visibility preferences
 */
export interface KeyboardVisibilitySettings {
  readonly showOnFocus: boolean;
  readonly autoHide: boolean;
  readonly autoHideDelay: number; // milliseconds
  readonly showShortcutHint: boolean;
  readonly position: 'top' | 'bottom' | 'floating';
  readonly size: 'compact' | 'standard' | 'large';
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  readonly toggleKeyboard: string;
  readonly quickGenerate: string;
  readonly selectTone: Record<string, string>; // tone ID to shortcut
  readonly navigateUp: string;
  readonly navigateDown: string;
  readonly confirm: string;
  readonly cancel: string;
}

/**
 * Platform-specific keyboard settings
 */
export interface PlatformSettings {
  readonly twitter: {
    readonly enabled: boolean;
    readonly autoShow: boolean;
    readonly preferredPosition: 'above' | 'below' | 'inline';
    readonly excludeSelectors: readonly string[];
  };
  readonly linkedin: {
    readonly enabled: boolean;
    readonly autoShow: boolean;
    readonly preferredPosition: 'above' | 'below' | 'inline';
    readonly excludeSelectors: readonly string[];
  };
  readonly reddit: {
    readonly enabled: boolean;
    readonly autoShow: boolean;
    readonly preferredPosition: 'above' | 'below' | 'inline';
    readonly excludeSelectors: readonly string[];
  };
}

/**
 * Default tone selection settings
 */
export interface DefaultToneSettings {
  readonly toneId: string | null;
  readonly useContextualSuggestions: boolean;
  readonly autoApplyForPlatform: Record<string, boolean>; // platform -> boolean
  readonly fallbackToneId: string | null;
}

/**
 * Recent tone usage tracking
 */
export interface RecentTonesData {
  readonly tones: readonly {
    readonly id: string;
    readonly name: string;
    readonly lastUsed: number; // timestamp
    readonly usageCount: number;
    readonly platform?: 'twitter' | 'linkedin' | 'reddit';
  }[];
  readonly maxEntries: number;
  readonly lastUpdated: number;
}

/**
 * User behavior analytics for smart defaults
 */
export interface UserBehaviorData {
  readonly totalGenerations: number;
  readonly platformUsage: Record<string, number>; // platform -> count
  readonly toneUsage: Record<string, number>; // tone ID -> count
  readonly averageSessionDuration: number; // milliseconds
  readonly preferredTimes: readonly number[]; // hours of day (0-23)
  readonly lastAnalyzed: number; // timestamp
}

/**
 * Complete keyboard settings structure
 */
export interface KeyboardSettings {
  readonly version: number; // for migration support
  readonly visibility: KeyboardVisibilitySettings;
  readonly shortcuts: KeyboardShortcuts;
  readonly platformSettings: PlatformSettings;
  readonly defaultTone: DefaultToneSettings;
  readonly createdAt: number; // timestamp
  readonly updatedAt: number; // timestamp
}

/**
 * Storage error for keyboard settings
 */
export interface KeyboardStorageError {
  readonly code: 'STORAGE_ERROR' | 'MIGRATION_ERROR' | 'QUOTA_EXCEEDED';
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Chrome storage operations for keyboard preferences
 */
export namespace KeyboardStorage {
  const CURRENT_VERSION = 1;
  const MIGRATION_TIMEOUT = 10000; // 10 seconds

  /**
   * Default keyboard settings
   */
  const DEFAULT_SETTINGS: KeyboardSettings = {
    version: CURRENT_VERSION,
    visibility: {
      showOnFocus: true,
      autoHide: true,
      autoHideDelay: 3000,
      showShortcutHint: true,
      position: 'bottom',
      size: 'standard',
    },
    shortcuts: {
      toggleKeyboard: 'Ctrl+Shift+K',
      quickGenerate: 'Ctrl+Enter',
      selectTone: {},
      navigateUp: 'ArrowUp',
      navigateDown: 'ArrowDown',
      confirm: 'Enter',
      cancel: 'Escape',
    },
    platformSettings: {
      twitter: {
        enabled: true,
        autoShow: true,
        preferredPosition: 'below',
        excludeSelectors: [],
      },
      linkedin: {
        enabled: true,
        autoShow: false,
        preferredPosition: 'below',
        excludeSelectors: [],
      },
      reddit: {
        enabled: true,
        autoShow: false,
        preferredPosition: 'below',
        excludeSelectors: [],
      },
    },
    defaultTone: {
      toneId: null,
      useContextualSuggestions: true,
      autoApplyForPlatform: {
        twitter: false,
        linkedin: false,
        reddit: false,
      },
      fallbackToneId: null,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  /**
   * Default shortcuts configuration
   */
  const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
    toggleKeyboard: 'Ctrl+Shift+K',
    quickGenerate: 'Ctrl+Enter',
    selectTone: {},
    navigateUp: 'ArrowUp',
    navigateDown: 'ArrowDown',
    confirm: 'Enter',
    cancel: 'Escape',
  };

  /**
   * Save keyboard settings to storage
   */
  export async function saveSettings(
    settings: Partial<KeyboardSettings>
  ): Promise<void> {
    try {
      const currentSettings = await getSettings();
      const updatedSettings: KeyboardSettings = {
        ...currentSettings,
        ...settings,
        version: CURRENT_VERSION,
        updatedAt: Date.now(),
      };

      await chrome.storage.sync.set({
        [KeyboardStorageKey.KEYBOARD_SETTINGS]: updatedSettings,
      });
    } catch (error) {
      throw createStorageError('Failed to save keyboard settings', error);
    }
  }

  /**
   * Get keyboard settings from storage with defaults
   */
  export async function getSettings(): Promise<KeyboardSettings> {
    try {
      const result = await chrome.storage.sync.get([
        KeyboardStorageKey.KEYBOARD_SETTINGS,
      ]);
      const storedSettings = result[KeyboardStorageKey.KEYBOARD_SETTINGS] as
        | KeyboardSettings
        | undefined;

      if (!storedSettings) {
        // First time setup - save defaults
        await chrome.storage.sync.set({
          [KeyboardStorageKey.KEYBOARD_SETTINGS]: DEFAULT_SETTINGS,
        });
        return DEFAULT_SETTINGS;
      }

      // Handle migration if needed
      if (storedSettings.version < CURRENT_VERSION) {
        return await migrateSettings(storedSettings);
      }

      return storedSettings;
    } catch (error) {
      throw createStorageError('Failed to get keyboard settings', error);
    }
  }

  /**
   * Save default tone settings
   */
  export async function saveDefaultTone(
    toneSettings: DefaultToneSettings
  ): Promise<void> {
    try {
      await chrome.storage.sync.set({
        [KeyboardStorageKey.DEFAULT_TONE]: {
          ...toneSettings,
          updatedAt: Date.now(),
        },
      });

      // Also update in main settings
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        defaultTone: toneSettings,
      });
    } catch (error) {
      throw createStorageError('Failed to save default tone settings', error);
    }
  }

  /**
   * Get default tone settings
   */
  export async function getDefaultTone(): Promise<DefaultToneSettings> {
    try {
      const result = await chrome.storage.sync.get([
        KeyboardStorageKey.DEFAULT_TONE,
      ]);
      const storedTone = result[KeyboardStorageKey.DEFAULT_TONE] as
        | (DefaultToneSettings & { updatedAt: number })
        | undefined;

      if (!storedTone) {
        return DEFAULT_SETTINGS.defaultTone;
      }

      return {
        toneId: storedTone.toneId,
        useContextualSuggestions: storedTone.useContextualSuggestions,
        autoApplyForPlatform: storedTone.autoApplyForPlatform,
        fallbackToneId: storedTone.fallbackToneId,
      };
    } catch (error) {
      throw createStorageError('Failed to get default tone settings', error);
    }
  }

  /**
   * Save keyboard shortcuts
   */
  export async function saveShortcuts(
    shortcuts: Partial<KeyboardShortcuts>
  ): Promise<void> {
    try {
      const currentShortcuts = await getShortcuts();
      const updatedShortcuts: KeyboardShortcuts = {
        ...currentShortcuts,
        ...shortcuts,
      };

      await chrome.storage.sync.set({
        [KeyboardStorageKey.SHORTCUTS]: {
          ...updatedShortcuts,
          updatedAt: Date.now(),
        },
      });

      // Also update in main settings
      const settings = await getSettings();
      await saveSettings({
        ...settings,
        shortcuts: updatedShortcuts,
      });
    } catch (error) {
      throw createStorageError('Failed to save keyboard shortcuts', error);
    }
  }

  /**
   * Get keyboard shortcuts
   */
  export async function getShortcuts(): Promise<KeyboardShortcuts> {
    try {
      const result = await chrome.storage.sync.get([
        KeyboardStorageKey.SHORTCUTS,
      ]);
      const storedShortcuts = result[KeyboardStorageKey.SHORTCUTS] as
        | (KeyboardShortcuts & { updatedAt: number })
        | undefined;

      if (!storedShortcuts) {
        return DEFAULT_SHORTCUTS;
      }

      return {
        toggleKeyboard: storedShortcuts.toggleKeyboard,
        quickGenerate: storedShortcuts.quickGenerate,
        selectTone: storedShortcuts.selectTone,
        navigateUp: storedShortcuts.navigateUp,
        navigateDown: storedShortcuts.navigateDown,
        confirm: storedShortcuts.confirm,
        cancel: storedShortcuts.cancel,
      };
    } catch (error) {
      throw createStorageError('Failed to get keyboard shortcuts', error);
    }
  }

  /**
   * Save platform-specific settings
   */
  export async function savePlatformSettings(
    platform: keyof PlatformSettings,
    settings: PlatformSettings[keyof PlatformSettings]
  ): Promise<void> {
    try {
      const currentSettings = await getSettings();
      const updatedPlatformSettings = {
        ...currentSettings.platformSettings,
        [platform]: settings,
      };

      await saveSettings({
        ...currentSettings,
        platformSettings: updatedPlatformSettings,
      });
    } catch (error) {
      throw createStorageError(
        `Failed to save ${platform} platform settings`,
        error
      );
    }
  }

  /**
   * Get platform-specific settings
   */
  export async function getPlatformSettings(
    platform: keyof PlatformSettings
  ): Promise<PlatformSettings[keyof PlatformSettings]> {
    try {
      const settings = await getSettings();
      return settings.platformSettings[platform];
    } catch (error) {
      throw createStorageError(
        `Failed to get ${platform} platform settings`,
        error
      );
    }
  }

  /**
   * Track user behavior for smart defaults
   */
  export async function updateUserBehavior(
    behavior: Partial<UserBehaviorData>
  ): Promise<void> {
    try {
      const current = await getUserBehavior();
      const updated: UserBehaviorData = {
        ...current,
        ...behavior,
        lastAnalyzed: Date.now(),
      };

      await chrome.storage.sync.set({
        [KeyboardStorageKey.USER_BEHAVIOR]: updated,
      });
    } catch (error) {
      throw createStorageError('Failed to update user behavior data', error);
    }
  }

  /**
   * Get user behavior data
   */
  export async function getUserBehavior(): Promise<UserBehaviorData> {
    try {
      const result = await chrome.storage.sync.get([
        KeyboardStorageKey.USER_BEHAVIOR,
      ]);
      const storedBehavior = result[KeyboardStorageKey.USER_BEHAVIOR] as
        | UserBehaviorData
        | undefined;

      if (!storedBehavior) {
        const defaultBehavior: UserBehaviorData = {
          totalGenerations: 0,
          platformUsage: {},
          toneUsage: {},
          averageSessionDuration: 0,
          preferredTimes: [],
          lastAnalyzed: Date.now(),
        };

        await chrome.storage.sync.set({
          [KeyboardStorageKey.USER_BEHAVIOR]: defaultBehavior,
        });

        return defaultBehavior;
      }

      return storedBehavior;
    } catch (error) {
      throw createStorageError('Failed to get user behavior data', error);
    }
  }

  /**
   * Clear all keyboard storage data
   */
  export async function clearAllData(): Promise<void> {
    try {
      await chrome.storage.sync.remove(Object.values(KeyboardStorageKey));
    } catch (error) {
      throw createStorageError('Failed to clear keyboard storage data', error);
    }
  }

  /**
   * Get storage usage statistics for keyboard data
   */
  export async function getStorageStats(): Promise<{
    readonly bytesUsed: number;
    readonly itemCount: number;
    readonly lastUpdated: number;
  }> {
    try {
      const keys = Object.values(KeyboardStorageKey);
      const bytesUsed = await chrome.storage.sync.getBytesInUse(keys);
      const result = await chrome.storage.sync.get(keys);

      return {
        bytesUsed,
        itemCount: Object.keys(result).length,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      throw createStorageError(
        'Failed to get keyboard storage statistics',
        error
      );
    }
  }

  /**
   * Migrate settings from older versions
   */
  async function migrateSettings(
    oldSettings: KeyboardSettings
  ): Promise<KeyboardSettings> {
    try {
      // Currently only version 1, but this structure is ready for future migrations
      let migratedSettings = { ...oldSettings };

      // Migration logic would go here for future versions
      // if (oldSettings.version < 2) { ... }

      migratedSettings = {
        ...migratedSettings,
        version: CURRENT_VERSION,
        updatedAt: Date.now(),
      };

      await chrome.storage.sync.set({
        [KeyboardStorageKey.KEYBOARD_SETTINGS]: migratedSettings,
      });

      return migratedSettings;
    } catch (error) {
      throw createStorageError('Failed to migrate keyboard settings', error);
    }
  }

  /**
   * Create standardized storage error
   */
  function createStorageError(
    message: string,
    originalError: unknown
  ): KeyboardStorageError {
    return {
      code: 'STORAGE_ERROR',
      message,
      details: {
        originalError:
          originalError instanceof Error
            ? originalError.message
            : String(originalError),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
