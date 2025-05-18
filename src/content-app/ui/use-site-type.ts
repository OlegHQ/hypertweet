import { useSiteTypeStore } from "./site-type-store";

export function useSiteType() {
  return useSiteTypeStore((state) => state.siteType);
}
