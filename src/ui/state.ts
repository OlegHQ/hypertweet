import { create } from "zustand";
import type { Profile } from "../data";

interface GlobalState {
  profiles: Profile[];
  selectedProfile: Profile | null;
  loadedKeys: Set<string>;
  lastUsedProfileId: string | null;
  setProfiles: (profiles: Profile[]) => void;
  setSelectedProfile: (profile: Profile | null) => void;
  setLastUsedProfileId: (id: string | null) => void;
  addLoadedKey: (key: string) => void;
  removeLoadedKey: (key: string) => void;
  isKeyLoaded: (key: string) => boolean;
}

type SetState = (
  partial: Partial<GlobalState> | ((state: GlobalState) => Partial<GlobalState>)
) => void;
type GetState = () => GlobalState;

export const useGlobalState = create<GlobalState>(
  (set: SetState, get: GetState) => ({
    profiles: [],
    selectedProfile: null,
    loadedKeys: new Set<string>(),
    lastUsedProfileId: null,

    setProfiles: (profiles: Profile[]) => set({ profiles }),

    setSelectedProfile: (profile: Profile | null) => {
      set({ selectedProfile: profile });
      if (profile) {
        set({ lastUsedProfileId: profile.id });
      }
    },

    setLastUsedProfileId: (id: string | null) => set({ lastUsedProfileId: id }),

    addLoadedKey: (key: string) =>
      set((state: GlobalState) => ({
        loadedKeys: new Set([...state.loadedKeys, key]),
      })),

    removeLoadedKey: (key: string) =>
      set((state: GlobalState) => {
        const newKeys = new Set(state.loadedKeys);
        newKeys.delete(key);
        return { loadedKeys: newKeys };
      }),

    isKeyLoaded: (key: string) => get().loadedKeys.has(key),
  })
);
