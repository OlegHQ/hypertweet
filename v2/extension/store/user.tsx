
import React, { createContext, useReducer, useMemo, useContext } from 'react';
import { UserAPI } from '@/api/user';
import { AuthAPI } from '@/api/auth';
import type { User } from '@/models';
import type { UserProfile, UserSettings, ChangePasswordRequest, UsageStats } from '@/api/types';
import type { UserAction, UserContextType, UserState } from './types/user';

const initialState: UserState = {
  profile: null,
  settings: null,
  usageStats: null,
  loading: false,
  error: null,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'FETCH_USER_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_USER_SUCCESS':
      return {
        ...state,
        loading: false,
        profile: action.payload.profile,
        settings: action.payload.settings,
        usageStats: action.payload.usageStats,
      };
    case 'FETCH_USER_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_PROFILE_SUCCESS':
      return { ...state, profile: { ...state.profile, ...action.payload } as User };
    case 'UPDATE_SETTINGS_SUCCESS':
      return { ...state, settings: action.payload };
    default:
      return state;
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userState, dispatch] = useReducer(userReducer, initialState);

  const fetchUserData = async () => {
    dispatch({ type: 'FETCH_USER_START' });
    try {
      const profileRes = await AuthAPI.getUserProfile();
      const settingsRes = await UserAPI.updateSettings({}); // Fetch settings
      const usageStatsRes = await UserAPI.getUsageStats();

      if (profileRes && settingsRes.success && usageStatsRes.success) {
        dispatch({
          type: 'FETCH_USER_SUCCESS',
          payload: {
            profile: profileRes,
            settings: settingsRes.data as UserSettings,
            usageStats: usageStatsRes.data as UsageStats,
          },
        });
      } else {
        dispatch({ type: 'FETCH_USER_FAILURE', payload: 'Failed to fetch user data' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      dispatch({ type: 'FETCH_USER_FAILURE', payload: message });
    }
  };

  const updateProfile = async (profile: UserProfile) => {
    try {
      const response = await UserAPI.updateProfile(profile);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_PROFILE_SUCCESS', payload: response.data });
      }
    } catch (error) {
      // Handle error
    }
  };

  const updateSettings = async (settings: UserSettings) => {
    try {
      const response = await UserAPI.updateSettings(settings);
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_SETTINGS_SUCCESS', payload: response.data });
      }
    } catch (error) {
      // Handle error
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    const data: ChangePasswordRequest = { oldPassword, newPassword };
    await UserAPI.changePassword(data);
  };

  const deleteAccount = async () => {
    await UserAPI.deleteAccount();
  };

  const exportData = async () => {
    const response = await UserAPI.exportData();
    if (response.success) {
      return response.data;
    }
  };

  const contextValue = useMemo(
    () => ({ userState, fetchUserData, updateProfile, updateSettings, changePassword, deleteAccount, exportData }),
    [userState]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
