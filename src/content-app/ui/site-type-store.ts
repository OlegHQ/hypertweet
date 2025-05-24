import { create } from "zustand";

export type SiteType = "twitter" | "linkedin" | "debugging";

interface SiteTypeState {
  siteType: SiteType;
  setSiteType: (type: SiteType) => void;
  mode: "simple" | "complex" | "edit";
  setMode: (mode: "simple" | "complex" | "edit") => void;
  parent: HTMLElement | null;
  setParent: (parent: HTMLElement | null) => void;
  editedText: string | null;
  setEditedText: (text: string | null) => void;
}

export const useSiteTypeStore = create<SiteTypeState>((set) => ({
  siteType: "twitter", // Default content type
  setSiteType: (type) => set({ siteType: type }),
  mode: "simple",
  setMode: (mode) => set({ mode }),
  parent: null,
  setParent: (parent: HTMLElement | null) => set({ parent }),
  editedText: null,
  setEditedText: (text: string | null) => set({ editedText: text }),
}));
