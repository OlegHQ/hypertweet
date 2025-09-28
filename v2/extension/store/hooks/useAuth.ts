import { useContext } from 'react';
import AuthContext from '../auth';
import type { AuthContextType } from '../types/auth';

/**
 * Custom hook to access the authentication context.
 *
 * @returns The authentication context, providing access to the auth state and actions.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
