import type { User } from '@/models';
import type { UserProfile, UserSettings, UsageStats } from '@/api/types';

export interface UserState {
  readonly profile: User | null;
  readonly settings: UserSettings | null;
  readonly usageStats: UsageStats | null;
  readonly loading: boolean;
  readonly error: string | null;
}

export type UserAction =
  | { type: 'FETCH_USER_START' }
  | {
      type: 'FETCH_USER_SUCCESS';
      payload: {
        profile: User;
        settings: UserSettings;
        usageStats: UsageStats;
      };
    }
  | { type: 'FETCH_USER_FAILURE'; payload: string }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: UserProfile }
  | { type: 'UPDATE_SETTINGS_SUCCESS'; payload: UserSettings };

export interface UserContextType {
  readonly userState: UserState;
  readonly updateProfile: (profile: UserProfile) => Promise<void>;
  readonly updateSettings: (settings: UserSettings) => Promise<void>;
  readonly changePassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<void>;
  readonly deleteAccount: () => Promise<void>;
  readonly exportData: () => Promise<string | undefined>;
}
