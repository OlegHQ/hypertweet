import { create } from "zustand";
import type { Profile } from "../data";

interface GlobalState {
  profiles: Profile[] | null;
  selectedProfile: Profile | null;
  loadedKeys: Set<string>;
  setProfiles: (profiles: Profile[]) => void;
  setSelectedProfile: (profile: Profile | null) => void;
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
    profiles: null,
    selectedProfile: null,
    loadedKeys: new Set<string>(),

    setProfiles: (profiles: Profile[]) => set({ profiles }),

    setSelectedProfile: (profile: Profile | null) =>
      set({ selectedProfile: profile }),

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
