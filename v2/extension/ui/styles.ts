import { tokens } from './tokens';

const STYLES_ID = 'hypertweet-styles';

export function injectGlobalStyles(): void {
  if (document.getElementById(STYLES_ID)) return;

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
      background: ${tokens.colors.primary} !important;
      color: ${tokens.colors.primaryForeground} !important;
      border: 1px solid ${tokens.colors.primary} !important;
    }
    .ht-btn-default:hover {
      background: ${tokens.colors.primaryHover} !important;
    }
    .ht-btn-secondary {
      background: ${tokens.colors.muted} !important;
      color: ${tokens.colors.foreground} !important;
      border: 1px solid ${tokens.colors.border} !important;
    }
    .ht-btn-secondary:hover {
      background: ${tokens.colors.cardHover} !important;
    }
    .ht-btn-ghost {
      background: transparent !important;
      color: ${tokens.colors.foreground} !important;
      border: 1px solid transparent !important;
    }
    .ht-btn-ghost:hover {
      background: ${tokens.colors.muted} !important;
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
      color: ${tokens.colors.foreground} !important;
    }
    .ht-input {
      height: 36px !important;
      width: 100% !important;
      padding: 0 ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.foreground} !important;
      background: ${tokens.colors.background} !important;
      border: 1px solid ${tokens.colors.input} !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      transition: all ${tokens.transition.fast} !important;
      box-sizing: border-box !important;
    }
    .ht-input:focus {
      border-color: ${tokens.colors.ring} !important;
      box-shadow: 0 0 0 2px ${tokens.colors.background}, 0 0 0 4px ${tokens.colors.ring} !important;
    }
    .ht-input::placeholder {
      color: ${tokens.colors.mutedForeground} !important;
    }
    .ht-input-error {
      border-color: ${tokens.colors.destructive} !important;
    }
    .ht-input-error-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.destructive} !important;
      margin: 0 !important;
    }

    /* Card styles */
    .ht-card {
      background: ${tokens.colors.card} !important;
      border: 1px solid ${tokens.colors.border} !important;
      border-radius: ${tokens.radius.lg} !important;
      padding: ${tokens.spacing[4]} !important;
      font-family: ${tokens.font.sans} !important;
      color: ${tokens.colors.foreground} !important;
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
      color: ${tokens.colors.foreground} !important;
      margin: 0 !important;
      line-height: ${tokens.font.lineHeight.tight} !important;
    }
    .ht-form-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.mutedForeground} !important;
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
      color: ${tokens.colors.mutedForeground} !important;
    }

    /* Keyboard header */
    .ht-keyboard-header {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      margin-bottom: ${tokens.spacing[3]} !important;
    }
    .ht-keyboard-title {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.semibold} !important;
      color: ${tokens.colors.foreground} !important;
    }
    .ht-keyboard-actions {
      display: flex !important;
      gap: ${tokens.spacing[1]} !important;
    }

    /* Icon button */
    .ht-icon-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 28px !important;
      height: 28px !important;
      padding: 0 !important;
      background: transparent !important;
      border: none !important;
      border-radius: ${tokens.radius.md} !important;
      color: ${tokens.colors.mutedForeground} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-icon-btn:hover {
      background: ${tokens.colors.muted} !important;
      color: ${tokens.colors.foreground} !important;
    }

    /* Tones grid */
    .ht-tones-grid {
      display: grid !important;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)) !important;
      gap: ${tokens.spacing[2]} !important;
    }
    .ht-tone-btn {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: ${tokens.spacing[2]} ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.xs} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: ${tokens.colors.foreground} !important;
      background: ${tokens.colors.muted} !important;
      border: 1px solid ${tokens.colors.border} !important;
      border-radius: ${tokens.radius.md} !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
    }
    .ht-tone-btn:hover {
      background: ${tokens.colors.cardHover} !important;
      border-color: ${tokens.colors.ring} !important;
    }
    .ht-tones-loading,
    .ht-tones-empty {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.mutedForeground} !important;
      text-align: center !important;
      padding: ${tokens.spacing[4]} !important;
    }

    /* Tabs */
    .ht-tabs {
      display: flex !important;
      border-bottom: 1px solid ${tokens.colors.border} !important;
      margin-bottom: ${tokens.spacing[4]} !important;
      gap: 0 !important;
    }
    .ht-tab {
      padding: ${tokens.spacing[2]} ${tokens.spacing[4]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      font-weight: ${tokens.font.weight.medium} !important;
      color: ${tokens.colors.mutedForeground} !important;
      background: transparent !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      margin-bottom: -1px !important;
    }
    .ht-tab:hover {
      color: ${tokens.colors.foreground} !important;
    }
    .ht-tab-active {
      color: ${tokens.colors.primary} !important;
      border-bottom-color: ${tokens.colors.primary} !important;
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
      color: ${tokens.colors.foreground} !important;
    }
    .ht-select {
      height: 36px !important;
      width: 100% !important;
      padding: 0 ${tokens.spacing[8]} 0 ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.foreground} !important;
      background: ${tokens.colors.background} !important;
      border: 1px solid ${tokens.colors.input} !important;
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
      border-color: ${tokens.colors.ring} !important;
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
      color: ${tokens.colors.foreground} !important;
    }
    .ht-textarea {
      min-height: 80px !important;
      width: 100% !important;
      padding: ${tokens.spacing[3]} !important;
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.foreground} !important;
      background: ${tokens.colors.background} !important;
      border: 1px solid ${tokens.colors.input} !important;
      border-radius: ${tokens.radius.md} !important;
      outline: none !important;
      resize: vertical !important;
      box-sizing: border-box !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-textarea:focus {
      border-color: ${tokens.colors.ring} !important;
    }
    .ht-textarea-error {
      border-color: ${tokens.colors.destructive} !important;
    }
    .ht-textarea-error-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.destructive} !important;
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
      background: ${tokens.colors.muted} !important;
      border: 1px solid ${tokens.colors.border} !important;
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
      color: ${tokens.colors.foreground} !important;
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
      background: ${tokens.colors.primary} !important;
      color: ${tokens.colors.primaryForeground} !important;
      border-radius: ${tokens.radius.sm} !important;
      white-space: nowrap !important;
    }

    /* Toggle switch */
    .ht-toggle {
      position: relative !important;
      width: 36px !important;
      height: 20px !important;
      background: ${tokens.colors.muted} !important;
      border: 1px solid ${tokens.colors.border} !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      transition: all ${tokens.transition.fast} !important;
      padding: 0 !important;
      appearance: none !important;
      outline: none !important;
    }
    .ht-toggle::after {
      content: '' !important;
      position: absolute !important;
      top: 2px !important;
      left: 2px !important;
      width: 14px !important;
      height: 14px !important;
      background: ${tokens.colors.foreground} !important;
      border-radius: 50% !important;
      transition: all ${tokens.transition.fast} !important;
    }
    .ht-toggle-checked {
      background: ${tokens.colors.primary} !important;
      border-color: ${tokens.colors.primary} !important;
    }
    .ht-toggle-checked::after {
      left: 18px !important;
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
      color: ${tokens.colors.foreground} !important;
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
      color: ${tokens.colors.foreground} !important;
      margin: 0 !important;
    }

    /* Divider */
    .ht-divider {
      height: 1px !important;
      background: ${tokens.colors.border} !important;
      margin: ${tokens.spacing[4]} 0 !important;
      border: none !important;
    }

    /* Destructive button variant */
    .ht-btn-destructive {
      background: ${tokens.colors.destructive} !important;
      color: ${tokens.colors.destructiveForeground} !important;
      border: 1px solid ${tokens.colors.destructive} !important;
    }
    .ht-btn-destructive:hover {
      background: #DC2626 !important;
      border-color: #DC2626 !important;
    }

    /* Success message */
    .ht-success-text {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.success} !important;
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
      color: ${tokens.colors.destructive} !important;
      margin: 0 0 ${tokens.spacing[2]} 0 !important;
    }
    .ht-danger-zone-description {
      font-family: ${tokens.font.sans} !important;
      font-size: ${tokens.font.size.sm} !important;
      color: ${tokens.colors.mutedForeground} !important;
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
  `;
  document.head.appendChild(style);
}
