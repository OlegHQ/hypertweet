import { create } from "zustand";

export type SiteType = "twitter" | "linkedin" | "debugging";

interface SiteTypeState {
  siteType: SiteType;
  setSiteType: (type: SiteType) => void;
  parent: HTMLElement | null;
  setParent: (parent: HTMLElement | null) => void;
}

export const useSiteTypeStore = create<SiteTypeState>((set) => ({
  siteType: "twitter", // Default content type
  setSiteType: (type) => set({ siteType: type }),
  parent: null,
  setParent: (parent: HTMLElement | null) => set({ parent }),
}));
