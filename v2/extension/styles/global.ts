/**
 * Global styles and CSS reset for Chrome extension
 */

import { css } from '@emotion/react';
import { type ThemeType } from './theme.js';

/**
 * Modern CSS reset with accessibility considerations
 */
export const cssReset = css`
  /* Box sizing reset */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* Remove default margins and padding */
  * {
    margin: 0;
    padding: 0;
  }

  /* HTML and body setup */
  html {
    /* Improve font rendering */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeSpeed;

    /* Prevent horizontal scroll */
    overflow-x: hidden;
  }

  body {
    min-height: 100vh;
    line-height: 1.5;

    /* Prevent font size adjustment on orientation change (iOS) */
    -webkit-text-size-adjust: 100%;
    -moz-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }

  /* Remove list styles */
  ul,
  ol {
    list-style: none;
  }

  /* Reset quotes */
  blockquote,
  q {
    quotes: none;
  }

  blockquote::before,
  blockquote::after,
  q::before,
  q::after {
    content: '';
    content: none;
  }

  /* Table reset */
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  /* Media elements */
  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  /* Form elements */
  input,
  button,
  textarea,
  select {
    font: inherit;
  }

  /* Remove default button styling */
  button {
    border: none;
    background: none;
    cursor: pointer;
  }

  /* Improve readability */
  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }

  /* Create a root stacking context */
  #root,
  #__next {
    isolation: isolate;
  }
`;

/**
 * Base typography styles with theme integration
 */
export const baseTypography = (theme: ThemeType) => css`
  html {
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.base};
    line-height: ${theme.typography.lineHeight.normal};
    color: ${theme.colors.text.primary};
  }

  body {
    background-color: ${theme.colors.background.primary};
    font-weight: ${theme.typography.fontWeight.normal};
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: ${theme.typography.fontWeight.semibold};
    line-height: ${theme.typography.lineHeight.tight};
    color: ${theme.colors.text.primary};
  }

  h1 {
    font-size: ${theme.typography.fontSize['3xl']};
  }

  h2 {
    font-size: ${theme.typography.fontSize['2xl']};
  }

  h3 {
    font-size: ${theme.typography.fontSize.xl};
  }

  h4 {
    font-size: ${theme.typography.fontSize.lg};
  }

  h5 {
    font-size: ${theme.typography.fontSize.base};
  }

  h6 {
    font-size: ${theme.typography.fontSize.sm};
  }

  /* Paragraph and text styles */
  p {
    color: ${theme.colors.text.primary};
    line-height: ${theme.typography.lineHeight.relaxed};
  }

  /* Small text */
  small {
    font-size: ${theme.typography.fontSize.sm};
    color: ${theme.colors.text.secondary};
  }

  /* Emphasis and strong */
  em {
    font-style: italic;
  }

  strong {
    font-weight: ${theme.typography.fontWeight.semibold};
  }

  /* Code and preformatted text */
  code,
  kbd,
  samp,
  pre {
    font-family: ${theme.typography.fontFamily.mono};
  }

  code {
    font-size: 0.875em;
    padding: 0.125em 0.25em;
    background-color: ${theme.colors.background.tertiary};
    border-radius: ${theme.borderRadius.sm};
  }

  pre {
    background-color: ${theme.colors.background.tertiary};
    padding: ${theme.spacing[4]};
    border-radius: ${theme.borderRadius.md};
    overflow-x: auto;
  }

  pre code {
    background-color: transparent;
    padding: 0;
  }
`;

/**
 * Link styles with proper states
 */
export const linkStyles = (theme: ThemeType) => css`
  a {
    color: ${theme.colors.interactive.primary};
    text-decoration: none;
    transition: color ${theme.transitions.duration.fast}
      ${theme.transitions.easing.easeOut};

    &:hover {
      color: ${theme.colors.interactive.primaryHover};
      text-decoration: underline;
    }

    &:active {
      color: ${theme.colors.interactive.primaryActive};
    }

    /* Visited links */
    &:visited {
      color: ${theme.colors.interactive.primary};
    }
  }
`;

/**
 * Focus styles for accessibility
 */
export const focusStyles = (theme: ThemeType) => css`
  /* Custom focus ring for better accessibility */
  *:focus {
    outline: none;
  }

  *:focus-visible {
    outline: 2px solid ${theme.colors.border.focus};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }

  /* Focus styles for interactive elements */
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible,
  [role='button']:focus-visible,
  [role='tab']:focus-visible,
  [role='menuitem']:focus-visible {
    outline: 2px solid ${theme.colors.border.focus};
    outline-offset: 2px;
  }

  /* Skip link styles for screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: ${theme.spacing[2]} ${theme.spacing[4]};
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    background-color: ${theme.colors.background.primary};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.primary};
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * Custom scrollbar styles for Chrome extension
 */
export const scrollbarStyles = (theme: ThemeType) => css`
  /* Webkit scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.borderRadius.full};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.border.secondary};
    border-radius: ${theme.borderRadius.full};
    transition: background-color ${theme.transitions.duration.fast}
      ${theme.transitions.easing.easeOut};

    &:hover {
      background: ${theme.colors.text.tertiary};
    }
  }

  /* Firefox scrollbar styling */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${theme.colors.border.secondary}
      ${theme.colors.background.secondary};
  }
