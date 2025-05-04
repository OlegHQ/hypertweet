import type { DataLayer, LinkedInProfile, XProfile } from "../data";
import { buildPersonalitySnippet } from "../ai/context";
import { buildPersonaPayload } from "../ai/system-prompt-gen";

export function newAI(dataLayer: DataLayer) {
  return {
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
  };
}
