/**
 * Layout components exports
 * Provides clean imports for all layout components and types
 */

// Component exports
export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { Navigation } from './Navigation';
export { PageContainer } from './PageContainer';

// Type exports
export type {
  NavigationItem,
  UserProfile,
  BreadcrumbItem,
  LoadingState,
  LayoutError,
  SidebarProps,
  HeaderProps,
  NavigationProps,
  PageContainerProps,
  LayoutTheme,
} from './types';

// Default values and constants
export { defaultNavigationItems, defaultLayoutTheme } from './types';
