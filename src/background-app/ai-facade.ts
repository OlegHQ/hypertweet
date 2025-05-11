import {
  ConfigTypeKey,
  type DataLayer,
  type LinkedInProfile,
  type XProfile,
} from "./data";
import { buildPersonalitySnippet, generateReply } from "./ai/context";
import { buildPersonaPayload } from "./ai/system-prompt-gen";
import { defaultModel, ModelType } from "./ai/model-type";

async function getModel(dataLayer: DataLayer, profileId: string) {
  return ((await dataLayer.config.get<string>(
    profileId,
    ConfigTypeKey.COMPLETION_MODEL
  )) ?? defaultModel) as ModelType;
}

export function newAI(dataLayer: DataLayer) {
  return {
    async generateReply(profileId: string, postText: string, prompt: string) {
      const model = await getModel(dataLayer, profileId);
      const personaSnippet = await dataLayer.config.get<string>(
        profileId,
        ConfigTypeKey.SYSTEM_PROMPT
      );
      const openAiKey = await dataLayer.config.getCredential(
        profileId,
        ConfigTypeKey.OPENAI_API_KEY
      );
      if (!openAiKey) {
        throw new Error("Missing required config");
      }
      return await generateReply(
        openAiKey,
        model,
        personaSnippet,
        prompt,
        postText
      );
    },
    buildPersonaPayload: async (profileId: string) => {
      const twitterConfig = await dataLayer.config.get<XProfile>(
        profileId,
        ConfigTypeKey.TWITTER_PROFILE
      );
      const linkedInConfig = await dataLayer.config.get<LinkedInProfile>(
        profileId,
        ConfigTypeKey.LINKEDIN_PROFILE
      );
      const openAiKey = await dataLayer.config.getCredential(
        profileId,
        ConfigTypeKey.OPENAI_API_KEY
      );

      if (!twitterConfig || !linkedInConfig || !openAiKey) {
        throw new Error("Missing required config");
      }

      const model = await getModel(dataLayer, profileId);
      const payload = buildPersonaPayload(twitterConfig, linkedInConfig);
      const personalitySnippet = await buildPersonalitySnippet(
        openAiKey,
        model,
        payload
      );

      return personalitySnippet;
    },
  };
}
