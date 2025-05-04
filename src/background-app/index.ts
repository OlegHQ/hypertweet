import { buildPersonaPayload } from "../ai/system-prompt-gen";
import { createDataLayer } from "../data";
import { ScrapingContext } from "../scraping/context";
import type { XProfile, LinkedInProfile } from "../data";
export async function setupBackgroundApp() {
  const dataLayer = await createDataLayer();
  let cnt = 0;
  return {
    dataLayer,
    scraping: new ScrapingContext(),
    ai: {
      buildPersonaPayload: async (
        twitter: XProfile,
        linkedin: LinkedInProfile
      ) => {
        return buildPersonaPayload(twitter, linkedin);
      },
    },
    testStuff: async () => {
      return ++cnt;
    },
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
