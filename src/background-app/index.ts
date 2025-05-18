import { defaultReplyTypes } from "./ai/default-reply-types";
import {
  ConfigTypeKey,
  DataLayer,
  type Profile,
  type ReplyType,
  type Settings,
  type XProfile,
} from "./domain";
import { ReplyTypeRepository } from "./domain/repositories/reply-type-repository";
import { ScrapingContext } from "./infra/scrape-context";
import { AIFacade } from "./ai/ai-facade";
import { STORES, Database } from "./infra/database";
import { AiContentPrompt } from "./ai/ai-content-prompt";
import { ScrapingService } from "./infra/scraping-service";
import { BackupService } from "./infra/backup-service";

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

class ReplyTypeService {
  constructor(
    private readonly dataLayer: DataLayer,
    private readonly replyTypeRepository: ReplyTypeRepository
  ) {}

  async add(replyType: Omit<ReplyType, "id">) {
    return this.replyTypeRepository.add(replyType);
  }

  async update(profileId: string, id: string, replyType: Partial<ReplyType>) {
    return this.replyTypeRepository.update(profileId, id, replyType);
  }

  async delete(profileId: string, id: string) {
    return this.replyTypeRepository.delete(profileId, id);
  }

  async getAll(profileId: string) {
    const allItems =
      await this.replyTypeRepository.getAllByProfileId(profileId);
    const hiddenSystemReplies =
      (await this.dataLayer.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];

    return [...allItems, ...defaultReplyTypes(profileId)].map((x) => ({
      ...x,
      isHidden: hiddenSystemReplies?.includes(x.id),
    }));
  }

  async getReplyType(profileId: string, id: string) {
    let item =
      defaultReplyTypes(profileId).find((replyType) => replyType.id === id) ??
      null;
    if (!item) {
      item = await this.replyTypeRepository.get(profileId, id);
      if (!item) {
        return null;
      }
    }
    const hiddenReplyTypes =
      (await this.dataLayer.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];
    return hiddenReplyTypes?.includes(item.id)
      ? {
          ...item,
          isHidden: true,
        }
      : item;
  }

  async setOneHidden(profileId: string, id: string, option: boolean) {
    let replyTypes =
      (await this.dataLayer.config.get<string[]>(
        profileId,
        ConfigTypeKey.HIDDEN_REPLY_TYPES
      )) ?? [];

    if (option) {
      replyTypes.push(id);
    } else {
      replyTypes = replyTypes.filter((r) => r !== id);
    }

    replyTypes = Array.from(new Set(replyTypes));

    await this.dataLayer.config.set(
      profileId,
      ConfigTypeKey.HIDDEN_REPLY_TYPES,
      replyTypes
    );
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
  const replyTypes = new ReplyTypeService(dataLayer, replyTypeRepository);
  const scraping = new ScrapingContext();
  const backup = new BackupService(db);

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
    replyTypes,
    backup,
    ai,
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
