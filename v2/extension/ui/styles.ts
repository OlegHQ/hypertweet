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
  `;
  document.head.appendChild(style);
}
