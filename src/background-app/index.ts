import { defaultReplyTypes } from "./ai/default-reply-types";
import { createDataLayer } from "./data";
import { ReplyTypeRepository } from "./data/repositories/reply-type-repository";
import { ScrapingContext } from "./scrape-context";
import { newAI } from "./ai-facade";

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
