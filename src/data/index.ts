import { Database } from "./database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";

export interface DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
}

export async function createDataLayer(): Promise<DataLayer> {
  const db = new Database();
  await db.init();

  return {
    profile: new ProfileRepository(db),
    config: new ConfigRepository(db),
  };
}
export * from "./models/profile";
export * from "./models/settings";
