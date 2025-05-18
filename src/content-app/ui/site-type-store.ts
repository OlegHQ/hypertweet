import { create } from "zustand";

type SiteType = "twitter" | "linkedin";

interface SiteTypeState {
  siteType: SiteType;
  setSiteType: (type: SiteType) => void;
  parent: HTMLElement | null;
  setParent: (parent: HTMLElement) => void;
}

export const useSiteTypeStore = create<SiteTypeState>((set) => ({
  siteType: "twitter", // Default content type
  setSiteType: (type) => set({ siteType: type }),
  parent: null,
  setParent: (parent) => set({ parent }),
}));
