/**
 * Layout component types and interfaces
 * Provides TypeScript definitions for all layout components
 */

import type React from 'react';

/**
 * Navigation menu item definition
 */
export interface NavigationItem {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly icon?: React.ReactElement;
  readonly badge?: string | number;
  readonly disabled?: boolean;
  readonly children?: readonly NavigationItem[];
}

/**
 * User profile information for header display
 */
export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string;
  readonly isVerified?: boolean;
}

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
  readonly label: string;
  readonly path?: string;
  readonly current?: boolean;
}

/**
 * Loading state for page content
 */
export type LoadingState = 'idle' | 'loading' | 'error' | 'success';

/**
 * Error information for display
 */
export interface LayoutError {
  readonly message: string;
  readonly code?: string;
  readonly retry?: () => void;
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly width?: 'narrow' | 'normal' | 'wide';
  readonly collapsed?: boolean;
  readonly onToggleCollapse?: () => void;
}

/**
 * Header component props
 */
export interface HeaderProps {
  readonly user?: UserProfile;
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly onLogout?: () => void;
  readonly onSettingsClick?: () => void;
  readonly className?: string;
  readonly showUserMenu?: boolean;
}

/**
 * Navigation component props
 */
export interface NavigationProps {
  readonly items: readonly NavigationItem[];
  readonly currentPath: string;
  readonly collapsed?: boolean;
  readonly onItemClick?: (item: NavigationItem) => void;
  readonly className?: string;
}

/**
 * Page container component props
 */
export interface PageContainerProps {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly loading?: LoadingState;
  readonly error?: LayoutError;
  readonly className?: string;
  readonly maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  readonly padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Layout theme configuration
 */
export interface LayoutTheme {
  readonly sidebar: {
    readonly width: {
      readonly narrow: string;
      readonly normal: string;
      readonly wide: string;
    };
    readonly backgroundColor: string;
    readonly borderColor: string;
  };
  readonly header: {
    readonly height: string;
    readonly backgroundColor: string;
    readonly borderColor: string;
  };
  readonly navigation: {
    readonly itemHeight: string;
    readonly activeColor: string;
    readonly hoverColor: string;
  };
}

/**
 * Default navigation items for the application
 */
export const defaultNavigationItems: readonly NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    id: 'tones',
    label: 'Tones',
    path: '/tones',
  },
  {
    id: 'account',
    label: 'Account',
    path: '/account',
    children: [
      {
        id: 'profile',
        label: 'Profile',
        path: '/account/profile',
      },
      {
        id: 'security',
        label: 'Security',
        path: '/account/security',
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
  },
] as const;

/**
 * Default layout theme
 */
export const defaultLayoutTheme: LayoutTheme = {
  sidebar: {
    width: {
      narrow: '64px',
      normal: '240px',
      wide: '320px',
    },
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  navigation: {
    itemHeight: '44px',
    activeColor: '#3b82f6',
    hoverColor: '#f3f4f6',
  },
} as const;
