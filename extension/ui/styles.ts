import { tokens, darkColors, lightColors, cssVars } from './tokens';
import { detectTheme, type Theme, type SiteType } from './theme';

const STYLES_ID = 'hypertweet-styles';
const THEME_VARS_ID = 'hypertweet-theme-vars';

type ColorKey = keyof typeof cssVars;
type Colors = Record<ColorKey, string>;

function generateThemeVars(colors: Colors): string {
  return (Object.keys(cssVars) as ColorKey[])
    .map(key => `${cssVars[key]}: ${colors[key]} !important;`)
    .join('\n    ');
}

export function setTheme(theme: Theme): void {
  const colors = theme === 'dark' ? darkColors : lightColors;

  let themeStyle = document.getElementById(
    THEME_VARS_ID
  ) as HTMLStyleElement | null;
  if (!themeStyle) {
    themeStyle = document.createElement('style');
    themeStyle.id = THEME_VARS_ID;
    document.head.appendChild(themeStyle);
  }

  themeStyle.textContent = `
    :root {
      ${generateThemeVars(colors)}
    }
  `;
}

export function injectGlobalStyles(siteType?: SiteType): void {
  if (document.getElementById(STYLES_ID)) {
    if (siteType) {
      setTheme(detectTheme(siteType));
    }
    return;
  }

  if (siteType) {
    setTheme(detectTheme(siteType));
  } else {
    setTheme('dark');
  }

  const style = document.createElement('style');
  style.id = STYLES_ID;
  style.textContent = `
    /* Button styles */
    .ht-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: ${tokens.spacing[2]} !important;
      white-space: nowrap !important;
      border-radius: ${tokens.radius.md} !important;
      font-family: ${tokens.font.sans} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      font-size: ${tokens.font.size.sm} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      outline: none !important;
      height: 36px !important;
      padding: 0 16px !important;
      border: none !important;
      box-sizing: border-box !important;
    }
    .ht-btn:disabled {
      pointer-events: none !important;
      opacity: 0.5 !important;
    }
    .ht-btn-default {
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
      border: 1px solid var(${cssVars.primary}) !important;
    }
    .ht-btn-default:hover {
      background: var(${cssVars.primaryHover}) !important;
    }
    .ht-btn-secondary {
      background: var(${cssVars.muted}) !important;
      color: var(${cssVars.foreground}) !important;
      border: 1px solid var(${cssVars.border}) !important;
    }
    .ht-btn-secondary:hover {
      background: var(${cssVars.cardHover}) !important;
    }
    .ht-btn-ghost {
      background: transparent !important;
      color: var(${cssVars.foreground}) !important;
      border: 1px solid transparent !important;
    }
    .ht-btn-ghost:hover {
      background: var(${cssVars.muted}) !important;
    }
    .ht-btn-sm {
      height: 32px !important;
      padding: 0 12px !important;
    }
    .ht-btn-lg {
      height: 40px !important;
      padding: 0 24px !important;
      font-size: ${tokens.font.size.base} !important;
    }

    /* Input styles */
    .ht-input-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-input-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
    }
    .ht-input {
      height: 36px !important;
      width: 100% !important;
      padding: 0 ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.input}) !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      transition: all ${tokens.transition.fast} !important;
      box-sizing: border-box !important;
    }
    .ht-input:focus {
      border-color: var(${cssVars.ring}) !important;
      box-shadow: 0 0 0 2px var(${cssVars.background}), 0 0 0 4px var(${cssVars.ring}) !important;
    }
    .ht-input::placeholder {
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-input-error {
      border-color: var(${cssVars.destructive}) !important;
    }
    .ht-input-error-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.destructive}) !important;
      margin: 0 !important;
    }

    /* Card styles */
    .ht-card {
      background: var(${cssVars.card}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.lg} !important;
      padding: ${tokens.spacing[4]} !important;
      font-family: ${tokens.font.sans} !important;
      color: var(${cssVars.foreground}) !important;
      box-sizing: border-box !important;
    }

    /* Form styles */
    .ht-form {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[4]} !important;
    }
    .ht-form-header {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[1]} !important;
      text-align: center !important;
    }
    .ht-form-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xl} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
      line-height: ${tokens.font.lineHeight.tight} !important;
    }
    .ht-form-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
      margin: 0 !important;
    }
    .ht-form-fields {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[3]} !important;
    }
    .ht-form-buttons {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
      padding-top: ${tokens.spacing[2]} !important;
    }

    /* Loading text */
    .ht-loading {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
    }

    /* Keyboard header */
    .ht-keyboard-header {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[2]} !important;
      margin-bottom: ${tokens.spacing[2]} !important;
    }
    .ht-keyboard-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
    }
    .ht-keyboard-model {
      flex: 1 !important;
      display: flex !important;
      justify-content: flex-end !important;
    }
    .ht-model-select {
      height: 24px !important;
      padding: 0 ${tokens.spacing[6]} 0 ${tokens.spacing[2]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: 11px !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      outline: none !important;
      cursor: pointer !important;
      appearance: none !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 4px center !important;
      transition: all ${tokens.transition.fast} !important;
      box-sizing: border-box !important;
      max-width: 140px !important;
    }
    .ht-model-select:hover {
      border-color: var(${cssVars.ring}) !important;
    }
    .ht-model-select:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    .ht-keyboard-actions {
      display: flex !important;
      gap: 2px !important;
    }

    /* Icon button */
    .ht-icon-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 24px !important;
      height: 24px !important;
      padding: 0 !important;
      background: transparent !important;
      border: none !important;
      border-radius: ${tokens.radius.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-icon-btn:hover {
      background: var(${cssVars.muted}) !important;
      color: var(${cssVars.foreground}) !important;
    }

    /* Tones grid */
    .ht-tones-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 4px !important;
    }
    .ht-tone-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 4px 8px !important;
      font-family: ${tokens.font.sans} !important;
      font-size: 11px !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      white-space: nowrap !important;
      line-height: 1.2 !important;
    }
    .ht-tone-btn:hover {
      background: var(${cssVars.cardHover}) !important;
      border-color: var(${cssVars.ring}) !important;
    }
    .ht-tones-loading,
    .ht-tones-empty {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      color: var(${cssVars.mutedForeground}) !important;
      text-align: center !important;
      padding: ${tokens.spacing[2]} !important;
    }

    /* Tabs */
    .ht-tabs {
      display: flex !important;
      border-bottom: 1px solid var(${cssVars.border}) !important;
      margin-bottom: ${tokens.spacing[4]} !important;
      gap: 0 !important;
    }
    .ht-tab {
      padding: ${tokens.spacing[2]} ${tokens.spacing[4]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.mutedForeground}) !important;
      background: transparent !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      margin-bottom: -1px !important;
    }
    .ht-tab:hover {
      color: var(${cssVars.foreground}) !important;
    }
    .ht-tab-active {
      color: var(${cssVars.primary}) !important;
      border-bottom-color: var(${cssVars.primary}) !important;
    }

    /* Select */
    .ht-select-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-select-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
    }
    .ht-select {
      height: 36px !important;
      width: 100% !important;
      padding: 0 ${tokens.spacing[8]} 0 ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.input}) !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      cursor: pointer !important;
      appearance: none !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23A1A1AA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right ${tokens.spacing[3]} center !important;
      transition: all ${tokens.transition.fast} !important;
      box-sizing: border-box !important;
    }
    .ht-select:focus {
      border-color: var(${cssVars.ring}) !important;
    }

    /* Textarea */
    .ht-textarea-wrapper {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-textarea-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
    }
    .ht-textarea {
      min-height: 80px !important;
      width: 100% !important;
      padding: ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.input}) !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      resize: vertical !important;
      box-sizing: border-box !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-textarea:focus {
      border-color: var(${cssVars.ring}) !important;
    }
    .ht-textarea-error {
      border-color: var(${cssVars.destructive}) !important;
    }
    .ht-textarea-error-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.destructive}) !important;
      margin: 0 !important;
    }

    /* Tone list */
    .ht-tone-list {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-tone-item {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: ${tokens.spacing[3]} !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
    }
    .ht-tone-item-info {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[2]} !important;
      flex: 1 !important;
      min-width: 0 !important;
    }
    .ht-tone-item-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .ht-tone-item-actions {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[1]} !important;
      flex-shrink: 0 !important;
    }

    /* Badge */
    .ht-badge {
      display: inline-flex !important;
      align-items: center !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      padding: 2px 6px !important;
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
      border-radius: ${tokens.radius.sm} !important;
      white-space: nowrap !important;
    }

    /* Toggle switch */
    .ht-toggle {
      position: relative !important;
      width: 36px !important;
      height: 20px !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      padding: 0 !important;
      appearance: none !important;
      outline: none !important;
      flex-shrink: 0 !important;
    }
    .ht-toggle::after {
      content: '' !important;
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      width: 14px !important;
      height: 14px !important;
      background: var(${cssVars.mutedForeground}) !important;
      border-radius: 50% !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-toggle-checked {
      background: var(${cssVars.primary}) !important;
      border-color: var(${cssVars.primary}) !important;
    }
    .ht-toggle-checked::after {
      left: 18px !important;
      background: var(${cssVars.toggleKnob}) !important;
    }

    /* Settings modal header */
    .ht-settings-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: ${tokens.spacing[4]} !important;
    }
    .ht-settings-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.lg} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
    }

    /* Section headings */
    .ht-section {
      margin-bottom: ${tokens.spacing[4]} !important;
    }
    .ht-section-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: ${tokens.spacing[3]} !important;
    }
    .ht-section-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
    }

    /* Divider */
    .ht-divider {
      height: 1px !important;
      background: var(${cssVars.border}) !important;
      margin: ${tokens.spacing[4]} 0 !important;
      border: none !important;
    }

    /* Destructive button variant */
    .ht-btn-destructive {
      background: var(${cssVars.destructive}) !important;
      color: var(${cssVars.destructiveForeground}) !important;
      border: 1px solid var(${cssVars.destructive}) !important;
    }
    .ht-btn-destructive:hover {
      background: #DC2626 !important;
      border-color: #DC2626 !important;
    }

    /* Success message */
    .ht-success-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.success}) !important;
      margin: 0 !important;
    }

    /* Danger zone */
    .ht-danger-zone {
      padding: ${tokens.spacing[4]} !important;
      background: rgba(239, 68, 68, 0.1) !important;
      border: 1px solid rgba(239, 68, 68, 0.2) !important;
      border-radius: ${tokens.radius.md} !important;
    }
    .ht-danger-zone-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.destructive}) !important;
      margin: 0 0 ${tokens.spacing[2]} 0 !important;
    }
    .ht-danger-zone-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
      margin: 0 0 ${tokens.spacing[3]} 0 !important;
    }

    /* Tone button loading state */
    .ht-tone-btn-loading {
      opacity: 0.7 !important;
      pointer-events: none !important;
    }

    /* Scrollable content */
    .ht-scrollable {
      max-height: 300px !important;
      overflow-y: auto !important;
    }

    /* Subtabs - smaller variant for nested tabs */
    .ht-subtabs {
      display: flex !important;
      gap: ${tokens.spacing[1]} !important;
      padding: ${tokens.spacing[1]} !important;
      background: var(${cssVars.muted}) !important;
      border-radius: ${tokens.radius.md} !important;
      margin-bottom: ${tokens.spacing[3]} !important;
    }
    .ht-subtab {
      flex: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: ${tokens.spacing[2]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.mutedForeground}) !important;
      background: transparent !important;
      border: none !important;
      border-radius: ${tokens.radius.sm} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      text-align: center !important;
      line-height: 1 !important;
      height: 32px !important;
      box-sizing: border-box !important;
    }
    .ht-subtab:hover {
      color: var(${cssVars.foreground}) !important;
    }
    .ht-subtab-active {
      background: var(${cssVars.card}) !important;
      color: var(${cssVars.foreground}) !important;
    }

    /* Accordion tone item for default tones */
    .ht-tone-accordion {
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
      overflow: hidden !important;
      margin-bottom: ${tokens.spacing[2]} !important;
    }
    .ht-tone-accordion-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: ${tokens.spacing[3]} !important;
      background: var(${cssVars.muted}) !important;
      cursor: pointer !important;
      transition: background ${tokens.transition.fast} !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-tone-accordion-header:hover {
      background: var(${cssVars.cardHover}) !important;
    }
    .ht-tone-accordion-title {
      flex: 1 !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
      text-align: left !important;
    }
    .ht-tone-accordion-title-disabled {
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-tone-accordion-content {
      padding: ${tokens.spacing[3]} !important;
      background: var(${cssVars.background}) !important;
      border-top: 1px solid var(${cssVars.border}) !important;
    }
    .ht-tone-accordion-instruction {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
      white-space: pre-wrap !important;
      margin: 0 !important;
      line-height: 1.5 !important;
    }
    .ht-tone-accordion-chevron {
      width: 16px !important;
      height: 16px !important;
      color: var(${cssVars.mutedForeground}) !important;
      transition: transform ${tokens.transition.fast} !important;
      flex-shrink: 0 !important;
    }
    .ht-tone-accordion-chevron-open {
      transform: rotate(180deg) !important;
    }

    /* Toggle row - label with toggle switch */
    .ht-toggle-row {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      padding: ${tokens.spacing[3]} !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
      gap: ${tokens.spacing[3]} !important;
    }
    .ht-toggle-row-content {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[1]} !important;
      flex: 1 !important;
    }
    .ht-toggle-row-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
    }
    .ht-toggle-row-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      color: var(${cssVars.mutedForeground}) !important;
      margin: 0 !important;
      line-height: 1.4 !important;
    }

    /* Checkbox styles */
    .ht-checkbox-list {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-checkbox-item {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[2]} !important;
      cursor: pointer !important;
      padding: ${tokens.spacing[2]} ${tokens.spacing[3]} !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-checkbox-item:hover {
      background: var(${cssVars.cardHover}) !important;
      border-color: var(${cssVars.ring}) !important;
    }
    .ht-checkbox {
      width: 16px !important;
      height: 16px !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      background: var(${cssVars.background}) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-checkbox-checked {
      background: var(${cssVars.primary}) !important;
      border-color: var(${cssVars.primary}) !important;
    }
    .ht-checkbox-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      flex: 1 !important;
    }

    /* Save indicator */
    .ht-save-indicator {
      display: inline-flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[1]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      color: var(${cssVars.success}) !important;
    }
    .ht-saving-indicator {
      color: var(${cssVars.mutedForeground}) !important;
    }

    /* Section description */
    .ht-section-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.mutedForeground}) !important;
      margin: 0 0 ${tokens.spacing[3]} 0 !important;
    }

    /* Settings layout with sidebar */
    .ht-settings-layout {
      display: flex !important;
      height: 500px !important;
    }

    /* Settings sidebar - clean minimal design */
    .ht-settings-sidebar {
      width: 200px !important;
      flex-shrink: 0 !important;
      border-right: 1px solid var(${cssVars.border}) !important;
      padding: ${tokens.spacing[3]} !important;
      background: linear-gradient(180deg, var(${cssVars.card}) 0%, var(${cssVars.sidebarGradientEnd}) 100%) !important;
      display: flex !important;
      flex-direction: column !important;
      border-radius: ${tokens.radius.xl} 0 0 ${tokens.radius.xl} !important;
    }
    .ht-settings-sidebar-header {
      padding: ${tokens.spacing[3]} ${tokens.spacing[3]} ${tokens.spacing[4]} !important;
      border-bottom: 1px solid var(${cssVars.border}) !important;
      margin-bottom: ${tokens.spacing[3]} !important;
    }
    .ht-settings-sidebar-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.base} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
      letter-spacing: -0.01em !important;
    }
    .ht-settings-menu {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      flex: 1 !important;
    }
    .ht-settings-menu-item {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[3]} !important;
      padding: 10px 12px !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.normal} !important;
      color: var(${cssVars.mutedForeground}) !important;
      background: transparent !important;
      border: none !important;
      border-radius: ${tokens.radius.md} !important;
      cursor: pointer !important;
      transition: all 150ms ease !important;
      text-align: left !important;
      width: 100% !important;
      position: relative !important;
    }
    .ht-settings-menu-item:hover {
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.hoverOverlay}) !important;
    }
    .ht-settings-menu-item-active {
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.activeOverlay}) !important;
      font-weight: ${tokens.font.weight.medium} !important;
    }
    .ht-settings-menu-item-active::before {
      content: '' !important;
      position: absolute !important;
      left: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 3px !important;
      height: 16px !important;
      background: var(${cssVars.primary}) !important;
      border-radius: 0 2px 2px 0 !important;
    }

    /* Settings main content */
    .ht-settings-main {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      min-width: 0 !important;
      overflow: hidden !important;
      background: var(${cssVars.card}) !important;
    }
    .ht-settings-main-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: ${tokens.spacing[4]} ${tokens.spacing[5]} !important;
      border-bottom: 1px solid var(${cssVars.border}) !important;
      flex-shrink: 0 !important;
      background: var(${cssVars.card}) !important;
    }
    .ht-settings-main-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.base} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
      letter-spacing: -0.01em !important;
    }
    .ht-settings-close-btn {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      background: transparent !important;
      border: none !important;
      border-radius: ${tokens.radius.md} !important;
      color: var(${cssVars.mutedForeground}) !important;
      cursor: pointer !important;
      transition: all 150ms ease !important;
    }
    .ht-settings-close-btn:hover {
      background: var(${cssVars.activeOverlay}) !important;
      color: var(${cssVars.foreground}) !important;
    }
    .ht-settings-content {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: ${tokens.spacing[5]} !important;
    }
    .ht-settings-content::-webkit-scrollbar {
      width: 6px !important;
    }
    .ht-settings-content::-webkit-scrollbar-track {
      background: transparent !important;
    }
    .ht-settings-content::-webkit-scrollbar-thumb {
      background: var(${cssVars.border}) !important;
      border-radius: 3px !important;
    }
    .ht-settings-content::-webkit-scrollbar-thumb:hover {
      background: var(${cssVars.mutedForeground}) !important;
    }

    /* Reddit suggestion display */
    .ht-suggestion-container {
      margin-bottom: ${tokens.spacing[2]} !important;
      padding: ${tokens.spacing[2]} !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
    }
    .ht-suggestion-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: ${tokens.spacing[2]} !important;
    }
    .ht-suggestion-label {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-suggestion-actions {
      display: flex !important;
      gap: 2px !important;
    }
    .ht-suggestion-content {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      padding: ${tokens.spacing[2]} !important;
      min-height: 60px !important;
      max-height: 150px !important;
      overflow-y: auto !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      line-height: 1.5 !important;
      outline: none !important;
      cursor: text !important;
    }
    .ht-suggestion-content:focus {
      border-color: var(${cssVars.ring}) !important;
      box-shadow: 0 0 0 2px var(${cssVars.background}), 0 0 0 4px var(${cssVars.ring}) !important;
    }
    .ht-suggestion-content::-webkit-scrollbar {
      width: 6px !important;
    }
    .ht-suggestion-content::-webkit-scrollbar-track {
      background: transparent !important;
    }
    .ht-suggestion-content::-webkit-scrollbar-thumb {
      background: var(${cssVars.border}) !important;
      border-radius: 3px !important;
    }

    /* Chat modal styles */
    .ht-chat-container {
      display: flex !important;
      flex-direction: column !important;
      height: 100% !important;
      overflow: hidden !important;
    }
    .ht-chat-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: ${tokens.spacing[3]} ${tokens.spacing[4]} !important;
      border-bottom: 1px solid var(${cssVars.border}) !important;
      flex-shrink: 0 !important;
    }
    .ht-chat-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.base} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: var(${cssVars.foreground}) !important;
      margin: 0 !important;
    }
    .ht-chat-actions {
      display: flex !important;
      gap: ${tokens.spacing[1]} !important;
    }
    .ht-chat-model-selector {
      flex: 1 !important;
      max-width: 200px !important;
      margin: 0 ${tokens.spacing[3]} !important;
    }
    .ht-chat-model-selector .ht-select-wrapper {
      margin: 0 !important;
    }
    .ht-chat-model-selector .ht-select {
      font-size: 12px !important;
      padding: ${tokens.spacing[1]} ${tokens.spacing[2]} !important;
    }
    .ht-chat-messages {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: ${tokens.spacing[4]} !important;
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[3]} !important;
    }
    .ht-chat-messages::-webkit-scrollbar {
      width: 6px !important;
    }
    .ht-chat-messages::-webkit-scrollbar-track {
      background: transparent !important;
    }
    .ht-chat-messages::-webkit-scrollbar-thumb {
      background: var(${cssVars.border}) !important;
      border-radius: 3px !important;
    }
    .ht-chat-empty {
      flex: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: var(${cssVars.mutedForeground}) !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
    }
    .ht-chat-message {
      display: flex !important;
      flex-direction: column !important;
      gap: ${tokens.spacing[1]} !important;
      max-width: 85% !important;
    }
    .ht-chat-message-user {
      align-self: flex-end !important;
    }
    .ht-chat-message-assistant {
      align-self: flex-start !important;
    }
    .ht-chat-message-header {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[2]} !important;
      padding: 0 ${tokens.spacing[2]} !important;
    }
    .ht-chat-message-role {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-chat-message-content {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.muted}) !important;
      border-radius: ${tokens.radius.lg} !important;
      padding: ${tokens.spacing[3]} !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
      line-height: 1.5 !important;
    }
    .ht-chat-message-user .ht-chat-message-content {
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
    }
    .ht-chat-message-copy {
      opacity: 0 !important;
      transition: opacity 150ms !important;
    }
    .ht-chat-message:hover .ht-chat-message-copy {
      opacity: 1 !important;
    }
    .ht-chat-input-area {
      display: flex !important;
      gap: ${tokens.spacing[2]} !important;
      padding: ${tokens.spacing[3]} ${tokens.spacing[4]} !important;
      border-top: 1px solid var(${cssVars.border}) !important;
      flex-shrink: 0 !important;
      background: var(${cssVars.card}) !important;
    }
    .ht-chat-input {
      flex: 1 !important;
      resize: none !important;
      min-height: 40px !important;
      max-height: 120px !important;
      padding: ${tokens.spacing[2]} ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: var(${cssVars.foreground}) !important;
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.input}) !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      box-sizing: border-box !important;
    }
    .ht-chat-input:focus {
      border-color: var(${cssVars.ring}) !important;
    }
    .ht-chat-input::placeholder {
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-chat-send-btn {
      align-self: flex-end !important;
      width: 40px !important;
      height: 40px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
      border: none !important;
      border-radius: ${tokens.radius.md} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      flex-shrink: 0 !important;
    }
    .ht-chat-send-btn:hover {
      background: var(${cssVars.primaryHover}) !important;
    }
    .ht-chat-send-btn:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    .ht-chat-streaming {
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[2]} !important;
      padding: ${tokens.spacing[2]} !important;
      color: var(${cssVars.mutedForeground}) !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
    }
    .ht-chat-streaming-dot {
      width: 6px !important;
      height: 6px !important;
      background: var(${cssVars.primary}) !important;
      border-radius: 50% !important;
      animation: ht-pulse 1s infinite !important;
    }
    @keyframes ht-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    /* Markdown/Streamdown styles */
    .ht-chat-message-content p {
      margin: 0 0 ${tokens.spacing[2]} 0 !important;
    }
    .ht-chat-message-content p:last-child {
      margin-bottom: 0 !important;
    }
    .ht-chat-message-content pre {
      background: var(${cssVars.background}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.md} !important;
      padding: ${tokens.spacing[3]} !important;
      margin: ${tokens.spacing[2]} 0 !important;
      overflow-x: auto !important;
      position: relative !important;
    }
    .ht-chat-message-user .ht-chat-message-content pre {
      background: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
    }
    .ht-chat-message-content code {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace !important;
      font-size: 13px !important;
    }
    .ht-chat-message-content pre code {
      background: transparent !important;
      padding: 0 !important;
    }
    .ht-chat-message-content :not(pre) > code {
      background: var(${cssVars.muted}) !important;
      padding: 2px 4px !important;
      border-radius: ${tokens.radius.sm} !important;
      font-size: 0.9em !important;
    }
    .ht-chat-message-user .ht-chat-message-content :not(pre) > code {
      background: rgba(255, 255, 255, 0.15) !important;
    }
    .ht-chat-message-content ul,
    .ht-chat-message-content ol {
      margin: ${tokens.spacing[2]} 0 !important;
      padding-left: ${tokens.spacing[5]} !important;
    }
    .ht-chat-message-content li {
      margin: ${tokens.spacing[1]} 0 !important;
    }
    .ht-chat-message-content blockquote {
      border-left: 3px solid var(${cssVars.border}) !important;
      margin: ${tokens.spacing[2]} 0 !important;
      padding-left: ${tokens.spacing[3]} !important;
      color: var(${cssVars.mutedForeground}) !important;
    }
    .ht-chat-message-content h1,
    .ht-chat-message-content h2,
    .ht-chat-message-content h3 {
      margin: ${tokens.spacing[3]} 0 ${tokens.spacing[2]} 0 !important;
      font-weight: ${tokens.font.weight.semibold} !important;
    }
    .ht-chat-message-content h1 { font-size: 1.3em !important; }
    .ht-chat-message-content h2 { font-size: 1.2em !important; }
    .ht-chat-message-content h3 { font-size: 1.1em !important; }
    .ht-chat-message-content a {
      color: var(${cssVars.primary}) !important;
      text-decoration: underline !important;
    }
    .ht-chat-message-user .ht-chat-message-content a {
      color: var(${cssVars.primaryForeground}) !important;
    }
    .ht-chat-message-content strong {
      font-weight: ${tokens.font.weight.semibold} !important;
    }
    .ht-chat-message-content table {
      border-collapse: collapse !important;
      width: 100% !important;
      margin: ${tokens.spacing[2]} 0 !important;
    }
    .ht-chat-message-content th,
    .ht-chat-message-content td {
      border: 1px solid var(${cssVars.border}) !important;
      padding: ${tokens.spacing[2]} !important;
      text-align: left !important;
    }
    .ht-chat-message-content th {
      background: var(${cssVars.muted}) !important;
      font-weight: ${tokens.font.weight.medium} !important;
    }

    /* Streamdown copy button override */
    .ht-chat-message-content [data-copy-button] {
      position: absolute !important;
      top: ${tokens.spacing[2]} !important;
      right: ${tokens.spacing[2]} !important;
      background: var(${cssVars.muted}) !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      padding: ${tokens.spacing[1]} !important;
      cursor: pointer !important;
      opacity: 0 !important;
      transition: opacity 150ms !important;
    }
    .ht-chat-message-content pre:hover [data-copy-button] {
      opacity: 1 !important;
    }
    .ht-chat-message-content [data-copy-button]:hover {
      background: var(${cssVars.mutedForeground}) !important;
      color: var(${cssVars.background}) !important;
    }

    /* Reply block styles */
    .ht-reply-block {
      background: color-mix(in srgb, var(${cssVars.primary}) 10%, transparent) !important;
      border: 1px solid var(${cssVars.primary}) !important;
      border-radius: ${tokens.radius.md} !important;
      padding: ${tokens.spacing[3]} !important;
      margin: ${tokens.spacing[2]} 0 !important;
      position: relative !important;
    }
    .ht-reply-block-content {
      white-space: pre-wrap !important;
      font-family: inherit !important;
      color: var(${cssVars.foreground}) !important;
      padding-right: 64px !important;
    }
    .ht-reply-block-btn {
      position: absolute !important;
      top: ${tokens.spacing[2]} !important;
      right: ${tokens.spacing[2]} !important;
      display: flex !important;
      align-items: center !important;
      gap: ${tokens.spacing[1]} !important;
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
      border: none !important;
      border-radius: ${tokens.radius.sm} !important;
      padding: ${tokens.spacing[1]} ${tokens.spacing[2]} !important;
      font-size: 12px !important;
      font-weight: ${tokens.font.weight.medium} !important;
      cursor: pointer !important;
      transition: opacity 150ms !important;
    }
    .ht-reply-block-btn:hover {
      opacity: 0.9 !important;
    }
    .ht-reply-block-btn svg {
      flex-shrink: 0 !important;
    }

    /* Edit inline input styles */
    .ht-edit-container {
      display: flex !important;
      gap: ${tokens.spacing[1]} !important;
      margin-top: ${tokens.spacing[2]} !important;
      padding-top: ${tokens.spacing[2]} !important;
      border-top: 1px solid var(${cssVars.border}) !important;
    }
    .ht-edit-input {
      flex: 1 !important;
      padding: ${tokens.spacing[1]} ${tokens.spacing[2]} !important;
      border: 1px solid var(${cssVars.border}) !important;
      border-radius: ${tokens.radius.sm} !important;
      font-size: 13px !important;
      font-family: inherit !important;
      background: var(${cssVars.background}) !important;
      color: var(${cssVars.foreground}) !important;
      outline: none !important;
    }
    .ht-edit-input:focus {
      border-color: var(${cssVars.primary}) !important;
    }
    .ht-edit-input:disabled {
      opacity: 0.6 !important;
    }
    .ht-edit-btn {
      padding: ${tokens.spacing[1]} ${tokens.spacing[2]} !important;
      border: none !important;
      border-radius: ${tokens.radius.sm} !important;
      font-size: 13px !important;
      font-weight: ${tokens.font.weight.medium} !important;
      cursor: pointer !important;
      background: var(${cssVars.primary}) !important;
      color: var(${cssVars.primaryForeground}) !important;
      transition: opacity 150ms !important;
    }
    .ht-edit-btn:hover {
      opacity: 0.9 !important;
    }
    .ht-edit-btn:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
    }
    .ht-edit-btn-cancel {
      background: var(${cssVars.muted}) !important;
      color: var(${cssVars.foreground}) !important;
    }
  `;
  document.head.appendChild(style);
}
