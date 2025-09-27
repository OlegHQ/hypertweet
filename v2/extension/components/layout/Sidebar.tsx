/**
 * Sidebar component for Chrome extension layout
 * Main container with responsive width handling and proper scrolling
 */

import React, { forwardRef } from 'react';
import { css } from '@emotion/react';
import { defaultTheme, type ThemeType } from '../../styles/theme';
import type { SidebarProps } from './types';

/**
 * Main sidebar container styles
 */
const getSidebarStyles = (
  theme: ThemeType,
  width: SidebarProps['width'],
  collapsed: boolean
) => css`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${theme.colors.background.primary};
  border-right: 1px solid ${theme.colors.border.primary};
  transition: width 0.2s ease-in-out;
  overflow: hidden;

  width: ${collapsed
    ? '64px'
    : width === 'narrow'
      ? '200px'
      : width === 'wide'
        ? '320px'
        : '240px'};

  min-width: ${collapsed ? '64px' : '200px'};
  max-width: ${width === 'wide' ? '320px' : '280px'};

  /* Chrome extension specific sizing */
  @media (max-width: 768px) {
    width: ${collapsed ? '64px' : '200px'};
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    box-shadow: ${collapsed ? 'none' : theme.shadows.lg};
  }

  /* Ensure proper scrolling behavior */
  & > * {
    flex-shrink: 0;
  }
`;

/**
 * Sidebar content wrapper styles
 */
const sidebarContentStyles = (theme: ThemeType) => css`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${theme.spacing[4]};

  /* Custom scrollbar styling */
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
 * Collapse toggle button styles
 */
const collapseButtonStyles = (theme: ThemeType) => css`
  position: absolute;
  top: 16px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.primary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: ${theme.colors.background.secondary};
    border-color: ${theme.colors.border.secondary};
  }

  &:focus {
    outline: 2px solid ${theme.colors.interactive.primary};
    outline-offset: 2px;
  }

  svg {
    width: 12px;
    height: 12px;
    color: ${theme.colors.text.secondary};
    transition: transform 0.2s ease-in-out;
  }
`;

/**
 * Chevron icon component for collapse toggle
 */
const ChevronIcon: React.FC<{ readonly collapsed: boolean }> = ({
  collapsed,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/**
 * Sidebar component with proper Chrome extension sizing and responsive behavior
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      children,
      className,
      width = 'normal',
      collapsed = false,
      onToggleCollapse,
    },
    ref
  ) => {
    const _theme = defaultTheme;

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLButtonElement>
    ): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggleCollapse?.();
      }
    };

    return (
      <aside
        ref={ref}
        css={getSidebarStyles(_theme, width, collapsed)}
        className={className}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        {/* Collapse toggle button */}
        {onToggleCollapse && (
          <button
            type="button"
            css={collapseButtonStyles(_theme)}
            onClick={onToggleCollapse}
            onKeyDown={handleKeyDown}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        )}

        {/* Main content area */}
        <div css={sidebarContentStyles(_theme)}>{children}</div>
      </aside>
    );
  }
);

Sidebar.displayName = 'Sidebar';
