import { Database } from "./database";
import { ProfileRepository } from "./repositories/profile-repository";
import { SettingsRepository } from "./repositories/settings-repository";

export interface DataLayer {
  profile: ProfileRepository;
  settings: SettingsRepository;
}

export async function createDataLayer(): Promise<DataLayer> {
  const db = new Database();
  await db.init();

  return {
    profile: new ProfileRepository(db),
    settings: new SettingsRepository(db),
  };
}

export function setupBackgroundApp() {
  const dataLayer = createDataLayer();
  let cnt = 0;
  return {
    dataLayer,
    testStuff: async () => {
      return ++cnt;
    },
  };
}

export type App = ReturnType<typeof setupBackgroundApp>;
export * from "./models/profile";
export * from "./models/settings";
