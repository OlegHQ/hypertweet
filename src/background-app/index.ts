import { defaultReplyTypes } from "../ai/replies";
import { createDataLayer } from "../data";
import { ReplyTypeRepository } from "../data/repositories/reply-type-repository";
import { ScrapingContext } from "../scraping/context";
import { newAI } from "./ai-facade";

export async function setupBackgroundApp() {
  const [dataLayer, db] = await createDataLayer();
  const replyTypeRepository = new ReplyTypeRepository(db);
  return {
    dataLayer,
    scraping: new ScrapingContext(),
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

        const defaultOnes = defaultReplyTypes().map((x) => ({
          ...x,
          isHidden: hiddenSystemReplies?.includes(x.id),
        }));

        return [...allItems, ...defaultOnes];
      },
      async getReplyType(profileId: string, id: string) {
        const item = defaultReplyTypes().find(
          (replyType) => replyType.id === id
        );
        if (!item) {
          const replyType = await replyTypeRepository.get(profileId, id);
          if (!replyType) {
            return null;
          }
          return replyType;
        }
        return item;
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
