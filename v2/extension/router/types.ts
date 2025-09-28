/**
 * Defines the paths for the application routes.
 */
export const RoutePath = {
  Login: '/login',
  Register: '/register',
  Dashboard: '/',
  Tones: '/tones',
  ToneEditor: '/tones/:id',
  Account: '/account',
  Profile: '/account/profile',
  Security: '/account/security',
  Settings: '/account/settings',
  Billing: '/account/billing',
} as const;

/**
 * A union type of all possible route paths.
 */
export type AppRoute = (typeof RoutePath)[keyof typeof RoutePath];

/**
 * Props for a protected route.
 *
 * @property path - The path for the route.
 * @property element - The component to render for the route.
 */
export interface ProtectedRouteProps {
  readonly path: AppRoute;
  readonly element: React.ReactElement;
}
