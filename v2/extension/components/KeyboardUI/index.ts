/**
 * KeyboardUI component library exports
 *
 * Provides a clean interface for importing keyboard components and utilities
 * throughout the extension codebase.
 */

// Main component exports
export { BaseKeyboard } from './BaseKeyboard.js';
export { KeyboardLayout } from './KeyboardLayout.js';
export { ButtonGrid } from './ButtonGrid.js';
export { KeyboardButton } from './KeyboardButton.js';
export { CompactKeyboard } from './CompactKeyboard.js';
export { ToneSelector } from './ToneSelector.js';
export { QuickActions } from './QuickActions.js';
export { TonePresets } from './TonePresets.js';
export { AdvancedKeyboard } from './AdvancedKeyboard.js';

// Type definitions and interfaces
export type {
  Platform,
  KeyboardState,
  ToneMode,
  AnimationState,
  KeyboardError,
  PositionConfig,
  PlatformConfig,
  TargetElement,
  ToneActionHandler,
  QuickAction,
  QuickActionHandler,
  KeyboardEventHandlers,
  AccessibilityConfig,
  KeyboardConfig,
  BaseKeyboardProps,
  KeyboardThemeVariant,
  KeyboardSize,
  TonePreset,
  KeyboardMetrics,
} from './types.js';

// Component-specific props
export type { KeyboardLayoutProps } from './KeyboardLayout.js';
export type { ButtonGridProps, GridItem, GridLayout } from './ButtonGrid.js';
export type { KeyboardButtonProps, ButtonVariant, ButtonContent } from './KeyboardButton.js';
export type { CompactKeyboardProps } from './CompactKeyboard.js';
export type { ToneSelectorProps, ToneCategory, ToneFilterConfig, CustomTone } from './ToneSelector.js';
export type { QuickActionsProps, QuickActionDef, ActionState, ActionResult } from './QuickActions.js';
export type { TonePresetsProps, PresetAction, ToneCollection, ToneUsageStats } from './TonePresets.js';
export type { AdvancedKeyboardProps, AdvancedKeyboardMode } from './AdvancedKeyboard.js';

// Utility functions and type guards
export {
  isPlatform,
  isKeyboardState,
  isToneMode,
  createKeyboardError,
  mergeAccessibilityConfig,
  mergePositionConfig,
  KeyboardDefaults,
} from './types.js';

// Component configuration constants
export const KEYBOARD_VERSION = '1.0.0' as const;

export const SUPPORTED_PLATFORMS = ['twitter', 'linkedin', 'reddit'] as const;

export const DEFAULT_QUICK_TONES = [
  'professional',
  'friendly',
  'casual',
  'formal',
] as const;

export const DEFAULT_QUICK_ACTIONS = [
  'generate',
  'copy',
  'clear',
  'settings',
  'help',
  'toggle',
] as const;
