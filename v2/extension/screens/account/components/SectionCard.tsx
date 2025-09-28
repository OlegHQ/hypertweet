/**
 * SectionCard component for organizing account management sections
 * Provides consistent styling and layout for profile, security, and settings sections
 */

import React, { forwardRef } from 'react';
import { css, type SerializedStyles } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../../styles/theme';
import { Card } from '../../../components/common/Card';

/**
 * Section card props interface
 */
export interface SectionCardProps {
  readonly title: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly actions?: React.ReactNode;
  readonly warning?: string;
  readonly success?: string;
  readonly loading?: boolean;
  readonly collapsible?: boolean;
  readonly defaultCollapsed?: boolean;
  readonly css?: any;
}

/**
 * Section header styles
 */
const headerStyles = (theme: ThemeType) => css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing[4]};
  padding-bottom: ${theme.spacing[3]};
  border-bottom: 1px solid ${theme.colors.border.primary};
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.tight};
`;

/**
 * Description styles
 */
const descriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: ${theme.spacing[1]} 0 0 0;
  line-height: ${theme.typography.lineHeight.normal};
`;

/**
 * Actions wrapper styles
 */
const actionsStyles = (theme: ThemeType) => css`
  display: flex;
  gap: ${theme.spacing[2]};
  align-items: center;
  margin-left: ${theme.spacing[4]};
`;

/**
 * Content wrapper styles
 */
const contentStyles = (_theme: ThemeType, collapsed: boolean) => css`
  transition: all 0.2s ease-in-out;
  opacity: ${collapsed ? 0 : 1};
  max-height: ${collapsed ? '0' : 'none'};
  overflow: ${collapsed ? 'hidden' : 'visible'};
`;

/**
 * Warning message styles
 */
const warningStyles = (theme: ThemeType) => css`
  background: ${theme.colors.status.warningBackground};
  border: 1px solid ${theme.colors.status.warning};
  color: ${theme.colors.status.warning};
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  margin-bottom: ${theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};

  &::before {
    content: '⚠️';
    font-size: ${theme.typography.fontSize.base};
  }
`;

/**
 * Success message styles
 */
const successStyles = (theme: ThemeType) => css`
  background: ${theme.colors.status.successBackground};
  border: 1px solid ${theme.colors.status.success};
  color: ${theme.colors.status.success};
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  margin-bottom: ${theme.spacing[4]};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};

  &::before {
    content: '✅';
    font-size: ${theme.typography.fontSize.base};
  }
`;

/**
 * Loading overlay styles
 */
const loadingOverlayStyles = (theme: ThemeType) => css`
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${theme.colors.background.primary};
    opacity: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }
`;

/**
 * Collapse toggle button styles
 */
const toggleButtonStyles = (theme: ThemeType) => css`
  background: none;
  border: none;
  cursor: pointer;
  padding: ${theme.spacing[1]};
  color: ${theme.colors.text.secondary};
  transition: color 0.2s ease-in-out;
  font-size: ${theme.typography.fontSize.lg};
  
  &:hover {
    color: ${theme.colors.text.secondary};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * SectionCard component for account management sections
 */
export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  (
    {
      title,
      description,
      children,
      className,
      actions,
      warning,
      success,
      loading = false,
      collapsible = false,
      defaultCollapsed = false,
      css,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    const handleToggleCollapse = (): void => {
      setCollapsed(prev => !prev);
    };

    return (
      <Card
        ref={ref}
        size="lg"
        className={className}
        css={loading ? loadingOverlayStyles(theme) : css}
      >
        <div css={headerStyles(theme)}>
          <div>
            <h3 css={titleStyles(theme)}>
              {title}
              {collapsible && (
                <button
                  type="button"
                  css={toggleButtonStyles(theme)}
                  onClick={handleToggleCollapse}
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
                  style={{ marginLeft: theme.spacing[2] }}
                >
                  {collapsed ? '▶' : '▼'}
                </button>
              )}
            </h3>
            {description && (
              <p css={descriptionStyles(theme)}>{description}</p>
            )}
          </div>
          {actions && !collapsed && (
            <div css={actionsStyles(theme)}>{actions}</div>
          )}
        </div>

        <div css={contentStyles(theme, collapsed)}>
          {warning && <div css={warningStyles(theme)}>{warning}</div>}
          {success && <div css={successStyles(theme)}>{success}</div>}
          {children}
        </div>
      </Card>
    );
  }
);

SectionCard.displayName = 'SectionCard';