import { create } from "zustand";
import type { Profile, ReplyType } from "../background-app/domain";

export type Route =
  | "/"
  | "/knowledge-base"
  | "/reply-types"
  | "/reply-types/edit/:id"
  | "/misc"
  | "/data-backup"
  | "/chatgpt-prompts"
  | "/posts-studio"
  | "/request-logs";

interface ApiKey {
  id: string;
  key: string;
  name: string;
  platform: "openai" | "anthropic";
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
  profiles: Profile[] | null;
  selectedProfile: Profile | null;
  personalityConfigs: { [profileId: string]: PersonalityConfig } | null;
  lastUsedProfileId: string | null;
  currentRoute: Route;
  replyTypes: { [profileId: string]: ReplyType[] } | null;
  setProfiles: (profiles: Profile[]) => void;
  setSelectedProfile: (profile: Profile | null) => void;
  setLastUsedProfileId: (id: string | null) => void;
  setPersonalityConfig: (
    profileId: string,
    platform: "twitter" | "linkedIn",
    data: any | null
  ) => void;
  getPersonalityConfig: (
    profileId: string,
    platform: "twitter" | "linkedIn"
  ) => PersonalityConfig["twitter"] | PersonalityConfig["linkedIn"] | undefined;
  setCurrentRoute: (route: string) => void;
  setReplyTypes: (profileId: string, replyTypes: ReplyType[]) => void;
  getReplyTypes: (profileId: string) => ReplyType[] | undefined;

  profileKeys: { [profileId: string]: ProfileKeys } | null;
  areKeysFetched: boolean;
  setProfileKey: (profileId: string, keyType: string, value: string) => void;
  removeProfileKey: (profileId: string, keyType: string) => void;
  getProfileKey: (profileId: string, keyType: string) => ApiKey | undefined;
  hasProfileKey: (profileId: string, keyType: string) => boolean;
  setAreKeysFetched: (fetched: boolean) => void;
}

export const useGlobalState = create<GlobalState>((set, get) => ({
  profiles: [],
  selectedProfile: null,
  profileKeys: null,
  areKeysFetched: false,
  personalityConfigs: null,
  lastUsedProfileId: null,
  currentRoute: "/",
  replyTypes: null,

  setAreKeysFetched: (fetched: boolean) => set({ areKeysFetched: fetched }),

  setProfileKey: (profileId: string, keyType: string, value: string) =>
    set((state: GlobalState) => ({
      profileKeys: {
        ...(state.profileKeys || {}),
        [profileId]: {
          ...(state.profileKeys?.[profileId] || {}),
          [keyType]: {
            id: keyType,
            key: value,
            name: keyType,
            platform: "openai",
          },
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

  setProfiles: (profiles: Profile[]) => set({ profiles }),
  setSelectedProfile: (profile: Profile | null) =>
    set({ selectedProfile: profile }),
  setLastUsedProfileId: (id: string | null) => set({ lastUsedProfileId: id }),
  setPersonalityConfig: (
    profileId: string,
    platform: "twitter" | "linkedIn",
    data: any | null
  ) => {
    const currentConfigs = get().personalityConfigs || {};
    const profileConfig = currentConfigs[profileId] || {
      twitter: { data: null, isFetched: false },
      linkedIn: { data: null, isFetched: false },
    };
    profileConfig[platform] = { data, isFetched: true };
    set({
      personalityConfigs: { ...currentConfigs, [profileId]: profileConfig },
    });
  },
  getPersonalityConfig: (profileId: string, platform: "twitter" | "linkedIn") =>
    get().personalityConfigs?.[profileId]?.[platform],
  setCurrentRoute: (route: string) => set({ currentRoute: route as Route }),
  setReplyTypes: (profileId: string, replyTypes: ReplyType[]) =>
    set((state: GlobalState) => ({
      replyTypes: {
        ...(state.replyTypes || {}),
        [profileId]: replyTypes,
      },
    })),
  getReplyTypes: (profileId: string) => get().replyTypes?.[profileId],
}));
