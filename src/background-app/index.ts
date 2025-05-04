import { defaultReplyTypes } from "../ai/replies";
import { createDataLayer } from "../data";
import { ScrapingContext } from "../scraping/context";
import { newAI } from "./ai-facade";

export async function setupBackgroundApp() {
  const dataLayer = await createDataLayer();
  return {
    dataLayer,
    scraping: new ScrapingContext(),
    replyTypes: {
      async getReplyType(profileId: string, id: string) {
        const item = defaultReplyTypes().find(
          (replyType) => replyType.id === id
        );
        if (!item) {
          const replyType = await dataLayer.replyType.get(profileId, id);
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
