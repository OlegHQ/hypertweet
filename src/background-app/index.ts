import { defaultReplyTypes } from "./ai/default-reply-types";
import { ConfigTypeKey, createDataLayer, type XProfile } from "./data";
import { ReplyTypeRepository } from "./data/repositories/reply-type-repository";
import { getContentApp, ScrapingContext } from "./scrape-context";
import { newAI } from "./ai-facade";
import {
  STORES,
  type Profile,
  type Settings,
  type ReplyType,
} from "./data/database";
import { browserApi } from "../utils/browser-api";
import type { ThreadTask } from "./ai/thread-tasks";
import {
  buildFormatInstructionsPrompt,
  defaultOptions,
  type InstructionOptions,
} from "./ai/format-instructions";
import type { PersonalityType } from "./ai/personality-type";

export async function setupBackgroundApp() {
  const [dataLayer, db] = await createDataLayer();
  const replyTypeRepository = new ReplyTypeRepository(db);
  const scraping = new ScrapingContext();
  async function getBaseJSONPrompt(profileId: string) {
    const profile = await dataLayer.profile.get(profileId);
    const prompt = await dataLayer.config.get<string>(
      profileId,
      ConfigTypeKey.SYSTEM_PROMPT
    );
    const formatInstructions =
      (await dataLayer.config.get<InstructionOptions>(
        profileId,
        ConfigTypeKey.FORMAT_INSTRUCTIONS
      )) ?? defaultOptions;

    const twitterProfile = await dataLayer.config.get<XProfile>(
      profileId,
      ConfigTypeKey.TWITTER_PROFILE
    );

    const personalityType = await dataLayer.config.get<PersonalityType>(
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
    result.responseFormat = buildFormatInstructionsPrompt(formatInstructions);
    return result;
  }
  return {
    dataLayer,
    profiles: {
      async saveOne(profileId: string) {
        const tabs = await browserApi.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]) {
          return null;
        }
        const contentApp = getContentApp(tabs[0].id!);
        const profile = await contentApp.scrapeProfile();
        if (profile.username.length === 0) {
          return null;
        }

        const existingProfile = await dataLayer.savedProfiles.getByUsername(
          profileId,
          profile.username
        );
        if (existingProfile) {
          const a = Object.fromEntries(
            existingProfile.recentTweets?.map((x) => [x.text, x]) ?? []
          );

          const b = Object.fromEntries(
            profile.recentTweets?.map((x) => [x.text, x]) ?? []
          );

          for (const key in a) {
            if (a[key]) {
              b[key] = a[key];
            }
          }

          profile.recentTweets = Object.values(b);
        }
        await dataLayer.savedProfiles.add(profileId, profile);
        return profile;
      },
    },
    scraping,
    system: {
      async getCurrentProfileId() {
        const lastId = await dataLayer.config.get<string>(
          null,
          ConfigTypeKey.LAST_USED_PROFILE_ID
        );
        return lastId;
      },
    },
    content: {
      async getTaskThreadJSON(profileId: string, task: ThreadTask) {
        const tabs = await browserApi.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]) {
          return null;
        }
        const contentApp = getContentApp(tabs[0].id!);
        const twitterThread = await contentApp.copyTweets();
        const result = await getBaseJSONPrompt(profileId);
        result.twitterThread = twitterThread;
        result.task = task;

        if (twitterThread.currentResponse) {
          result.currentResponse = twitterThread.currentResponse;
        }
        delete twitterThread.currentResponse;

        return result;
      },
      async getPromptGenerateJSON(profileId: string, usernames: string[]) {
        const profiles = await dataLayer.savedProfiles.getByUsernames(
          profileId,
          usernames
        );
        const result = await getBaseJSONPrompt(profileId);
        result.tweetsForReference = profiles
          .map((x) =>
            x.recentTweets
              ?.sort((a, b) => b.impressions - a.impressions)
              .slice(0, 5)
          )
          .flat();
        result.task =
          "generate 3 variants of posts based on the bio and profile, use .tweetsForReference as examples for making engaging posts, use the personality type of the author to make the posts more engaging, follow aesthetic writing style of the author";
        return result;
      },
    },
    replyTypes: {
      add: replyTypeRepository.add.bind(replyTypeRepository),
      update: replyTypeRepository.update.bind(replyTypeRepository),
      delete: replyTypeRepository.delete.bind(replyTypeRepository),
      async getAll(profileId: string) {
        const allItems = await replyTypeRepository.getAllByProfileId(profileId);
        const hiddenSystemReplies =
          (await dataLayer.config.get<string[]>(
            profileId,
            ConfigTypeKey.HIDDEN_REPLY_TYPES
          )) ?? [];

        return [...allItems, ...defaultReplyTypes(profileId)].map((x) => ({
          ...x,
          isHidden: hiddenSystemReplies?.includes(x.id),
        }));
      },
      async getReplyType(profileId: string, id: string) {
        let item =
          defaultReplyTypes(profileId).find(
            (replyType) => replyType.id === id
          ) ?? null;
        if (!item) {
          item = await replyTypeRepository.get(profileId, id);
          if (!item) {
            return null;
          }
        }
        const hiddenReplyTypes =
          (await dataLayer.config.get<string[]>(
            profileId,
            ConfigTypeKey.HIDDEN_REPLY_TYPES
          )) ?? [];
        return hiddenReplyTypes?.includes(item.id)
          ? {
              ...item,
              isHidden: true,
            }
          : item;
      },
      async setOneHidden(profileId: string, id: string, option: boolean) {
        let replyTypes =
          (await dataLayer.config.get<string[]>(
            profileId,
            ConfigTypeKey.HIDDEN_REPLY_TYPES
          )) ?? [];

        if (option) {
          replyTypes.push(id);
        } else {
          replyTypes = replyTypes.filter((r) => r !== id);
        }

        replyTypes = Array.from(new Set(replyTypes));

        await dataLayer.config.set(
          profileId,
          ConfigTypeKey.HIDDEN_REPLY_TYPES,
          replyTypes
        );
      },
    },
    backup: {
      async exportData() {
        const profiles = await db.getAll<Profile>(STORES.PROFILES);
        const settings = await db.getAll<Settings>(STORES.SETTINGS);
        const replyTypes = await db.getAll<ReplyType>(STORES.REPLY_TYPES);
        const savedProfiles = await db.getAll<XProfile>(STORES.SAVED_PROFILES);

        const backupData = {
          version: 1,
          timestamp: new Date().toISOString(),
          data: {
            profiles,
            settings,
            replyTypes,
            savedProfiles,
          },
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `hypertweet-backup-${
          new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      async importData(text: string): Promise<void> {
        const backupData = JSON.parse(text);

        if (!backupData.version || !backupData.data) {
          throw new Error("Invalid backup file format");
        }

        // Clear existing data
        await Promise.all([
          db.clearStore(STORES.PROFILES),
          db.clearStore(STORES.SETTINGS),
          db.clearStore(STORES.REPLY_TYPES),
          db.clearStore(STORES.SAVED_PROFILES),
        ]);

        // Import new data
        const { profiles, settings, replyTypes, savedProfiles } =
          backupData.data;

        await Promise.all([
          ...(profiles ?? []).map((profile: Profile) =>
            db.put(STORES.PROFILES, profile)
          ),
          ...(settings ?? []).map((setting: Settings) =>
            db.put(STORES.SETTINGS, setting)
          ),
          ...(replyTypes ?? []).map((replyType: ReplyType) =>
            db.put(STORES.REPLY_TYPES, replyType)
          ),
          ...(savedProfiles ?? []).map((savedProfile: XProfile) =>
            db.put(STORES.SAVED_PROFILES, savedProfile)
          ),
        ]);
      },
    },
    ai: newAI(dataLayer),
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
