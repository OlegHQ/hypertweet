import { create } from "zustand";

export type SiteType = "twitter" | "linkedin" | "reddit" | "debugging";

interface SiteTypeState {
  siteType: SiteType;
  setSiteType: (type: SiteType) => void;
  mode: "simple" | "complex" | "edit" | null;
  setMode: (mode: "simple" | "complex" | "edit" | null) => void;
  parent: HTMLElement | null;
  setParent: (parent: HTMLElement | null) => void;
  editedText: string | null;
  setEditedText: (text: string | null) => void;
}

export const useSiteTypeStore = create<SiteTypeState>((set) => ({
  siteType: "twitter", // Default content type
  setSiteType: (type) => set({ siteType: type }),
  mode: null,
  setMode: (mode) => set({ mode }),
  parent: null,
  setParent: (parent: HTMLElement | null) => set({ parent }),
  editedText: null,
  setEditedText: (text: string | null) => set({ editedText: text }),
}));
