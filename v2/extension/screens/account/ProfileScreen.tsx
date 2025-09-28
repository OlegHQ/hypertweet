/**
 * ProfileScreen component for managing user profile and account information
 * Features profile editing, account statistics, and email verification status
 */

import { useState, useCallback, forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import { PageContainer } from '../../components/layout/PageContainer';
import type { LoadingState, LayoutError } from '../../components/layout/types';
import { Button } from '../../components/common/Button';
import { ProfileEditForm } from '../../components/forms/ProfileEditForm';
import { SectionCard } from './components/SectionCard';

/**
 * User profile data interface
 */
interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly bio?: string;
  readonly avatar?: string;
  readonly isEmailVerified: boolean;
  readonly createdAt: Date;
  readonly lastLoginAt?: Date;
  readonly profileCompleteness: number;
}

/**
 * Account statistics interface
 */
interface AccountStats {
  readonly totalTones: number;
  readonly favoriteTonesCount: number;
  readonly totalGenerations: number;
  readonly averageRating: number;
  readonly joinedDaysAgo: number;
}

/**
 * Profile screen props interface
 */
export interface ProfileScreenProps {
  readonly user?: UserProfile;
  readonly stats?: AccountStats;
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly onUpdateProfile?: (data: { name: string; email: string; bio: string }) => Promise<void>;
  readonly onVerifyEmail?: () => Promise<void>;
  readonly onUploadAvatar?: (file: File) => Promise<string>;
  readonly className?: string;
}

/**
 * Profile header styles
 */
const profileHeaderStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
  
  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
    gap: ${theme.spacing[3]};
  }
`;

/**
 * Avatar container styles
 */

/**
 * Avatar styles
 */
const avatarStyles = (theme: ThemeType) => css`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  border: 3px solid ${theme.colors.border.primary};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/**
 * Profile info styles
 */

/**
 * Name styles
 */
const nameStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

/**
 * Email styles
 */
const emailStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.base};
  color: ${theme.colors.text.secondary};
  margin: 0 0 ${theme.spacing[2]} 0;
`;

/**
 * Verification badge styles
 */
const verificationBadgeStyles = (theme: ThemeType, verified: boolean) => css`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  background: ${verified ? theme.colors.status.successBackground : theme.colors.status.warningBackground};
  color: ${verified ? theme.colors.status.success : theme.colors.status.warning};
  border: 1px solid ${verified ? theme.colors.status.success : theme.colors.status.warning};
`;

/**
 * Stats grid styles
 */
const statsGridStyles = (theme: ThemeType) => css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
`;

/**
 * Stat item styles
 */
const statItemStyles = (theme: ThemeType) => css`
  text-align: center;
  padding: ${theme.spacing[4]};
  background: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border.primary};
`;

/**
 * Stat value styles
 */
const statValueStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.interactive.primary};
  margin: 0 0 ${theme.spacing[1]} 0;
`;

/**
 * Stat label styles
 */
const statLabelStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

/**
 * Progress bar styles
 */
const progressBarStyles = (theme: ThemeType, progress: number) => css`
  width: 100%;
  height: 8px;
  background: ${theme.colors.background.secondary};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  margin: ${theme.spacing[2]} 0;
  
  &::after {
    content: '';
    display: block;
    width: ${progress}%;
    height: 100%;
    background: ${theme.colors.interactive.primary};
    transition: width 0.3s ease-in-out;
  }
