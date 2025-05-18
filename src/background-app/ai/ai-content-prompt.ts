import { browserApi } from "src/utils/browser-api";
import type { ThreadTask } from "./thread-tasks";
import type { DataLayer } from "../domain";
import type { AIFacade } from "./ai-facade";
import type { ScrapingService } from "../infra/scraping-service";

type TweetType = "authority" | "growth" | "personality";

export class AiContentPrompt {
  constructor(
    private readonly dataLayer: DataLayer,
    private readonly ai: AIFacade,
    private readonly scraping: ScrapingService
  ) {}
  async getTaskThreadJSON(profileId: string, task: ThreadTask) {
    const result = await this.ai.getBaseJSONPrompt(profileId);
    const twitterThread = await this.scraping.getTwitterThreadOnActivePage();
    if (!twitterThread) {
      return null;
    }
    result.twitterThread = twitterThread;
    result.task = task;

    if (twitterThread.currentResponse) {
      result.currentResponse = twitterThread.currentResponse;
    }
    delete twitterThread.currentResponse;

    return result;
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

    const result = await this.ai.getBaseJSONPrompt(profileId);
    result.tweetsForReference = tweets;

    const tweetTypeInstructions = {
      authority: "focus on demonstrating expertise and establishing credibility",
      growth: "focus on providing value through self-improvement content",
      personality: "focus on showing authentic personality and connecting with people",
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
