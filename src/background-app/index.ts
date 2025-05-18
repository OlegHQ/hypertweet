import { defaultReplyTypes } from "./ai/default-reply-types";
import { ConfigTypeKey, DataLayer, type XProfile } from "./domain";
import { ReplyTypeRepository } from "./domain/repositories/reply-type-repository";
import { ScrapingContext } from "./infra/scrape-context";
import { AIFacade } from "./ai/ai-facade";
import {
  STORES,
  type Profile,
  type Settings,
  type ReplyType,
  Database,
} from "./domain/database";
import { browserApi } from "../utils/browser-api";
import type { ThreadTask } from "./ai/thread-tasks";
import { AiContentPrompt } from "./ai/ai-content-prompt";
import { ScrapingService } from "./infra/scraping-service";

class ProfileService {
  constructor(
    private readonly dataLayer: DataLayer,
    private readonly scraping: ScrapingService
  ) {}

  async saveOne(profileId: string, profile: XProfile) {
    const existingProfile = await this.dataLayer.savedProfiles.getByUsername(
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
    await this.dataLayer.savedProfiles.add(profileId, profile);
    return profile;
  }

  async scrapeOneAndSave(profileId: string) {
    const profile = await this.scraping.getTwitterProfileOnActivePage();
    if (!profile) {
      return null;
    }
    return this.saveOne(profileId, profile);
  }
}

export async function setupBackgroundApp() {
  const db = new Database();

  const dataLayer = new DataLayer(db);
  await dataLayer.init();

  const ai = new AIFacade(dataLayer);
  const scrapingService = new ScrapingService();
  const profiles = new ProfileService(dataLayer, scrapingService);

  const content = new AiContentPrompt(dataLayer, ai, scrapingService);
  const replyTypeRepository = new ReplyTypeRepository(db);
  const scraping = new ScrapingContext();

  return {
    dataLayer,
    profiles,
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
    content,
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
    ai,
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