`;

/**
 * Mock user data for development
 */
const mockUser: UserProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  bio: 'Product manager passionate about AI and user experience. Love creating tone-perfect responses.',
  isEmailVerified: true,
  createdAt: new Date('2024-01-15'),
  lastLoginAt: new Date(),
  profileCompleteness: 85,
};

/**
 * Mock statistics data
 */
const mockStats: AccountStats = {
  totalTones: 12,
  favoriteTonesCount: 5,
  totalGenerations: 847,
  averageRating: 4.6,
  joinedDaysAgo: Math.floor((Date.now() - mockUser.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
};

/**
 * ProfileScreen component with comprehensive profile management
 */
export const ProfileScreen = forwardRef<HTMLDivElement, ProfileScreenProps>(
  (
    {
      user = mockUser,
      stats = mockStats,
      loading = 'idle',
      error,
      onUpdateProfile,
      onVerifyEmail,
      className,
    },
    ref
  ) => {
    const theme = defaultTheme;
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string>('');

    const handleEditProfile = useCallback((): void => {
      setIsEditing(true);
    }, []);

    const handleCancelEdit = useCallback((): void => {
      setIsEditing(false);
    }, []);

    const handleSaveProfile = useCallback(
      async (data: { name: string; email: string; bio: string }): Promise<void> => {
        if (!onUpdateProfile) return;

        try {
          setIsSaving(true);
          await onUpdateProfile(data);
          setIsEditing(false);
          setSuccessMessage('Profile updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } catch {
          // Error handling would be managed by parent component
        } finally {
          setIsSaving(false);
        }
      },
      [onUpdateProfile]
    );

    const handleVerifyEmail = useCallback(async (): Promise<void> => {
      if (!onVerifyEmail) return;

      try {
        await onVerifyEmail();
        setSuccessMessage('Verification email sent!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        // Error handling would be managed by parent component
      }
    }, [onVerifyEmail]);

    const getInitials = (name: string): string => {
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    return (
      <PageContainer
        ref={ref}
        title="Profile"
        description="Manage your account information and preferences"
        loading={loading}
        {...error && { error }}
        {...className && { className }}
        maxWidth="lg"
        padding="lg"
      >
        {/* Profile Header */}
        <SectionCard
          title=""
          css={{ marginBottom: theme.spacing[6] }}
        >
          <div css={profileHeaderStyles(theme)}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div css={avatarStyles(theme)}>
                {user.avatar ? (
                  <img src={user.avatar} alt={`${user.name}'s avatar`} />
                ) : (
                  getInitials(user.name)
                )}
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h2 css={nameStyles(theme)}>
                {user.name}
                <span css={verificationBadgeStyles(theme, user.isEmailVerified)}>
                  {user.isEmailVerified ? '✓ Verified' : '⏳ Unverified'}
                </span>
              </h2>
              <p css={emailStyles(theme)}>{user.email}</p>
              {user.bio && (
                <p css={{ color: theme.colors.text.secondary, margin: 0 }}>
                  {user.bio}
                </p>
              )}
            </div>
            
            <Button
              variant="primary"
              onClick={handleEditProfile}
              disabled={isEditing || isSaving}
            >
              {isEditing ? 'Editing...' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Completeness */}
          <div style={{ marginTop: theme.spacing[4] }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: theme.spacing[2]
            }}>
              <span style={{ 
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary 
              }}>
                Profile Completeness
              </span>
              <span style={{ 
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary 
              }}>
                {user.profileCompleteness}%
              </span>
            </div>
            <div css={progressBarStyles(theme, user.profileCompleteness)} />
          </div>
        </SectionCard>

        {/* Account Statistics */}
        <SectionCard
          title="Account Statistics"
          description="Overview of your activity and engagement"
          css={{ marginBottom: theme.spacing[6] }}
        >
          <div css={statsGridStyles(theme)}>
            <div css={statItemStyles(theme)}>
              <div css={statValueStyles(theme)}>{stats.totalTones}</div>
              <div css={statLabelStyles(theme)}>Total Tones</div>
            </div>
            <div css={statItemStyles(theme)}>
              <div css={statValueStyles(theme)}>{stats.favoriteTonesCount}</div>
              <div css={statLabelStyles(theme)}>Favorites</div>
            </div>
            <div css={statItemStyles(theme)}>
              <div css={statValueStyles(theme)}>{stats.totalGenerations.toLocaleString()}</div>
              <div css={statLabelStyles(theme)}>Generations</div>
            </div>
            <div css={statItemStyles(theme)}>
              <div css={statValueStyles(theme)}>{stats.averageRating.toFixed(1)}</div>
              <div css={statLabelStyles(theme)}>Avg Rating</div>
            </div>
            <div css={statItemStyles(theme)}>
              <div css={statValueStyles(theme)}>{stats.joinedDaysAgo}</div>
              <div css={statLabelStyles(theme)}>Days Active</div>
            </div>
          </div>
        </SectionCard>

        {/* Profile Edit Form */}
        {isEditing && (
          <SectionCard
            title="Edit Profile"
            description="Update your personal information"
            success={successMessage}
            loading={isSaving}
            actions={
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <ProfileEditForm 
                initialData={{ name: user.name, email: user.email, bio: user.bio || '' }}
                onProfileUpdateSuccess={(data) => {
                  void handleSaveProfile(data);
                }}
              />
              <Button variant="secondary" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </SectionCard>
        )}

        {/* Email Verification */}
        {!user.isEmailVerified && (
          <SectionCard
            title="Email Verification"
            description="Verify your email address to secure your account"
            warning="Your email address is not verified. Please check your inbox and click the verification link."
            actions={
              <Button
                variant="primary"
                onClick={handleVerifyEmail}
                size="sm"
              >
                Resend Verification
              </Button>
            }
          >
            <p style={{ 
              margin: 0,
              color: theme.colors.text.secondary,
              fontSize: theme.typography.fontSize.sm 
            }}>
              A verification email was sent to <strong>{user.email}</strong>. 
              If you don't see it, check your spam folder or click the button above to resend.
            </p>
          </SectionCard>
        )}
      </PageContainer>
    );
  }
);

ProfileScreen.displayName = 'ProfileScreen';