import { Database } from "./database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";
import { ReplyTypeRepository } from "./repositories/reply-type-repository";

export interface DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
  replyType: ReplyTypeRepository;
}

export async function createDataLayer(): Promise<DataLayer> {
  const db = new Database();
  await db.init();

  return {
    profile: new ProfileRepository(db),
    config: new ConfigRepository(db),
    replyType: new ReplyTypeRepository(db),
  };
}
export * from "./models/profile";
export * from "./models/settings";
export * from "./models/social-profile";
