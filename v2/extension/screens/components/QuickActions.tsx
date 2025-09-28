/**
 * QuickActions component for dashboard action grid
 * Features hover states, animations, keyboard navigation, and accessibility
 */

import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';

/**
 * Quick action item interface
 */
export interface QuickActionItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactElement;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly badge?: string | number;
}

/**
 * Quick actions props interface
 */
export interface QuickActionsProps {
  readonly actions: readonly QuickActionItem[];
  readonly loading?: boolean;
  readonly className?: string;
  readonly columns?: 2 | 3 | 4;
}

/**
 * Grid container styles
 */
const gridStyles = (theme: ThemeType, columns: number) => css`
  display: grid;
  grid-template-columns: repeat(${columns}, 1fr);
  gap: ${theme.spacing[4]};
  width: 100%;

  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing[3]};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[3]};
  }
`;

/**
 * Action card styles
 */
const actionCardStyles = (theme: ThemeType, disabled: boolean) => css`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${theme.spacing[6]};
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  cursor: ${disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease-in-out;
  opacity: ${disabled ? 0.6 : 1};
  position: relative;
  overflow: hidden;

  &:hover {
    ${!disabled &&
    `
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.md};
      border-color: ${theme.colors.interactive.primary};
      background-color: ${theme.colors.background.secondary};
    `}
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  &:active {
    ${!disabled &&
    `
      transform: translateY(0);
      box-shadow: ${theme.shadows.sm};
    `}
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

/**
 * Icon container styles
 */
const iconContainerStyles = (theme: ThemeType, disabled: boolean) => css`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing[4]};
  background-color: ${disabled
    ? theme.colors.background.secondary
    : theme.colors.interactive.primary};
  color: ${disabled ? theme.colors.text.tertiary : theme.colors.text.inverse};
  border-radius: ${theme.borderRadius.lg};
  transition: all 0.2s ease-in-out;

  svg {
    width: 24px;
    height: 24px;
  }

  .action-card:hover & {
    ${!disabled &&
    `
      transform: scale(1.1);
      background-color: ${theme.colors.interactive.primaryHover};
    `}
  }
`;

/**
 * Title styles
 */
const titleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.snug};
`;

/**
 * Description styles
 */
const descriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.relaxed};
`;

/**
 * Badge styles
 */
const badgeStyles = (theme: ThemeType) => css`
  position: absolute;
  top: ${theme.spacing[2]};
  right: ${theme.spacing[2]};
  background-color: ${theme.colors.status.error};
  color: ${theme.colors.text.inverse};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * Loading overlay styles
 */
const loadingOverlayStyles = () => css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

/**
 * Loading spinner styles
 */
const spinnerStyles = (theme: ThemeType) => css`
  width: 24px;
  height: 24px;
  border: 2px solid ${theme.colors.background.secondary};
  border-top: 2px solid ${theme.colors.interactive.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * Default action icons
 */
const CreateToneIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

const ViewAccountIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ManageTonesIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
  </svg>
);

/**
 * Get default icon for action
 */
const getDefaultIcon = (actionId: string): React.ReactElement => {
  switch (actionId) {
    case 'create-tone':
      return <CreateToneIcon />;
    case 'view-account':
      return <ViewAccountIcon />;
    case 'manage-tones':
      return <ManageTonesIcon />;
    case 'settings':
      return <SettingsIcon />;
    default:
      return <CreateToneIcon />;
  }
};

/**
 * Default quick actions data
 */
export const defaultQuickActions: readonly QuickActionItem[] = [
  {
    id: 'create-tone',
    title: 'Create Tone',
    description: 'Define a new tone for AI responses',
    icon: <CreateToneIcon />,
    onClick: () => console.log('Create tone clicked'),
  },
  {
    id: 'manage-tones',
    title: 'Manage Tones',
    description: 'Edit and organize your tones',
    icon: <ManageTonesIcon />,
    onClick: () => console.log('Manage tones clicked'),
    badge: 3,
  },
  {
    id: 'view-account',
    title: 'Account',
    description: 'View profile and settings',
    icon: <ViewAccountIcon />,
    onClick: () => console.log('View account clicked'),
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure extension preferences',
    icon: <SettingsIcon />,
    onClick: () => console.log('Settings clicked'),
  },
];

/**
 * Quick actions grid component
 */
export const QuickActions = forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ actions, loading = false, className, columns = 2 }, ref) => {
    const theme = defaultTheme;

    const handleActionClick = (action: QuickActionItem): void => {
      if (!action.disabled && !loading) {
        action.onClick();
      }
    };

    const handleKeyDown = (
      e: React.KeyboardEvent,
      action: QuickActionItem
    ): void => {
      if (
        (e.key === 'Enter' || e.key === ' ') &&
        !action.disabled &&
        !loading
      ) {
        e.preventDefault();
        action.onClick();
      }
    };

    return (
      <div ref={ref} className={className}>
        <div
          css={gridStyles(theme, columns)}
          role="grid"
          aria-label="Quick actions"
        >
          {actions.map(action => (
            <div
              key={action.id}
              css={actionCardStyles(theme, action.disabled ?? loading)}
              className="action-card"
              onClick={() => handleActionClick(action)}
              onKeyDown={e => handleKeyDown(e, action)}
              role="gridcell"
              tabIndex={(action.disabled ?? loading) ? -1 : 0}
              aria-label={`${action.title}: ${action.description}`}
              aria-disabled={action.disabled ?? loading}
            >
              {loading && (
                <div css={loadingOverlayStyles()}>
                  <div css={spinnerStyles(theme)} />
                </div>
              )}

              {action.badge && (
                <div
                  css={badgeStyles(theme)}
                  aria-label={`${action.badge} notifications`}
                >
                  {action.badge}
                </div>
              )}

              <div css={iconContainerStyles(theme, action.disabled ?? loading)}>
                {action.icon ?? getDefaultIcon(action.id)}
              </div>

              <h3 css={titleStyles(theme)}>{action.title}</h3>
              <p css={descriptionStyles(theme)}>{action.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

QuickActions.displayName = 'QuickActions';
