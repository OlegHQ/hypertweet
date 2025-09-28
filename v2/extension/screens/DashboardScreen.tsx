/**
 * Dashboard screen component with stats overview, quick actions, and activity feed
 * Features responsive layout, loading states, and comprehensive dashboard functionality
 */

import React, { useState, useEffect, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../styles/theme';
import { PageContainer } from '../components/layout/PageContainer';
import { StatsCard } from './components/StatsCard';
import { QuickActions, defaultQuickActions } from './components/QuickActions';
import { RecentActivity, defaultActivities } from './components/RecentActivity';
import type { LoadingState, LayoutError } from '../components/layout/types';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  readonly totalTones: number;
  readonly responsesGenerated: number;
  readonly averageEngagement: number;
  readonly activeConnections: number;
  readonly previousTotalTones?: number;
  readonly previousResponses?: number;
  readonly previousEngagement?: number;
  readonly previousConnections?: number;
}

/**
 * Dashboard screen props interface
 */
export interface DashboardScreenProps {
  readonly user?: {
    readonly name: string;
    readonly email: string;
  };
  readonly stats?: DashboardStats;
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onCreateTone?: () => void;
  readonly onManageTones?: () => void;
  readonly onViewAccount?: () => void;
  readonly onSettings?: () => void;
  readonly onRefresh?: () => void;
  readonly className?: string;
}

/**
 * Dashboard grid layout styles
 */
const dashboardGridStyles = (theme: ThemeType) => css`
  display: grid;
  gap: ${theme.spacing[6]};
  width: 100%;

  @media (max-width: ${theme.breakpoints.lg}) {
    gap: ${theme.spacing[4]};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    gap: ${theme.spacing[3]};
  }
`;

/**
 * Welcome section styles
 */
const welcomeSectionStyles = (theme: ThemeType) => css`
  background: linear-gradient(
    135deg,
    ${theme.colors.interactive.primary}10,
    ${theme.colors.status.info}10
  );
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
    margin-bottom: ${theme.spacing[4]};
  }
`;

/**
 * Welcome content styles
 */
const welcomeContentStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.spacing[4]};
  }
`;

/**
 * Welcome text section styles
 */
const welcomeTextStyles = () => css`
  flex: 1;
`;

/**
 * Welcome title styles
 */
const welcomeTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[2]} 0;
  line-height: ${theme.typography.lineHeight.tight};

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.fontSize.xl};
  }
`;

/**
 * Welcome subtitle styles
 */
const welcomeSubtitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.relaxed};
  max-width: 600px;

  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${theme.typography.fontSize.sm};
  }
`;

/**
 * Stats grid styles
 */
const statsGridStyles = (theme: ThemeType) => css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[8]};

  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: ${theme.spacing[3]};
    margin-bottom: ${theme.spacing[6]};
  }

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[3]};
    margin-bottom: ${theme.spacing[4]};
  }
`;

/**
 * Dashboard content grid styles
 */
const contentGridStyles = (theme: ThemeType) => css`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: ${theme.spacing[6]};
  align-items: start;

  @media (max-width: ${theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing[4]};
  }
`;

/**
 * Quick actions section styles
 */
const quickActionsSectionStyles = (theme: ThemeType) => css`
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing[4]};
  }
`;

/**
 * Section header styles
 */
const sectionHeaderStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing[6]};

  @media (max-width: ${theme.breakpoints.sm}) {
    margin-bottom: ${theme.spacing[4]};
  }