`;

/**
 * Extension-specific base styles
 */
export const extensionBaseStyles = (theme: ThemeType) => css`
  /* Chrome extension root container */
  #extension-root {
    width: 100%;
    min-height: 100vh;
    font-family: ${theme.typography.fontFamily.sans};
    font-size: ${theme.typography.fontSize.base};
    line-height: ${theme.typography.lineHeight.normal};
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.primary};
  }

  /* Sidebar container specific styles */
  .sidebar-container {
    width: 400px;
    height: 600px;
    overflow: hidden;
    border-radius: ${theme.borderRadius.lg};
    box-shadow: ${theme.shadows.lg};
    background-color: ${theme.colors.background.primary};
  }

  /* Loading states */
  .loading-spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Fade transitions for page changes */
  .page-transition-enter {
    opacity: 0;
    transform: translateY(${theme.spacing[4]});
  }

  .page-transition-enter-active {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity ${theme.transitions.duration.normal}
        ${theme.transitions.easing.easeOut},
      transform ${theme.transitions.duration.normal}
        ${theme.transitions.easing.easeOut};
  }

  .page-transition-exit {
    opacity: 1;
    transform: translateY(0);
  }

  .page-transition-exit-active {
    opacity: 0;
    transform: translateY(-${theme.spacing[4]});
    transition:
      opacity ${theme.transitions.duration.normal}
        ${theme.transitions.easing.easeOut},
      transform ${theme.transitions.duration.normal}
        ${theme.transitions.easing.easeOut};
  }
`;

/**
 * Flexbox utility classes
 */
export const flexUtilities = () => css`
  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .flex-row {
    flex-direction: row;
  }

  .items-center {
    align-items: center;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .flex-1 {
    flex: 1 1 0%;
  }
`;

/**
 * Spacing utility classes
 */
export const spacingUtilities = (theme: ThemeType) => css`
  .p-0 {
    padding: ${theme.spacing[0]};
  }
  .p-1 {
    padding: ${theme.spacing[1]};
  }
  .p-2 {
    padding: ${theme.spacing[2]};
  }
  .p-3 {
    padding: ${theme.spacing[3]};
  }
  .p-4 {
    padding: ${theme.spacing[4]};
  }
  .p-6 {
    padding: ${theme.spacing[6]};
  }
  .p-8 {
    padding: ${theme.spacing[8]};
  }

  .m-0 {
    margin: ${theme.spacing[0]};
  }
  .m-1 {
    margin: ${theme.spacing[1]};
  }
  .m-2 {
    margin: ${theme.spacing[2]};
  }
  .m-3 {
    margin: ${theme.spacing[3]};
  }
  .m-4 {
    margin: ${theme.spacing[4]};
  }
  .m-6 {
    margin: ${theme.spacing[6]};
  }
  .m-8 {
    margin: ${theme.spacing[8]};
  }
`;

/**
 * Typography utility classes
 */
export const typographyUtilities = (theme: ThemeType) => css`
  .text-center {
    text-align: center;
  }
  .text-left {
    text-align: left;
  }
  .text-right {
    text-align: right;
  }

  .font-light {
    font-weight: ${theme.typography.fontWeight.light};
  }
  .font-normal {
    font-weight: ${theme.typography.fontWeight.normal};
  }
  .font-medium {
    font-weight: ${theme.typography.fontWeight.medium};
  }
  .font-semibold {
    font-weight: ${theme.typography.fontWeight.semibold};
  }
  .font-bold {
    font-weight: ${theme.typography.fontWeight.bold};
  }
`;

/**
 * Layout utility classes
 */
export const layoutUtilities = () => css`
  .hidden {
    display: none;
  }
  .block {
    display: block;
  }
  .inline-block {
    display: inline-block;
  }

  .relative {
    position: relative;
  }
  .absolute {
    position: absolute;
  }
  .fixed {
    position: fixed;
  }

  .overflow-hidden {
    overflow: hidden;
  }
  .overflow-auto {
    overflow: auto;
  }
  .overflow-scroll {
    overflow: scroll;
  }

  .w-full {
    width: 100%;
  }
  .h-full {
    height: 100%;
  }
  .min-h-screen {
    min-height: 100vh;
  }
`;

/**
 * Combined utility classes
 */
export const utilityClasses = (theme: ThemeType) => css`
  ${flexUtilities()}
  ${spacingUtilities(theme)}
  ${typographyUtilities(theme)}
  ${layoutUtilities()}
`;

/**
 * Complete global styles function
 */
export const createGlobalStyles = (theme: ThemeType) => css`
  ${cssReset}
  ${baseTypography(theme)}
  ${linkStyles(theme)}
  ${focusStyles(theme)}
  ${scrollbarStyles(theme)}
  ${extensionBaseStyles(theme)}
  ${utilityClasses(theme)}
`;

/**
 * Media query helpers for responsive design
 */
export const mediaQueries = {
  sm: `@media (min-width: 640px)`,
  md: `@media (min-width: 768px)`,
  lg: `@media (min-width: 1024px)`,
  xl: `@media (min-width: 1280px)`,
  '2xl': `@media (min-width: 1536px)`,

  // Utility for reduced motion preference
  reducedMotion: '@media (prefers-reduced-motion: reduce)',

  // High contrast preference
  highContrast: '@media (prefers-contrast: high)',

  // Dark mode preference
  darkMode: '@media (prefers-color-scheme: dark)',
} as const;
