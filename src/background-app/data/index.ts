import { Database } from "./database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";
import { SavedProfilesRepository } from "./repositories/saved-profiles-repository";

export interface DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
  savedProfiles: SavedProfilesRepository;
}
export async function createDataLayer(): Promise<[DataLayer, Database]> {
  const db = new Database();
  console.log("db", db);
  await db.init();

  return [
    {
      profile: new ProfileRepository(db),
      config: new ConfigRepository(db),
      savedProfiles: new SavedProfilesRepository(db),
    },
    db,
  ];
}
export * from "./models/profile";
export * from "./models/settings";
export * from "./models/social-profile";
export * from "./models/reply-type";
export * from "./models/config-type-key";
