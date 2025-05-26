import { browserApi } from "src/utils/browser-api";
import type { ThreadTask } from "./thread-tasks";
import { ConfigTypeKey, type DataLayer } from "../domain";
import type { AIFacade } from "./ai-facade";
import type { ScrapingService } from "../infra/scraping-service";
import type { PersonalityType } from "./personality-type";
import { tokenManager } from "./token-manager";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat";

type TweetType = "authority" | "growth" | "personality";

export class AiContentPrompt {
  constructor(
    private readonly dataLayer: DataLayer,
    private readonly ai: AIFacade,
    private readonly scraping: ScrapingService
  ) {}

  async generateComplex(
    profileId: string,
    inTask: ThreadTask,
    numberOfVariants: number = 5
  ) {
    const model = await this.ai.getModel(profileId);

    const openAiKey = await this.dataLayer.config.getCredential(
      profileId,
      ConfigTypeKey.OPENAI_API_KEY
    );
    if (!openAiKey) {
      throw new Error("Missing required config");
    }

    const res = await this.getTaskThreadJSON(profileId, inTask);

    if (!res) {
      throw new Error("Missing required config");
    }

    const { twitterThread, task, currentResponse, ...rest } = res;

    const rawRequest: ChatCompletionCreateParamsNonStreaming = {
      model,
      messages: [
        {
          role: "system",
          content: JSON.stringify(rest),
        },
        {
          role: "user",
          content: JSON.stringify({
            twitterThread,
            task,
            numberOfVariants,
          }),
        },
      ],
      max_tokens: 450,
      temperature: 0.5,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "reply_variants_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["replyVariants"],
            properties: {
              replyVariants: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
        },
      },
    };

    const chatResult = await tokenManager
      .getClient(openAiKey)
      .chat.completions.create(rawRequest);

    const reply = chatResult.choices[0]?.message?.content;

    await this.dataLayer.requestLog.save({
      profileId,
      request: rawRequest,
      response: chatResult,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      type: "complex",
    });
    if (reply) {
      return JSON.parse(reply) as { replyVariants: string[] };
    }

    return { replyVariants: [] };
  }

  async getTaskThreadJSON(profileId: string, task: ThreadTask) {
    const result = await this.ai.getBaseJSONPrompt(profileId);
    const twitterThread = await this.scraping.getTwitterThreadOnActivePage();
    if (!twitterThread) {
      return null;
    }

    const result2 = {
      ...result,
      twitterThread: twitterThread,
      task: task,
      currentResponse: twitterThread.currentResponse
        ? twitterThread.currentResponse
        : undefined,
    };

    return result2;
  }

  async getPromptGenerateJSON(
    profileId: string,
    usernames: string[],
    tweetTopic?: string,
    tweetType: TweetType = "authority"
  ) {
    const tweets = (
      await Promise.all(
        usernames.map(async (username) => {
          const tweets = await this.dataLayer.tweet.getByUsername(username);
          return tweets
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5);
        })
      )
    ).flat();

    const result = (await this.ai.getBaseJSONPrompt(profileId)) as Record<
      string,
      any
    >;
    result.tweetsForReference = tweets;

    const tweetTypeInstructions = {
      authority:
        "focus on demonstrating expertise and establishing credibility",
      growth: "focus on providing value through self-improvement content",
      personality:
        "focus on showing authentic personality and connecting with people",
    };

    if (tweetTopic?.trim()) {
      result.draft = tweetTopic;
      result.task = `Create a ${tweetType} post about "${tweetTopic}" that ${tweetTypeInstructions[tweetType]}. Match the style and engagement level of the reference tweets while maintaining the author's personality and writing style.`;
    } else {
      result.task = `Generate 6 variants of ${tweetType} posts that ${tweetTypeInstructions[tweetType]}. Use .tweetsForReference as examples for making engaging posts, use the personality type of the author to make the posts more engaging, follow aesthetic writing style of the author`;
    }

    return result;
  }
}
