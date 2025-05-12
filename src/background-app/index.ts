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

export async function setupBackgroundApp() {
  const [dataLayer, db] = await createDataLayer();
  const replyTypeRepository = new ReplyTypeRepository(db);
  const scraping = new ScrapingContext();
  return {
    dataLayer,
    profiles: {
      async saveOne(numberOfTweets?: number) {
        const tabs = await browserApi.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]) {
          return null;
        }
        const contentApp = getContentApp(tabs[0].id!);
        const profile = await contentApp.scrapeProfile(numberOfTweets);
        if (profile.username.length === 0) {
          return null;
        }
        await dataLayer.savedProfiles.add(profile);
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
        const result: Record<string, any> = {};
        const author: Record<string, any> = {};
        author.name = twitterProfile?.name ?? profile?.name ?? "user";
        if (twitterProfile) {
          author.username = twitterProfile.username;
          author.website = twitterProfile.website;
        }

        if (prompt) {
          author.persona = prompt;
        }

        result.author = author;
        result.twitterThread = twitterThread;
        result.responseFormat =
          buildFormatInstructionsPrompt(formatInstructions);
        result.responseSize = "tweet";
        result.task = task;

        if (twitterThread.currentResponse) {
          result.currentResponse = twitterThread.currentResponse;
        }
        delete twitterThread.currentResponse;

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

        const backupData = {
          version: 1,
          timestamp: new Date().toISOString(),
          data: {
            profiles,
            settings,
            replyTypes,
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
        ]);

        // Import new data
        const { profiles, settings, replyTypes } = backupData.data;

        await Promise.all([
          ...profiles.map((profile: Profile) =>
            db.put(STORES.PROFILES, profile)
          ),
          ...settings.map((setting: Settings) =>
            db.put(STORES.SETTINGS, setting)
          ),
          ...replyTypes.map((replyType: ReplyType) =>
            db.put(STORES.REPLY_TYPES, replyType)
          ),
        ]);
      },
    },
    ai: newAI(dataLayer),
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
