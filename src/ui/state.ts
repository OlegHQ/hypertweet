import { create } from "zustand";
import type { Profile } from "../data";

interface ApiKey {
  type: string;
  value: string;
}

interface ProfileKeys {
  [keyType: string]: ApiKey;
}

interface PersonalityConfig {
  twitter: {
    data: any | null;
    isFetched: boolean;
  };
  linkedIn: {
    data: any | null;
    isFetched: boolean;
  };
}

interface GlobalState {
  profiles: Profile[];
  selectedProfile: Profile | null;
  profileKeys: { [profileId: string]: ProfileKeys } | null;
  areKeysFetched: boolean;
  personalityConfigs: { [profileId: string]: PersonalityConfig } | null;
  lastUsedProfileId: string | null;
  setProfiles: (profiles: Profile[]) => void;
  setSelectedProfile: (profile: Profile | null) => void;
  setLastUsedProfileId: (id: string | null) => void;
  setProfileKey: (profileId: string, keyType: string, value: string) => void;
  removeProfileKey: (profileId: string, keyType: string) => void;
  getProfileKey: (profileId: string, keyType: string) => ApiKey | undefined;
  hasProfileKey: (profileId: string, keyType: string) => boolean;
  setAreKeysFetched: (fetched: boolean) => void;
  setPersonalityConfig: (profileId: string, platform: 'twitter' | 'linkedIn', data: any | null) => void;
  getPersonalityConfig: (profileId: string, platform: 'twitter' | 'linkedIn') => PersonalityConfig['twitter'] | PersonalityConfig['linkedIn'] | undefined;
}

type SetState = (
  partial: Partial<GlobalState> | ((state: GlobalState) => Partial<GlobalState>)
) => void;
type GetState = () => GlobalState;

export const useGlobalState = create<GlobalState>(
  (set: SetState, get: GetState) => ({
    profiles: [],
    selectedProfile: null,
    profileKeys: null,
    areKeysFetched: false,
    personalityConfigs: null,
    lastUsedProfileId: null,

    setProfiles: (profiles: Profile[]) => set({ profiles }),

    setSelectedProfile: (profile: Profile | null) => {
      set({ selectedProfile: profile });
      if (profile) {
        set({ lastUsedProfileId: profile.id });
      }
    },

    setLastUsedProfileId: (id: string | null) => set({ lastUsedProfileId: id }),

    setAreKeysFetched: (fetched: boolean) => set({ areKeysFetched: fetched }),

    setProfileKey: (profileId: string, keyType: string, value: string) =>
      set((state: GlobalState) => ({
        profileKeys: {
          ...(state.profileKeys || {}),
          [profileId]: {
            ...(state.profileKeys?.[profileId] || {}),
            [keyType]: { type: keyType, value },
          },
        },
      })),

    removeProfileKey: (profileId: string, keyType: string) =>
      set((state: GlobalState) => {
        if (!state.profileKeys) return state;
        
        const newProfileKeys = { ...state.profileKeys };
        if (newProfileKeys[profileId]) {
          delete newProfileKeys[profileId][keyType];
          if (Object.keys(newProfileKeys[profileId]).length === 0) {
            delete newProfileKeys[profileId];
          }
        }
        return { profileKeys: newProfileKeys };
      }),

    getProfileKey: (profileId: string, keyType: string) =>
      get().profileKeys?.[profileId]?.[keyType],

    hasProfileKey: (profileId: string, keyType: string) =>
      Boolean(get().profileKeys?.[profileId]?.[keyType]),

    setPersonalityConfig: (profileId: string, platform: 'twitter' | 'linkedIn', data: any | null) =>
      set((state: GlobalState) => ({
        personalityConfigs: {
          ...(state.personalityConfigs || {}),
          [profileId]: {
            ...(state.personalityConfigs?.[profileId] || {
              twitter: { data: null, isFetched: false },
              linkedIn: { data: null, isFetched: false },
            }),
            [platform]: {
              data,
              isFetched: true,
            },
          },
        },
      })),

    getPersonalityConfig: (profileId: string, platform: 'twitter' | 'linkedIn') =>
      get().personalityConfigs?.[profileId]?.[platform],
  })
);
