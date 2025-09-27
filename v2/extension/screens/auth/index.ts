/**
 * Authentication screens exports
 * Provides clean exports for all authentication-related components and types
 */

// Layout Components
export { AuthLayout } from './AuthLayout';
export type { AuthLayoutProps } from './AuthLayout';

// Screen Components
export { LoginScreen } from './LoginScreen';
export type { LoginScreenProps, LoginFormData } from './LoginScreen';

export { RegisterScreen } from './RegisterScreen';
export type { RegisterScreenProps, RegisterFormData } from './RegisterScreen';

// Default exports for convenience
export { LoginScreen as Login } from './LoginScreen';
export { RegisterScreen as Register } from './RegisterScreen';
