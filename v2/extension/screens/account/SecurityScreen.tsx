/**
 * SecurityScreen component for managing account security settings
 * Features password management, active sessions, and security recommendations
 */

import { useState, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import type { LoadingState, LayoutError } from '../../components/layout/types';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { PasswordChangeForm } from '../../components/forms/PasswordChangeForm';
import { SectionCard } from './components/SectionCard';

/**
 * Active session interface
 */
interface ActiveSession {
  readonly id: string;
  readonly deviceInfo: string;
  readonly browser: string;
  readonly location: string;
  readonly ipAddress: string;
  readonly lastActive: Date;
  readonly current: boolean;
}

/**
 * Login activity interface
 */
interface LoginActivity {
  readonly id: string;
  readonly timestamp: Date;
  readonly deviceInfo: string;
  readonly location: string;
  readonly ipAddress: string;
  readonly success: boolean;
  readonly suspicious: boolean;
}

/**
 * Security recommendation interface
 */
interface SecurityRecommendation {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly action?: string;
  readonly completed: boolean;
}

/**
 * Security screen props interface
 */
export interface SecurityScreenProps {
  readonly activeSessions?: readonly ActiveSession[];
  readonly loginHistory?: readonly LoginActivity[];
  readonly recommendations?: readonly SecurityRecommendation[];
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onChangePassword?: (oldPassword: string, newPassword: string) => Promise<void>;
  readonly onTerminateSession?: (sessionId: string) => Promise<void>;
  readonly onTerminateAllSessions?: () => Promise<void>;
  readonly className?: string;
}

/**
 * Session item styles
 */
const sessionItemStyles = (theme: ThemeType, current: boolean) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  background: ${current ? theme.colors.background.secondary : theme.colors.background.secondary};
  border: 1px solid ${current ? theme.colors.interactive.primary : theme.colors.border.primary};
  margin-bottom: ${theme.spacing[3]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Session info styles
 */

/**
 * Device name styles
 */
const deviceNameStyles = (theme: ThemeType) => css`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
  font-size: ${theme.typography.fontSize.base};
`;

/**
 * Session details styles
 */
const sessionDetailsStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
  line-height: ${theme.typography.lineHeight.normal};
`;

/**
 * Login activity item styles
 */
const activityItemStyles = (theme: ThemeType, suspicious: boolean, success: boolean) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  background: ${suspicious 
    ? theme.colors.status.errorBackground 
    : success 
      ? theme.colors.background.secondary 
      : theme.colors.status.warningBackground
  };
  border: 1px solid ${suspicious 
    ? theme.colors.status.error 
    : success 
      ? theme.colors.border.primary 
      : theme.colors.status.warning
  };
  margin-bottom: ${theme.spacing[2]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Activity status styles
 */
const activityStatusStyles = (theme: ThemeType, suspicious: boolean, success: boolean) => css`
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  background: ${suspicious 
    ? theme.colors.status.error 
    : success 
      ? theme.colors.status.success 
      : theme.colors.status.warning
  };
  color: white;
`;

/**
 * Recommendation item styles
 */
const recommendationItemStyles = (theme: ThemeType, severity: 'low' | 'medium' | 'high') => css`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[4]};
  border-radius: ${theme.borderRadius.lg};
  background: ${severity === 'high' 
    ? theme.colors.status.errorBackground 
    : severity === 'medium' 
      ? theme.colors.status.warningBackground 
      : theme.colors.status.infoBackground
  };
  border: 1px solid ${severity === 'high' 
    ? theme.colors.status.error 
    : severity === 'medium' 
      ? theme.colors.status.warning 
      : theme.colors.status.info
  };
  margin-bottom: ${theme.spacing[3]};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Severity icon styles
 */
const severityIconStyles = (theme: ThemeType, severity: 'low' | 'medium' | 'high') => css`
  font-size: ${theme.typography.fontSize.lg};
  color: ${severity === 'high' 
    ? theme.colors.status.error 
    : severity === 'medium' 
      ? theme.colors.status.warning 
      : theme.colors.status.info
  };
  margin-top: ${theme.spacing[1]};
`;

/**
 * Recommendation content styles
 */

/**
 * Recommendation title styles
 */
const recommendationTitleStyles = (theme: ThemeType) => css`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
  font-size: ${theme.typography.fontSize.base};
`;

/**
 * Mock active sessions data
 */
const mockActiveSessions: readonly ActiveSession[] = [
  {
    id: '1',
    deviceInfo: 'MacBook Pro (Current)',
    browser: 'Chrome 118.0',
    location: 'San Francisco, CA',
    ipAddress: '192.168.1.100',
    lastActive: new Date(),
    current: true,
  },
  {
    id: '2',
    deviceInfo: 'iPhone 15 Pro',
    browser: 'Safari Mobile',
    location: 'San Francisco, CA',
    ipAddress: '192.168.1.101',
    lastActive: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    current: false,
  },
];

/**
 * Mock login history data
 */
const mockLoginHistory: readonly LoginActivity[] = [
  {
    id: '1',
    timestamp: new Date(),
    deviceInfo: 'MacBook Pro',
    location: 'San Francisco, CA',
    ipAddress: '192.168.1.100',
    success: true,
    suspicious: false,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    deviceInfo: 'iPhone 15 Pro',
    location: 'San Francisco, CA',
    ipAddress: '192.168.1.101',
    success: true,
    suspicious: false,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    deviceInfo: 'Unknown Device',
    location: 'Unknown Location',
    ipAddress: '123.456.789.012',
    success: false,
    suspicious: true,
  },
];

/**
 * Mock security recommendations data
 */
const mockRecommendations: readonly SecurityRecommendation[] = [
  {
    id: '1',
    title: 'Enable Two-Factor Authentication',
    description: 'Add an extra layer of security to your account by enabling 2FA.',
    severity: 'high',
    action: 'Enable 2FA',
    completed: false,
  },
  {
    id: '2',
    title: 'Review Login History',
    description: 'Check for any suspicious login attempts or unknown devices.',
    severity: 'medium',
    action: 'Review Activity',
    completed: false,
  },
  {
    id: '3',
    title: 'Update Password',
    description: 'Your password is over 6 months old. Consider updating it.',
    severity: 'medium',
    action: 'Change Password',
    completed: false,
  },
];

/**
 * SecurityScreen component with comprehensive security management
 */
export const SecurityScreen = forwardRef<HTMLDivElement, SecurityScreenProps>(
  (
    {
      activeSessions = mockActiveSessions,
      loginHistory = mockLoginHistory,
      recommendations = mockRecommendations,
      loading = 'idle',
      error,
      onTerminateSession,
      onTerminateAllSessions,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    const handleTerminateSession = useCallback(
      async (sessionId: string): Promise<void> => {
        if (!onTerminateSession) return;

        try {
          await onTerminateSession(sessionId);
          setSuccessMessage('Session terminated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch {
          // Error handling would be managed by parent component
        }
      },
      [onTerminateSession]
    );

    const handleTerminateAllSessions = useCallback(async (): Promise<void> => {
      if (!onTerminateAllSessions) return;

      try {
        await onTerminateAllSessions();
        setSuccessMessage('All other sessions terminated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      }
    }, [onTerminateAllSessions]);

    const formatTimeAgo = (date: Date): string => {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    };

    const getSeverityIcon = (severity: 'low' | 'medium' | 'high'): string => {
      switch (severity) {
        case 'high': return '🔴';
        case 'medium': return '🟡';
        case 'low': return '🔵';
        default: return '🔵';
      }
    };

    return (
      <PageContainer
        ref={ref}
        title="Security"
        description="Manage your account security and login settings"
        loading={loading}
        {...error && { error }}
        {...className && { className }}
        maxWidth="lg"
        padding="lg"
      >
        {successMessage && (
          <Alert status="success" variant="subtle" style={{ marginBottom: theme.spacing[6] }}>
            {successMessage}
          </Alert>
        )}

        {/* Password Management */}
        <SectionCard
          title="Password"
          description="Update your account password for better security"
          actions={
            <Button
              variant="primary"
              onClick={() => setShowPasswordForm(true)}
              disabled={showPasswordForm}
            >
              Change Password
            </Button>
          }
          css={{ marginBottom: theme.spacing[6] }}
        >
          {!showPasswordForm ? (
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm 
            }}>
              Your password was last changed 6 months ago. For better security, 
              consider updating it regularly.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <PasswordChangeForm onPasswordChangeSuccess={() => setShowPasswordForm(false)} />
              <Button variant="secondary" onClick={() => setShowPasswordForm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </SectionCard>

        {/* Active Sessions */}
        <SectionCard
          title="Active Sessions"
          description="Manage devices that are currently signed into your account"
          actions={
            <Button
              variant="secondary"
              onClick={handleTerminateAllSessions}
              size="sm"
            >
              Terminate All Others
            </Button>
          }
          css={{ marginBottom: theme.spacing[6] }}
        >
          {activeSessions.map(session => (
            <div key={session.id} css={sessionItemStyles(theme, session.current)}>
              <div style={{ flex: 1 }}>
                <h4 css={deviceNameStyles(theme)}>
                  {session.deviceInfo}
                  {session.current && (
                    <span style={{ 
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.interactive.primary,
                      fontWeight: theme.typography.fontWeight.normal,
                      marginLeft: theme.spacing[2]
                    }}>
                      (Current)
                    </span>
                  )}
                </h4>
                <p css={sessionDetailsStyles(theme)}>
                  {session.browser} • {session.location} • {session.ipAddress}
                  <br />
                  Last active: {formatTimeAgo(session.lastActive)}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleTerminateSession(session.id)}
                >
                  Terminate
                </Button>
              )}
            </div>
          ))}
        </SectionCard>

        {/* Security Recommendations */}
        <SectionCard
          title="Security Recommendations"
          description="Suggestions to improve your account security"
          css={{ marginBottom: theme.spacing[6] }}
        >
          {recommendations.map(recommendation => (
            <div key={recommendation.id} css={recommendationItemStyles(theme, recommendation.severity)}>
              <div css={severityIconStyles(theme, recommendation.severity)}>
                {getSeverityIcon(recommendation.severity)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 css={recommendationTitleStyles(theme)}>
                  {recommendation.title}
                </h4>
                <p style={{ 
                  margin: `0 0 ${theme.spacing[2]} 0`,
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.sm 
                }}>
                  {recommendation.description}
                </p>
                {recommendation.action && !recommendation.completed && (
                  <Button variant="primary" size="sm">
                    {recommendation.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Login History */}
        <SectionCard
          title="Recent Login Activity"
          description="Monitor login attempts and identify suspicious activity"
        >
          {loginHistory.map(activity => (
            <div key={activity.id} css={activityItemStyles(theme, activity.suspicious, activity.success)}>
              <div>
                <p style={{ 
                  margin: `0 0 ${theme.spacing[1]} 0`,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.primary,
                  fontSize: theme.typography.fontSize.sm 
                }}>
                  {activity.deviceInfo} • {activity.location}
                </p>
                <p style={{ 
                  margin: 0,
                  color: theme.colors.text.secondary,
                  fontSize: theme.typography.fontSize.xs 
                }}>
                  {activity.ipAddress} • {activity.timestamp.toLocaleString()}
                </p>
              </div>
              <div css={activityStatusStyles(theme, activity.suspicious, activity.success)}>
                {activity.suspicious ? 'Suspicious' : activity.success ? 'Success' : 'Failed'}
              </div>
            </div>
          ))}
        </SectionCard>
      </PageContainer>
    );
  }
);

SecurityScreen.displayName = 'SecurityScreen';