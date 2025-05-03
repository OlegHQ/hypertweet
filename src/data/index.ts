import { Database } from "./database";
import { ProfileRepository } from "./repositories/profile-repository";
import { SettingsRepository } from "./repositories/settings-repository";
import { ConfigRepository } from "./repositories/config-repository";

export interface DataLayer {
  profile: ProfileRepository;
  settings: SettingsRepository;
  config: ConfigRepository;
}

export async function createDataLayer(): Promise<DataLayer> {
  const db = new Database();
  await db.init();

  return {
    profile: new ProfileRepository(db),
    settings: new SettingsRepository(db),
    config: new ConfigRepository(db),
  };
}
export * from "./models/profile";
export * from "./models/settings";
