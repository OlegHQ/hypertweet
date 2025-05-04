import { buildPersonaPayload } from "../ai/system-prompt-gen";
import { createDataLayer } from "../data";
import { ScrapingContext } from "../scraping/context";
import type { XProfile, LinkedInProfile } from "../data";
import { buildPersonalitySnippet } from "../ai/context";
export async function setupBackgroundApp() {
  const dataLayer = await createDataLayer();
  let cnt = 0;
  return {
    dataLayer,
    scraping: new ScrapingContext(),
    ai: {
      buildPersonaPayload: async (profileId: string) => {
        const twitterConfig = await dataLayer.config.get<XProfile>(
          profileId,
          "twitterProfile"
        );
        const linkedInConfig = await dataLayer.config.get<LinkedInProfile>(
          profileId,
          "linkedInProfile"
        );
        const openAiKey = await dataLayer.config.get<string>(
          profileId,
          "openAiKey"
        );

        console.log("twitterConfig", {
          twitterConfig,
          linkedInConfig,
          openAiKey,
        });
        if (!twitterConfig || !linkedInConfig || !openAiKey) {
          throw new Error("Missing required config");
        }

        const payload = buildPersonaPayload(twitterConfig, linkedInConfig);
        const personalitySnippet = await buildPersonalitySnippet(
          openAiKey,
          payload
        );

        return personalitySnippet;
      },
    },
    testStuff: async () => {
      return ++cnt;
    },
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
