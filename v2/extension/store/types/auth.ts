/**
 * Authentication state types for React context management
 * Builds on top of Task A1 auth types and Task A2 API operations
 */

import type { User, AuthError } from '../../auth/types.js';

/**
 * Authentication loading states for UI feedback
 */
export type AuthLoadingState = 
  | 'idle'
  | 'authenticating'
  | 'refreshing'
  | 'logging-out'
  | 'registering';

/**
 * Core authentication state managed by React context
 */
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: User | null;
  readonly token: string | null;
  readonly loading: AuthLoadingState;
  readonly error: AuthError | null;
  readonly isInitialized: boolean;
}

/**
 * Authentication actions available through context
 */
export interface AuthActions {
  readonly login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  readonly register: (email: string, password: string, name: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly refreshToken: () => Promise<void>;
  readonly clearError: () => void;
  readonly updateUser: (user: Partial<User>) => void;
}

/**
 * Complete authentication context interface
 */
export interface AuthContextType extends AuthState, AuthActions {}

/**
 * Props for AuthProvider component
 */
export interface AuthProviderProps {
  readonly children: React.ReactNode;
  readonly enableAutoRefresh?: boolean;
  readonly refreshInterval?: number;
}

/**
 * Auth hook return type for useAuth
 */
export interface UseAuthReturn extends AuthContextType {
  readonly isLoading: boolean;
  readonly hasError: boolean;
  readonly canRefresh: boolean;
}

/**
 * Token refresh configuration
 */
export interface TokenRefreshConfig {
  readonly enabled: boolean;
  readonly intervalMs: number;
  readonly refreshThresholdMs: number;
}

/**
 * Auth provider configuration options
 */
export interface AuthConfig {
  readonly autoLogin: boolean;
  readonly tokenRefresh: TokenRefreshConfig;
  readonly persistUser: boolean;
  readonly enableDeviceTracking: boolean;
}

/**
 * Default authentication configuration
 */
export const defaultAuthConfig: AuthConfig = {
  autoLogin: true,
  tokenRefresh: {
    enabled: true,
    intervalMs: 15 * 60 * 1000, // 15 minutes
    refreshThresholdMs: 5 * 60 * 1000, // 5 minutes before expiry
  },
  persistUser: true,
  enableDeviceTracking: false,
} as const;

/**
 * Initial authentication state
 */
export const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: 'idle',
  error: null,
  isInitialized: false,
} as const;