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
