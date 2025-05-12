import { STORES, type Database } from "../database";
import type { XProfile } from "../models/social-profile";

export class SavedProfilesRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<XProfile[]> {
    return this.db.getAll<XProfile>(STORES.SAVED_PROFILES);
  }

  async getByUsernames(usernames: string[]): Promise<XProfile[]> {
    return this.db.getAllByIndex<XProfile>(
      STORES.SAVED_PROFILES,
      "username",
      usernames.join(",")
    );
  }

  async getByUsername(username: string): Promise<XProfile | null> {
    const profile = await this.db.get<XProfile>(
      STORES.SAVED_PROFILES,
      username
    );
    if (!profile) {
      return null;
    }
    return profile;
  }

  async saveProfile(profile: XProfile): Promise<void> {
    await this.db.put(STORES.SAVED_PROFILES, profile);
  }

  async deleteProfile(username: string): Promise<void> {
    await this.db.delete(STORES.SAVED_PROFILES, username);
  }

  async add(profile: XProfile): Promise<void> {
    await this.db.put(STORES.SAVED_PROFILES, profile);
  }

  async delete(username: string): Promise<void> {
    await this.db.delete(STORES.SAVED_PROFILES, username);
  }
}
