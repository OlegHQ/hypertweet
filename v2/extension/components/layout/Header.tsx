/**
 * Header component for application top navigation
 * Displays user profile, breadcrumbs, logout, and settings access
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import type { HeaderProps, BreadcrumbItem } from './types';

/**
 * Header container styles
 */
const headerStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 ${theme.spacing[6]};
  background-color: ${theme.colors.background.primary};
  border-bottom: 1px solid ${theme.colors.border.primary};
  position: sticky;
  top: 0;
  z-index: 100;
`;

/**
 * Breadcrumb navigation styles
 */
const breadcrumbStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  flex: 1;
  margin-right: ${theme.spacing[6]};
`;

/**
 * Breadcrumb item styles
 */
const breadcrumbItemStyles = (theme: ThemeType, current: boolean) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${current ? theme.colors.text.primary : theme.colors.text.secondary};
  text-decoration: none;

  &:hover {
    color: ${current
      ? theme.colors.text.primary
      : theme.colors.interactive.primary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/**
 * User section styles
 */
const userSectionStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
`;

/**
 * User profile display styles
 */
const userProfileStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }
`;

/**
 * Avatar styles
 */
const avatarStyles = (theme: ThemeType) => css`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${theme.colors.interactive.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.typography.fontWeight.medium};
  font-size: ${theme.typography.fontSize.sm};
`;

/**
 * User info styles
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const userInfoStyles = (_theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

/**
 * User name styles
 */
const userNameStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

/**
 * User email styles
 */
const userEmailStyles = (theme: ThemeType) => css`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.secondary};
  margin: 0;
`;

/**
 * Dropdown menu styles
 */
const dropdownMenuStyles = (theme: ThemeType) => css`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${theme.spacing[1]};
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.lg};
  z-index: 1000;
  min-width: 200px;
  padding: ${theme.spacing[1]};
`;

/**
 * Dropdown item styles
 */
const dropdownItemStyles = (theme: ThemeType) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.sm};
  cursor: pointer;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.primary};
  background: none;
  border: none;
  width: 100%;
  text-align: left;

  &:hover {
    background-color: ${theme.colors.background.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: -2px;
  }
`;

/**
 * Chevron down icon for breadcrumb separator
 */
const ChevronRightIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * Settings icon
 */
const SettingsIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
  </svg>
);

/**
 * Logout icon
 */
const LogoutIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/**
 * Breadcrumb navigation component
 */
const Breadcrumbs: React.FC<{
  readonly breadcrumbs: readonly BreadcrumbItem[];
}> = ({ breadcrumbs }) => {
  const _theme = defaultTheme;

  return (
    <nav css={breadcrumbStyles(_theme)} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRightIcon />}
          {item.path ? (
            <a
              href={item.path}
              css={breadcrumbItemStyles(_theme, item.current ?? false)}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </a>
          ) : (
            <span css={breadcrumbItemStyles(_theme, item.current ?? false)}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

/**
 * User menu dropdown component
 */
const UserMenu: React.FC<{
  readonly isOpen: boolean;
  readonly onSettingsClick?: () => void;
  readonly onLogout?: () => void;
  readonly onClose: () => void;
}> = ({ isOpen, onSettingsClick, onLogout, onClose }) => {
  const _theme = defaultTheme;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} css={dropdownMenuStyles(_theme)} role="menu">
      {onSettingsClick && (
        <button
          type="button"
          css={dropdownItemStyles(_theme)}
          onClick={onSettingsClick}
          role="menuitem"
        >
          <SettingsIcon />
          Settings
        </button>
      )}
      {onLogout && (
        <button
          type="button"
          css={dropdownItemStyles(_theme)}
          onClick={onLogout}
          role="menuitem"
        >
          <LogoutIcon />
          Logout
        </button>
      )}
    </div>
  );
};

/**
 * Get user initials for avatar display
 */
const getUserInitials = (name: string): string =>
  name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

/**
 * Header component with user profile, breadcrumbs, and actions
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      user,
      breadcrumbs,
      onLogout,
      onSettingsClick,
      className,
      showUserMenu = true,
    },
    ref
  ) => {
    const _theme = defaultTheme;
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleUserProfileClick = (): void => {
      if (showUserMenu) {
        setIsUserMenuOpen(!isUserMenuOpen);
      }
    };

    const handleUserMenuClose = (): void => {
      setIsUserMenuOpen(false);
    };

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>
    ): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleUserProfileClick();
      }
    };

    return (
      <header ref={ref} css={headerStyles(_theme)} className={className}>
        {/* Breadcrumb navigation */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs breadcrumbs={breadcrumbs} />
        )}

        {/* User section */}
        <div css={userSectionStyles(_theme)}>
          {user && (
            <div style={{ position: 'relative' }}>
              <div
                css={userProfileStyles(_theme)}
                onClick={handleUserProfileClick}
                onKeyDown={handleKeyDown}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label={`User menu for ${user.name}`}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name}'s avatar`}
                    css={avatarStyles(_theme)}
                  />
                ) : (
                  <div css={avatarStyles(_theme)}>
                    {getUserInitials(user.name)}
                  </div>
                )}

                <div css={userInfoStyles(_theme)}>
                  <h3 css={userNameStyles(_theme)}>{user.name}</h3>
                  <p css={userEmailStyles(_theme)}>{user.email}</p>
                </div>
              </div>

              {showUserMenu && (
                <UserMenu
                  isOpen={isUserMenuOpen}
                  {...(onSettingsClick && { onSettingsClick })}
                  {...(onLogout && { onLogout })}
                  onClose={handleUserMenuClose}
                />
              )}
            </div>
          )}
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';
