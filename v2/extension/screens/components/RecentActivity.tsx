/**
 * RecentActivity component for displaying user activity feed
 * Features timeline view, activity types, and responsive design
 */

import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';

/**
 * Activity types
 */
export type ActivityType =
  | 'tone_created'
  | 'tone_used'
  | 'response_generated'
  | 'account_updated'
  | 'login';

/**
 * Activity item interface
 */
export interface ActivityItem {
  readonly id: string;
  readonly type: ActivityType;
  readonly title: string;
  readonly description?: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Recent activity props interface
 */
export interface RecentActivityProps {
  readonly activities: readonly ActivityItem[];
  readonly loading?: boolean;
  readonly error?: string;
  readonly onRetry?: () => void;
  readonly maxItems?: number;
  readonly showTimestamps?: boolean;
  readonly className?: string;
}

/**
 * Container styles
 */
const containerStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
`;

/**
 * Header styles
 */
const headerStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[4]} ${theme.spacing[6]};
  border-bottom: 1px solid ${theme.colors.border.primary};
  background-color: ${theme.colors.background.secondary};
`;

/**
 * Header title styles
 */
const headerTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Activity list styles
 */
const activityListStyles = (theme: ThemeType) => css`
  max-height: 400px;
  overflow-y: auto;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.border.primary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${theme.colors.border.secondary};
  }
`;

/**
 * Activity item styles
 */
const activityItemStyles = (theme: ThemeType, isLast: boolean) => css`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]} ${theme.spacing[6]};
  border-bottom: ${isLast
    ? 'none'
    : `1px solid ${theme.colors.border.primary}`};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[3]} ${theme.spacing[4]};
    gap: ${theme.spacing[2]};
  }
`;

/**
 * Activity icon container styles
 */
const iconContainerStyles = (
  theme: ThemeType,
  activityType: ActivityType
) => css`
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: ${theme.spacing[1]};

  background-color: ${getActivityColor(activityType, theme).background};
  color: ${getActivityColor(activityType, theme).foreground};

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Activity content styles
 */
const contentStyles = () => css`
  flex: 1;
  min-width: 0;
`;

/**
 * Activity title styles
 */
const activityTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
  line-height: ${theme.typography.lineHeight.snug};
`;

/**
 * Activity description styles
 */
const descriptionStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0 0 ${theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.relaxed};
`;

/**
 * Timestamp styles
 */
const timestampStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.tertiary};
  margin: 0;
`;

/**
 * Empty state styles
 */
const emptyStateStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[8]} ${theme.spacing[6]};
  text-align: center;
  color: ${theme.colors.text.secondary};
`;

/**
 * Empty state icon styles
 */
const emptyIconStyles = (theme: ThemeType) => css`
  width: 48px;
  height: 48px;
  margin: 0 auto ${theme.spacing[4]};
  color: ${theme.colors.text.tertiary};
`;

/**
 * Loading skeleton styles
 */
const skeletonStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[4]} ${theme.spacing[6]};

  .skeleton-item {
    display: flex;
    gap: ${theme.spacing[3]};
    margin-bottom: ${theme.spacing[4]};

    &:last-child {
      margin-bottom: 0;
    }
  }

  .skeleton-icon {
    width: 32px;
    height: 32px;
    background-color: ${theme.colors.background.secondary};
    border-radius: ${theme.borderRadius.md};
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  .skeleton-content {
    flex: 1;

    .skeleton-line {
      height: 16px;
      background-color: ${theme.colors.background.secondary};
      border-radius: ${theme.borderRadius.sm};
      margin-bottom: ${theme.spacing[2]};
      animation: skeleton-pulse 1.5s ease-in-out infinite;

      &:last-child {
        margin-bottom: 0;
        width: 60%;
        height: 12px;
      }
    }
  }

  @keyframes skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

/**
 * Error state styles
 */
const errorStyles = (theme: ThemeType) => css`
  padding: ${theme.spacing[6]};
  text-align: center;
  color: ${theme.colors.status.error};
`;

/**
 * Retry button styles
 */
const retryButtonStyles = (theme: ThemeType) => css`
  margin-top: ${theme.spacing[3]};
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  background-color: ${theme.colors.interactive.primary};
  color: ${theme.colors.text.inverse};
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.interactive.primaryHover};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Get activity color scheme
 */
