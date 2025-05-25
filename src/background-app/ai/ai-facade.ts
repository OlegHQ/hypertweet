import {
  ConfigTypeKey,
  type DataLayer,
  type LinkedInProfile,
  type XProfile,
} from "../domain";
import { editReply } from "./context";
import { buildPersonalitySnippet } from "./build-personality-snippet";
import { generateReply } from "./generate-reply";
import { buildPersonaPayload } from "./system-prompt-gen";
import { defaultModel, ModelType } from "./model-type";
import {
  buildFormatInstructionsPrompt,
  defaultOptions as defaultFormatInstructionsOptions,
  type InstructionOptions,
} from "./format-instructions";
import { PERSONALITY_TYPES, type PersonalityType } from "./personality-type";

export type ActionType =
  | "simplify"
  | "cleanup"
  | "story"
  | "depth"
  | "humanize"
  | "challenge"
  | "shorten";

export class AIFacade {
  constructor(private readonly dataLayer: DataLayer) {}

  async editReply(
    _: "twitter" | "linkedin" | "debugging",
    profileId: string,
    postText: string,
    currentReply: string,
    mode: ActionType
  ) {
    const model = await this.getModel(profileId);

    const personalityType = await this.dataLayer.config.get<PersonalityType>(
      profileId,
      ConfigTypeKey.PERSONALITY_TYPE
    );
    const openAiKey = await this.dataLayer.config.getCredential(
      profileId,
      ConfigTypeKey.OPENAI_API_KEY
    );
    if (!openAiKey) {
      throw new Error("Missing required config");
    }
    const [reply, request, response] = await editReply({
      key: openAiKey,
      model: model,
      personalityType: personalityType,
      postText: postText,
      currentReply: currentReply,
      mode: mode,
    });
    await this.dataLayer.requestLog.save({
      profileId,
      request,
      response,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "edit",
    });
    return reply;
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
    const personalityType = await this.dataLayer.config.get<PersonalityType>(
      profileId,
      ConfigTypeKey.PERSONALITY_TYPE
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

    const [reply, request, response] = await generateReply(
      openAiKey,
      model,
      personaSnippet,
      personalityType,
      prompt,
      await this.buildFormatInstructionsPrompt(formatInstructions),
      postText,
      site
    );

    await this.dataLayer.requestLog.save({
      profileId,
      request,
      response,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "generate",
    });

    return reply;
  }

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
    const name = twitterProfile?.name ?? profile?.name ?? "user";
    let personalityTypeLabel = "";
    if (personalityType) {
      personalityTypeLabel =
        PERSONALITY_TYPES.find(
          (type) => type.value === personalityType
        )?.label.replace("The ", "") ?? "";
    }

    return {
      responseSize: "tweet",
      responseFormat:
        await this.buildFormatInstructionsPrompt(formatInstructions),
      author: {
        name,
        personalityType: personalityTypeLabel
          ? personalityTypeLabel
          : undefined,
        username: twitterProfile ? twitterProfile.username : undefined,
        website: twitterProfile ? twitterProfile.website : undefined,
        persona: prompt ? prompt : undefined,
      },
    };
  }

  async getModel(profileId: string) {
    return ((await this.dataLayer.config.get<string>(
      profileId,
      ConfigTypeKey.COMPLETION_MODEL
    )) ?? defaultModel) as ModelType;
  }
}
