/**
 * Navigation component with menu items, active state highlighting, and accessibility
 * Supports hierarchical navigation with collapsible sections
 */

import React, { forwardRef, useState, useCallback } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import type { NavigationProps, NavigationItem } from './types';

/**
 * Navigation container styles
 */
 
const navigationStyles = (_theme: ThemeType) => css`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

/**
 * Navigation item styles
 */
const getNavigationItemStyles = (
  theme: ThemeType,
  isActive: boolean,
  isDisabled: boolean,
  depth: number,
  collapsed: boolean
) => css`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  padding-left: ${collapsed
    ? theme.spacing[4]
    : `calc(${theme.spacing[4]} + ${depth * 16}px)`};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[1]};
  cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: ${isActive
    ? theme.colors.interactive.primary
    : isDisabled
      ? theme.colors.text.tertiary
      : theme.colors.text.secondary};
  background-color: ${isActive
    ? theme.colors.background.secondary
    : 'transparent'};
  border: 1px solid ${isActive ? theme.colors.border.focus : 'transparent'};

  &:hover {
    background-color: ${isDisabled
      ? 'transparent'
      : isActive
        ? theme.colors.background.secondary
        : theme.colors.background.secondary};
    color: ${isDisabled
      ? theme.colors.text.tertiary
      : isActive
        ? theme.colors.interactive.primary
        : theme.colors.text.primary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: -2px;
  }

  &[aria-disabled='true'] {
    opacity: 0.6;
  }
`;

/**
 * Navigation icon styles
 */
 
const navigationIconStyles = (_theme: ThemeType, _collapsed: boolean) => css`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
  }
`;

/**
 * Navigation label styles
 */
const navigationLabelStyles = (theme: ThemeType, collapsed: boolean) => css`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  display: ${collapsed ? 'none' : 'block'};
  flex: 1;
  text-align: left;
`;

/**
 * Navigation badge styles
 */
const navigationBadgeStyles = (theme: ThemeType, collapsed: boolean) => css`
  display: ${collapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 ${theme.spacing[1]};
  background-color: ${theme.colors.interactive.primary};
  color: white;
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.medium};
  border-radius: ${theme.borderRadius.full};
`;

/**
 * Collapse toggle button styles
 */
const collapseToggleStyles = (theme: ThemeType, _collapsed: boolean) => css`
  margin-left: auto;
  padding: ${theme.spacing[1]};
  background: none;
  border: none;
  cursor: pointer;
  display: ${_collapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.sm};
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: -2px;
  }

  svg {
    width: 12px;
    height: 12px;
    transition: transform 0.2s ease-in-out;
    transform: ${_collapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
  }
`;

/**
 * Submenu container styles
 */
const submenuStyles = (_theme: ThemeType, isOpen: boolean) => css`
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
  max-height: ${isOpen ? '500px' : '0'};
`;

/**
 * Default dashboard icon
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
 * Default settings icon
 */
const SettingsIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
  </svg>
);

/**
 * Default user icon
 */
const UserIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/**
 * Default tones icon
 */
const TonesIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 12l2 2 4-4" />
    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
  </svg>
);

/**
 * Chevron down icon for expandable items
 */
const ChevronDownIcon: React.FC<{ readonly isOpen: boolean }> = ({
  isOpen,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/**
 * Get default icon for navigation item based on ID
 */
const getDefaultIcon = (itemId: string): React.ReactElement => {
  switch (itemId) {
    case 'dashboard':
      return <DashboardIcon />;
    case 'tones':
      return <TonesIcon />;
    case 'account':
    case 'profile':
      return <UserIcon />;
    case 'settings':
    case 'security':
      return <SettingsIcon />;
    default:
      return <DashboardIcon />;
  }
};

/**
 * Navigation item component with support for nesting and expansion
 */
const NavigationItemComponent: React.FC<{
  readonly item: NavigationItem;
  readonly currentPath: string;
  readonly collapsed: boolean;
  readonly depth: number;
  readonly onItemClick?: (item: NavigationItem) => void;
}> = ({ item, currentPath, collapsed, depth, onItemClick }) => {
  const _theme = defaultTheme;
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = currentPath === item.path;
  const hasChildren = item.children && item.children.length > 0;
  const isDisabled = item.disabled ?? false;

  const handleClick = useCallback(
    (event: React.MouseEvent | React.KeyboardEvent): void => {
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      if (hasChildren) {
        event.preventDefault();
        setIsExpanded(!isExpanded);
      } else {
        onItemClick?.(item);
      }
    },
    [isDisabled, hasChildren, isExpanded, item, onItemClick]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick(event);
      }
    },
    [handleClick]
  );

  const ItemContent = (
    <>
      <div css={navigationIconStyles(_theme, collapsed)}>
        {item.icon ?? getDefaultIcon(item.id)}
      </div>

      <span css={navigationLabelStyles(_theme, collapsed)}>{item.label}</span>

      {item.badge && (
        <div css={navigationBadgeStyles(_theme, collapsed)}>{item.badge}</div>
      )}

      {hasChildren && !collapsed && (
        <button
          type="button"
          css={collapseToggleStyles(_theme, collapsed)}
          onClick={(e): void => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          aria-label={
            isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`
          }
          aria-expanded={isExpanded}
        >
          <ChevronDownIcon isOpen={isExpanded} />
        </button>
      )}
    </>
  );

  return (
    <>
      {hasChildren ? (
        <div
          css={getNavigationItemStyles(
            _theme,
            isActive,
            isDisabled,
            depth,
            collapsed
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          aria-disabled={isDisabled}
          aria-expanded={isExpanded}
          aria-label={`${item.label} menu`}
        >
          {ItemContent}
        </div>
      ) : (
        <a
          href={item.path}
          css={getNavigationItemStyles(
            _theme,
            isActive,
            isDisabled,
            depth,
            collapsed
          )}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-current={isActive ? 'page' : undefined}
          aria-disabled={isDisabled}
        >
          {ItemContent}
        </a>
      )}

      {hasChildren && !collapsed && (
        <div css={submenuStyles(_theme, isExpanded)}>
          {item.children?.map(child => (
            <NavigationItemComponent
              key={child.id}
              item={child}
              currentPath={currentPath}
              collapsed={collapsed}
              depth={depth + 1}
              {...(onItemClick && { onItemClick })}
            />
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Navigation component with hierarchical menu support and accessibility
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(
  ({ items, currentPath, collapsed = false, onItemClick, className }, ref) => {
    const _theme = defaultTheme;

    return (
      <nav
        ref={ref}
        css={navigationStyles(_theme)}
        className={className}
        role="navigation"
        aria-label="Main navigation"
      >
        {items.map(item => (
          <NavigationItemComponent
            key={item.id}
            item={item}
            currentPath={currentPath}
            collapsed={collapsed}
            depth={0}
            {...(onItemClick && { onItemClick })}
          />
        ))}
      </nav>
    );
  }
);

Navigation.displayName = 'Navigation';