const getActivityColor = (type: ActivityType, theme: ThemeType) => {
  switch (type) {
    case 'tone_created':
      return {
        background: theme.colors.status.successBackground,
        foreground: theme.colors.status.success,
      };
    case 'tone_used':
    case 'response_generated':
      return {
        background: theme.colors.status.infoBackground,
        foreground: theme.colors.status.info,
      };
    case 'account_updated':
      return {
        background: theme.colors.status.warningBackground,
        foreground: theme.colors.status.warning,
      };
    case 'login':
      return {
        background: theme.colors.background.secondary,
        foreground: theme.colors.text.secondary,
      };
    default:
      return {
        background: theme.colors.background.secondary,
        foreground: theme.colors.text.secondary,
      };
  }
};

/**
 * Activity type icons
 */
const ToneCreatedIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M12 5v14m-7-7h14" />
  </svg>
);

const ToneUsedIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const ResponseGeneratedIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const AccountUpdatedIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LoginIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10,17 15,12 10,7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const ActivityIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);

const EmptyActivityIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

/**
 * Get icon for activity type
 */
const getActivityIcon = (type: ActivityType): React.ReactElement => {
  switch (type) {
    case 'tone_created':
      return <ToneCreatedIcon />;
    case 'tone_used':
      return <ToneUsedIcon />;
    case 'response_generated':
      return <ResponseGeneratedIcon />;
    case 'account_updated':
      return <AccountUpdatedIcon />;
    case 'login':
      return <LoginIcon />;
    default:
      return <ActivityIcon />;
  }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return timestamp.toLocaleDateString();
  }
};

/**
 * Default activity data for demo
 */
export const defaultActivities: readonly ActivityItem[] = [
  {
    id: '1',
    type: 'tone_created',
    title: 'Created new tone "Professional"',
    description: 'Added a formal tone for business communications',
    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
  },
  {
    id: '2',
    type: 'response_generated',
    title: 'Generated 5 responses',
    description: 'Used "Casual" tone for Twitter interactions',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: '3',
    type: 'tone_used',
    title: 'Applied "Friendly" tone',
    description: 'Helped craft a LinkedIn post response',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '4',
    type: 'account_updated',
    title: 'Profile updated',
    description: 'Changed communication preferences',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
];

/**
 * Recent activity feed component
 */
export const RecentActivity = forwardRef<HTMLDivElement, RecentActivityProps>(
  (
    {
      activities,
      loading = false,
      error,
      onRetry,
      maxItems = 10,
      showTimestamps = true,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const displayActivities = activities.slice(0, maxItems);

    const renderContent = (): React.ReactNode => {
      if (loading) {
        return (
          <div css={skeletonStyles(theme)}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-icon" />
                <div className="skeleton-content">
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (error) {
        return (
          <div css={errorStyles(theme)}>
            <p>Failed to load activities</p>
            {onRetry && (
              <button
                type="button"
                css={retryButtonStyles(theme)}
                onClick={onRetry}
              >
                Retry
              </button>
            )}
          </div>
        );
      }

      if (displayActivities.length === 0) {
        return (
          <div css={emptyStateStyles(theme)}>
            <div css={emptyIconStyles(theme)}>
              <EmptyActivityIcon />
            </div>
            <h3>No recent activity</h3>
            <p>Your recent actions will appear here</p>
          </div>
        );
      }

      return (
        <div css={activityListStyles(theme)}>
          {displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              css={activityItemStyles(
                theme,
                index === displayActivities.length - 1
              )}
            >
              <div css={iconContainerStyles(theme, activity.type)}>
                {getActivityIcon(activity.type)}
              </div>
              <div css={contentStyles()}>
                <h4 css={activityTitleStyles(theme)}>{activity.title}</h4>
                {activity.description && (
                  <p css={descriptionStyles(theme)}>{activity.description}</p>
                )}
                {showTimestamps && (
                  <p css={timestampStyles(theme)}>
                    {formatTimestamp(activity.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div ref={ref} css={containerStyles(theme)} className={className}>
        <header css={headerStyles(theme)}>
          <h2 css={headerTitleStyles(theme)}>
            <ActivityIcon />
            Recent Activity
          </h2>
        </header>
        {renderContent()}
      </div>
    );
  }
);

RecentActivity.displayName = 'RecentActivity';
