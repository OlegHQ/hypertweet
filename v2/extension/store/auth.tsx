
import React, { createContext, useReducer, useEffect, useMemo } from 'react';
import { AuthAPI } from '@/api/auth';
import { AuthStorage } from '@/auth/storage';
import type { User } from '@/models';
import type { AuthAction, AuthContextType, AuthState } from './types/auth';

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const authStatus = await AuthAPI.getAuthStatus();
        if (authStatus.isAuthenticated && authStatus.user) {
          const token = await AuthStorage.getAuthToken();
          if (token) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: authStatus.user, token: token.token },
            });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Failed to verify authentication' });
      }
    };
    void checkAuthentication();
  }, []);

  const login = async (email: string, pass: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { token, user } = await AuthAPI.login(email, pass);
      if (token && user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed: No token or user returned' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (email: string, pass: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      await AuthAPI.register(email, pass);
      // After registration, log the user in
      const { token, user } = await AuthAPI.login(email, pass);
      if (token && user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed after registration: No token or user returned' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if server logout fails, we log out on the client
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue = useMemo(
    () => ({ authState, login, logout, register, clearError }),
    [authState]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;
