/**
 * Shared authentication layout component
 * Provides consistent branding, styling, and structure for auth screens
 */

import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';

/**
 * Auth layout props interface
 */
export interface AuthLayoutProps {
  readonly children: React.ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly className?: string;
}

/**
 * Main container styles
 */
const containerStyles = (theme: ThemeType) => css`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    ${theme.colors.background.primary} 0%,
    ${theme.colors.background.secondary} 100%
  );
  padding: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[2]};
  }
`;

/**
 * Content wrapper styles
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const contentStyles = (_theme: ThemeType) => css`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
`;

/**
 * Auth card container styles
 */
const authCardStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.shadows.xl};
  border: 1px solid ${theme.colors.border.primary};
  padding: ${theme.spacing[8]};
  width: 100%;
  max-width: 400px;

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[6]};
    max-width: 350px;
    border-radius: ${theme.borderRadius.lg};
  }
`;

/**
 * Header section styles
 */
const headerStyles = (theme: ThemeType) => css`
  text-align: center;
  margin-bottom: ${theme.spacing[8]};
`;

/**
 * Logo container styles
 */
const logoStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[6]};
`;

/**
 * Logo icon styles
 */
const logoIconStyles = (theme: ThemeType) => css`
  width: 32px;
  height: 32px;
  background-color: ${theme.colors.interactive.primary};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.lg};
`;

/**
 * Logo text styles
 */
const logoTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

/**
 * Subtitle styles
 */
const subtitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.relaxed};
`;

/**
 * Footer styles
 */
const footerStyles = (theme: ThemeType) => css`
  text-align: center;
  margin-top: ${theme.spacing[8]};
  padding-top: ${theme.spacing[4]};
`;

/**
 * Footer text styles
 */
const footerTextStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.tertiary};
  margin: 0;
`;

/**
 * Footer link styles
 */
const footerLinkStyles = (theme: ThemeType) => css`
  color: ${theme.colors.interactive.primary};
  text-decoration: none;
  font-weight: ${theme.typography.fontWeight.medium};

  &:hover {
    color: ${theme.colors.interactive.primaryHover};
    text-decoration: underline;
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * Chrome extension logo icon
 */
const ExtensionIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="HyperTweet Extension"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

/**
 * Shared authentication layout component
 */
export const AuthLayout = forwardRef<HTMLDivElement, AuthLayoutProps>(
  ({ children, title, subtitle, className }, ref) => {
    const theme = defaultTheme;

    return (
      <div
        ref={ref}
        css={containerStyles(theme)}
        {...(className && { className })}
      >
        <div css={contentStyles(theme)}>
          <div css={authCardStyles(theme)}>
            {/* Header with logo and branding */}
            <header css={headerStyles(theme)}>
              <div css={logoStyles(theme)}>
                <div css={logoIconStyles(theme)}>
                  <ExtensionIcon />
                </div>
                <h1 css={logoTextStyles(theme)}>HyperTweet</h1>
              </div>

              <h2 css={titleStyles(theme)}>{title}</h2>
              {subtitle && <p css={subtitleStyles(theme)}>{subtitle}</p>}
            </header>

            {/* Form content */}
            <main>{children}</main>
          </div>
        </div>

        {/* Footer */}
        <footer css={footerStyles(theme)}>
          <p css={footerTextStyles(theme)}>
            HyperTweet Extension v2.0 •{' '}
            <a
              href="#privacy"
              css={footerLinkStyles(theme)}
              onClick={e => {
                e.preventDefault();
                // Handle privacy policy navigation
                console.log('Privacy policy clicked');
              }}
            >
              Privacy Policy
            </a>
            {' • '}
            <a
              href="#terms"
              css={footerLinkStyles(theme)}
              onClick={e => {
                e.preventDefault();
                // Handle terms navigation
                console.log('Terms of service clicked');
              }}
            >
              Terms of Service
            </a>
          </p>
        </footer>
      </div>
    );
  }
);

AuthLayout.displayName = 'AuthLayout';
