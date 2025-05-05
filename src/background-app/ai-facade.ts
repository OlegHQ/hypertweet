import type { DataLayer, LinkedInProfile, XProfile } from "./data";
import { buildPersonalitySnippet, generateReply } from "./ai/context";
import { buildPersonaPayload } from "./ai/system-prompt-gen";

export function newAI(dataLayer: DataLayer) {
  return {
    async generateReply(profileId: string, postText: string, prompt: string) {
      const personaSnippet = await dataLayer.config.get<string>(
        profileId,
        "systemPrompt"
      );
      const openAiKey = await dataLayer.config.get<string>(
        profileId,
        "openAiKey"
      );
      if (!openAiKey) {
        throw new Error("Missing required config");
      }
      return await generateReply(openAiKey, personaSnippet, prompt, postText);
    },
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
