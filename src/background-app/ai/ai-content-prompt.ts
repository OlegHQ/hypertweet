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
    console.log('[AI Content] Starting generateComplex', {
      profileId,
      task: inTask,
      numberOfVariants
    });
    
    const model = await this.ai.getModel(profileId);
    console.log('[AI Content] Using model:', model);

    const openAiKey = await this.dataLayer.config.getCredential(
      profileId,
      ConfigTypeKey.OPENAI_API_KEY
    );
    if (!openAiKey) {
      console.error('[AI Content] Missing OpenAI API key');
      throw new Error("Missing required config");
    }
    console.log('[AI Content] OpenAI key found');

    console.log('[AI Content] Getting task thread JSON...');
    const res = await this.getTaskThreadJSON(profileId, inTask);
    console.log('[AI Content] Task thread JSON result:', res);

    if (!res) {
      console.error('[AI Content] No thread data available');
      throw new Error("Missing required config");
    }

    const { task, currentResponse, ...rest } = res;
    const thread = (res as any).twitterThread || (res as any).redditThread;
    const platform = (res as any).platform || 'twitter';
    
    console.log('[AI Content] Extracted data:', {
      task,
      platform,
      hasThread: !!thread,
      threadType: thread ? Object.keys(thread) : 'none',
      currentResponse
    });

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
            thread,
            platform,
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

    console.log('[AI Content] Sending request to OpenAI:', {
      model,
      messagesCount: rawRequest.messages.length,
      maxTokens: rawRequest.max_tokens
    });
    
    const chatResult = await tokenManager
      .getClient(openAiKey)
      .chat.completions.create(rawRequest);
      
    console.log('[AI Content] OpenAI response:', {
      choices: chatResult.choices?.length,
      usage: chatResult.usage
    });

    const reply = chatResult.choices[0]?.message?.content;
    console.log('[AI Content] Raw reply:', reply);

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
      try {
        const parsed = JSON.parse(reply) as { replyVariants: string[] };
        console.log('[AI Content] Parsed reply variants:', parsed);
        return parsed;
      } catch (parseError) {
        console.error('[AI Content] Failed to parse reply JSON:', parseError);
        console.error('[AI Content] Raw reply that failed to parse:', reply);
        return { replyVariants: [] };
      }
    }

    console.warn('[AI Content] No reply content from OpenAI');
    return { replyVariants: [] };
  }

  async getTaskThreadJSON(profileId: string, task: ThreadTask) {
    console.log('[Thread JSON] Getting base JSON prompt...');
    const result = await this.ai.getBaseJSONPrompt(profileId);
    console.log('[Thread JSON] Base prompt received:', Object.keys(result));
    
    // Try to get thread from current active page (Twitter or Reddit)
    console.log('[Thread JSON] Getting thread data from active page...');
    const threadData = await this.scraping.getThreadOnActivePage();
    console.log('[Thread JSON] Thread data result:', {
      hasData: !!threadData,
      dataType: threadData ? (Object.keys(threadData).join(', ')) : 'none'
    });
    
    if (!threadData) {
      console.warn('[Thread JSON] No thread data available');
      return null;
    }

    // Handle Twitter thread format
    if ('status' in threadData) {
      console.log('[Thread JSON] Processing Twitter thread format');
      const result2 = {
        ...result,
        twitterThread: threadData,
        task: task,
        currentResponse: (threadData as any).currentResponse
          ? (threadData as any).currentResponse
          : undefined,
      };
      console.log('[Thread JSON] Twitter result prepared');
      return result2;
    }
    
    // Handle Reddit thread format
    if ('post' in threadData) {
      console.log('[Thread JSON] Processing Reddit thread format');
      const redditContext = threadData as any;
      const result2 = {
        ...result,
        redditThread: {
          post: redditContext.post,
          topComments: redditContext.topComments,
          recentComments: redditContext.recentComments,
          subredditContext: redditContext.subredditContext,
          currentUserInput: redditContext.currentUserInput
        },
        task: task,
        platform: 'reddit',
        currentResponse: redditContext.currentUserInput || undefined,
      };
      console.log('[Thread JSON] Reddit result prepared:', {
        hasPost: !!redditContext.post,
        topCommentsCount: redditContext.topComments?.length || 0,
        recentCommentsCount: redditContext.recentComments?.length || 0,
        subreddit: redditContext.subredditContext?.name
      });
      return result2;
    }

    console.warn('[Thread JSON] Unknown thread format:', Object.keys(threadData));
    return null;
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