`;

/**
 * Section title styles
 */
const sectionTitleStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Dashboard icon component
 */
const DashboardIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

/**
 * Activity icon component
 */
const ActivityIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
  </svg>
);

/**
 * Default dashboard statistics
 */
export const defaultDashboardStats: DashboardStats = {
  totalTones: 8,
  responsesGenerated: 247,
  averageEngagement: 73.5,
  activeConnections: 3,
  previousTotalTones: 6,
  previousResponses: 189,
  previousEngagement: 68.2,
  previousConnections: 2,
};

/**
 * Mock data loading simulation
 */
const useDashboardData = (
  initialStats?: DashboardStats,
  onRefresh?: () => void
): {
  readonly stats: DashboardStats;
  readonly loading: LoadingState;
  readonly error: LayoutError | undefined;
  readonly refresh: () => void;
} => {
  const [stats, setStats] = useState<DashboardStats>(
    initialStats ?? defaultDashboardStats
  );
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<LayoutError | undefined>(undefined);

  const refresh = React.useCallback((): void => {
    setLoading('loading');
    setError(undefined);

    // Simulate API call
    setTimeout(() => {
      try {
        // Simulate random data updates
        const updatedStats: DashboardStats = {
          ...stats,
          responsesGenerated:
            stats.responsesGenerated + Math.floor(Math.random() * 5),
          averageEngagement:
            Math.round(
              (stats.averageEngagement + (Math.random() - 0.5) * 10) * 10
            ) / 10,
        };
        setStats(updatedStats);
        setLoading('success');
        onRefresh?.();
      } catch {
        setError({
          message: 'Failed to load dashboard data',
          code: 'DASHBOARD_LOAD_ERROR',
          retry: refresh,
        });
        setLoading('error');
      }
    }, 1500);
  }, [stats, onRefresh]);

  useEffect(() => {
    // Initial data load simulation
    if (loading === 'idle') {
      setLoading('loading');
      setTimeout(() => {
        setLoading('success');
      }, 800);
    }
  }, [loading]);

  return { stats, loading, error, refresh };
};

/**
 * Dashboard screen component with comprehensive dashboard functionality
 */
export const DashboardScreen = forwardRef<HTMLDivElement, DashboardScreenProps>(
  (
    {
      user,
      stats: initialStats,
      loading: externalLoading,
      error: externalError,
      onCreateTone,
      onManageTones,
      onViewAccount,
      onSettings,
      onRefresh,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const {
      stats,
      loading: dataLoading,
      error: dataError,
      refresh,
    } = useDashboardData(initialStats, onRefresh);

    // Use external loading/error states if provided, otherwise use internal
    const loading = externalLoading ?? dataLoading;
    const error = externalError ?? dataError;

    const isLoading = loading === 'loading';
    const userName = user?.name ?? 'User';

    // Create action handlers with provided callbacks
    const quickActions = React.useMemo(
      () =>
        defaultQuickActions.map(action => ({
          ...action,
          onClick: (): void => {
            switch (action.id) {
              case 'create-tone':
                onCreateTone?.();
                break;
              case 'manage-tones':
                onManageTones?.();
                break;
              case 'view-account':
                onViewAccount?.();
                break;
              case 'settings':
                onSettings?.();
                break;
              default:
                console.log(`${action.title} clicked`);
            }
          },
        })),
      [onCreateTone, onManageTones, onViewAccount, onSettings]
    );

    return (
      <PageContainer
        ref={ref}
        title="Dashboard"
        description="Overview of your AI response generation activity and quick access to key features"
        loading={loading}
        {...(error && { error })}
        {...(className && { className })}
        maxWidth="xl"
        padding="lg"
      >
        <div css={dashboardGridStyles(theme)}>
          {/* Welcome Section */}
          <section css={welcomeSectionStyles(theme)}>
            <div css={welcomeContentStyles(theme)}>
              <div css={welcomeTextStyles()}>
                <h2 css={welcomeTitleStyles(theme)}>
                  Welcome back, {userName}!
                </h2>
                <p css={welcomeSubtitleStyles(theme)}>
                  Here's what's happening with your AI-powered social media
                  responses. Create new tones, manage existing ones, and track
                  your engagement metrics.
                </p>
              </div>
            </div>
          </section>

          {/* Statistics Cards */}
          <section
            css={statsGridStyles(theme)}
            aria-label="Dashboard statistics"
          >
            <StatsCard
              title="Total Tones"
              value={stats.totalTones}
              {...(stats.previousTotalTones !== undefined && {
                previousValue: stats.previousTotalTones,
              })}
              suffix="tones"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M12 5v14m-7-7h14" />
                </svg>
              }
              loading={isLoading}
              {...(onManageTones && { onClick: onManageTones })}
            />
            <StatsCard
              title="Responses Generated"
              value={stats.responsesGenerated}
              {...(stats.previousResponses !== undefined && {
                previousValue: stats.previousResponses,
              })}
              suffix="responses"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              loading={isLoading}
            />
            <StatsCard
              title="Avg. Engagement"
              value={stats.averageEngagement}
              {...(stats.previousEngagement !== undefined && {
                previousValue: stats.previousEngagement,
              })}
              suffix="%"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M9 11H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z" />
                  <path d="M17 3h-2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                </svg>
              }
              loading={isLoading}
            />
            <StatsCard
              title="Active Connections"
              value={stats.activeConnections}
              {...(stats.previousConnections !== undefined && {
                previousValue: stats.previousConnections,
              })}
              suffix="platforms"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5c-.621 0-1.243-.249-1.691-.698L9 19l-1.5-1.5C7.051 17.051 7 16.529 7 16c0-.529.051-1.051.5-1.5L9 13" />
                  <path d="M8 20L3 15l5-5" />
                </svg>
              }
              loading={isLoading}
              {...(onViewAccount && { onClick: onViewAccount })}
            />
          </section>

          {/* Main Content Grid */}
          <div css={contentGridStyles(theme)}>
            {/* Quick Actions */}
            <section css={quickActionsSectionStyles(theme)}>
              <header css={sectionHeaderStyles(theme)}>
                <h3 css={sectionTitleStyles(theme)}>
                  <DashboardIcon />
                  Quick Actions
                </h3>
              </header>
              <QuickActions
                actions={quickActions}
                loading={isLoading}
                columns={2}
              />
            </section>

            {/* Recent Activity */}
            <section css={quickActionsSectionStyles(theme)}>
              <header css={sectionHeaderStyles(theme)}>
                <h3 css={sectionTitleStyles(theme)}>
                  <ActivityIcon />
                  Recent Activity
                </h3>
              </header>
              <RecentActivity
                activities={defaultActivities}
                loading={isLoading}
                onRetry={refresh}
                maxItems={5}
                showTimestamps={true}
              />
            </section>
          </div>
        </div>
      </PageContainer>
    );
  }
);

DashboardScreen.displayName = 'DashboardScreen';
