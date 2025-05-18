import { ConfigTypeKey, DataLayer } from "./domain";
import { ReplyTypeRepository } from "./domain/repositories/reply-type-repository";
import { ScrapingContext } from "./infra/scrape-context";
import { AIFacade } from "./ai/ai-facade";
import { Database } from "./infra/database";
import { AiContentPrompt } from "./ai/ai-content-prompt";
import { ScrapingService } from "./infra/scraping-service";
import { BackupService } from "./infra/backup-service";
import { ProfileService } from "./domain/services/profile-service";
import { ReplyTypeService } from "./domain/services/reply-type-service";

export async function setupBackgroundApp() {
  const db = new Database();

  const dataLayer = new DataLayer(db);
  await dataLayer.init();

  const ai = new AIFacade(dataLayer);
  const scrapingService = new ScrapingService();
  const profiles = new ProfileService(dataLayer.savedProfiles, scrapingService);

  const content = new AiContentPrompt(dataLayer, ai, scrapingService);
  const replyTypeRepository = new ReplyTypeRepository(db);
  const replyTypes = new ReplyTypeService(
    dataLayer.config,
    replyTypeRepository
  );
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
