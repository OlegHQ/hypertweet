import type { User } from '@/models';

/**
 * Represents the authentication state of the application.
 *
 * @property isAuthenticated - True if the user is authenticated, false otherwise.
 * @property user - The authenticated user's profile information, or null if not authenticated.
 * @property token - The JWT authentication token, or null if not authenticated.
 * @property loading - True if an authentication operation is in progress, false otherwise.
 * @property error - An error message if an authentication operation failed, or null otherwise.
 */
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: User | null;
  readonly token: string | null;
  readonly loading: boolean;
  readonly error: string | null;
}

/**
 * Represents the actions that can be dispatched to the authentication reducer.
 */
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

/**
 * Represents the shape of the authentication context.
 *
 * @property authState - The current authentication state.
 * @property login - A function to log in a user.
 * @property logout - A function to log out the current user.
 * @property register - A function to register a new user.
 * @property clearError - A function to clear the authentication error.
 */
export interface AuthContextType {
  readonly authState: AuthState;
  readonly login: (email: string, pass: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly register: (email: string, pass: string) => Promise<void>;
  readonly clearError: () => void;
}
