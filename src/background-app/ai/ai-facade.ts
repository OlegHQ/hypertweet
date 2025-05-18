import {
  ConfigTypeKey,
  type DataLayer,
  type LinkedInProfile,
  type XProfile,
} from "../data";
import { buildPersonalitySnippet, generateReply } from "./context";
import { buildPersonaPayload } from "./system-prompt-gen";
import { defaultModel, ModelType } from "./model-type";
import {
  buildFormatInstructionsPrompt,
  defaultOptions as defaultFormatInstructionsOptions,
  type InstructionOptions,
} from "./format-instructions";
import type { PersonalityType } from "./personality-type";

export class AIFacade {
  constructor(private readonly dataLayer: DataLayer) {}

  async getFormatInstructionOptions(profileId: string) {
    const formatInstructions =
      (await this.dataLayer.config.get<InstructionOptions>(
        profileId,
        ConfigTypeKey.FORMAT_INSTRUCTIONS
      )) ?? defaultFormatInstructionsOptions;

    return formatInstructions;
  }

  async buildFormatInstructionsPrompt(
    opts: InstructionOptions
  ): Promise<string> {
    return buildFormatInstructionsPrompt(opts);
  }

  async generateReply(
    site: "twitter" | "linkedin",
    profileId: string,
    postText: string,
    prompt: string
  ) {
    const model = await this.getModel(profileId);
    const personaSnippet = await this.dataLayer.config.get<string>(
      profileId,
      ConfigTypeKey.SYSTEM_PROMPT
    );
    const openAiKey = await this.dataLayer.config.getCredential(
      profileId,
      ConfigTypeKey.OPENAI_API_KEY
    );
    if (!openAiKey) {
      throw new Error("Missing required config");
    }
    const formatInstructions =
      (await this.dataLayer.config.get<InstructionOptions>(
        profileId,
        ConfigTypeKey.FORMAT_INSTRUCTIONS
      )) ?? defaultFormatInstructionsOptions;

    return await generateReply(
      openAiKey,
      model,
      personaSnippet,
      prompt,
      await this.buildFormatInstructionsPrompt(formatInstructions),
      postText,
      site
    );
  }

  async buildPersonaPayload(profileId: string) {
    const twitterConfig = await this.dataLayer.config.get<XProfile>(
      profileId,
      ConfigTypeKey.TWITTER_PROFILE
    );
    const linkedInConfig = await this.dataLayer.config.get<LinkedInProfile>(
      profileId,
      ConfigTypeKey.LINKEDIN_PROFILE
    );
    const openAiKey = await this.dataLayer.config.getCredential(
      profileId,
      ConfigTypeKey.OPENAI_API_KEY
    );

    if (!twitterConfig || !linkedInConfig || !openAiKey) {
      throw new Error("Missing required config");
    }

    const model = await this.getModel(profileId);
    const payload = buildPersonaPayload(twitterConfig, linkedInConfig);
    const personalitySnippet = await buildPersonalitySnippet(
      openAiKey,
      model,
      payload
    );

    return personalitySnippet;
  }

  async getBaseJSONPrompt(profileId: string) {
    const profile = await this.dataLayer.profile.get(profileId);
    const prompt = await this.dataLayer.config.get<string>(
      profileId,
      ConfigTypeKey.SYSTEM_PROMPT
    );
    const formatInstructions =
      (await this.dataLayer.config.get<InstructionOptions>(
        profileId,
        ConfigTypeKey.FORMAT_INSTRUCTIONS
      )) ?? defaultFormatInstructionsOptions;

    const twitterProfile = await this.dataLayer.config.get<XProfile>(
      profileId,
      ConfigTypeKey.TWITTER_PROFILE
    );

    const personalityType = await this.dataLayer.config.get<PersonalityType>(
      profileId,
      ConfigTypeKey.PERSONALITY_TYPE
    );
    const result: Record<string, any> = {};
    const author: Record<string, any> = {};
    author.name = twitterProfile?.name ?? profile?.name ?? "user";
    if (personalityType) {
      author.personalityType = personalityType;
    }
    if (twitterProfile) {
      author.username = twitterProfile.username;
      author.website = twitterProfile.website;
    }

    if (prompt) {
      author.persona = prompt;
    }

    result.author = author;
    result.responseSize = "tweet";
    result.responseFormat =
      await this.buildFormatInstructionsPrompt(formatInstructions);
    return result;
  }

  private async getModel(profileId: string) {
    return ((await this.dataLayer.config.get<string>(
      profileId,
      ConfigTypeKey.COMPLETION_MODEL
    )) ?? defaultModel) as ModelType;
  }
}
