import { defaultReplyTypes } from "./ai/default-reply-types";
import { createDataLayer } from "./data";
import { ReplyTypeRepository } from "./data/repositories/reply-type-repository";
import { ScrapingContext } from "./scrape-context";
import { newAI } from "./ai-facade";
import { STORES, db, type Profile, type Settings, type ReplyType } from "./data/database";

export async function setupBackgroundApp() {
  const [dataLayer, db] = await createDataLayer();
  const replyTypeRepository = new ReplyTypeRepository(db);
  return {
    dataLayer,
    scraping: new ScrapingContext(),
    system: {
      async getCurrentProfileId() {
        const lastId = await dataLayer.config.get<string>(
          null,
          "lastUsedProfileId"
        );
        return lastId;
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
            replyTypes
          }
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `hypertweet-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },

      async importData(file: File): Promise<void> {
        const text = await file.text();
        const backupData = JSON.parse(text);

        if (!backupData.version || !backupData.data) {
          throw new Error('Invalid backup file format');
        }

        // Clear existing data
        await Promise.all([
          db.clearStore(STORES.PROFILES),
          db.clearStore(STORES.SETTINGS),
          db.clearStore(STORES.REPLY_TYPES)
        ]);

        // Import new data
        const { profiles, settings, replyTypes } = backupData.data;

        await Promise.all([
          ...profiles.map((profile: Profile) => db.put(STORES.PROFILES, profile)),
          ...settings.map((setting: Settings) => db.put(STORES.SETTINGS, setting)),
          ...replyTypes.map((replyType: ReplyType) => db.put(STORES.REPLY_TYPES, replyType))
        ]);
      }
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
            "hiddenSystemReplies"
          )) ?? [];

        const defaultOnes = defaultReplyTypes(profileId).map((x) => ({
          ...x,
          isHidden: hiddenSystemReplies?.includes(x.id),
        }));

        return [...allItems, ...defaultOnes];
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
        const hiddenSystemReplies =
          (await dataLayer.config.get<string[]>(
            profileId,
            "hiddenSystemReplies"
          )) ?? [];
        return item.isSystem && hiddenSystemReplies?.includes(item.id)
          ? {
              ...item,
              isHidden: true,
            }
          : item;
      },
      async setSystemOneHidden(profileId: string, id: string, option: boolean) {
        let replyTypes =
          (await dataLayer.config.get<string[]>(
            profileId,
            "hiddenSystemReplies"
          )) ?? [];

        if (option) {
          replyTypes.push(id);
        } else {
          replyTypes = replyTypes.filter((r) => r !== id);
        }

        replyTypes = Array.from(new Set(replyTypes));

        await dataLayer.config.set(
          profileId,
          "hiddenSystemReplies",
          replyTypes
        );
      },
    },
    ai: newAI(dataLayer),
  };
}

export type App = Awaited<ReturnType<typeof setupBackgroundApp>>;
