import { STORES, type Database } from "../database";
import type { XProfile } from "../models/social-profile";

export class SavedProfilesRepository {
  constructor(private db: Database) {}

  async getAll(): Promise<XProfile[]> {
    return this.db.getAll<XProfile>(STORES.SAVED_PROFILES);
  }

  async getByUsernames(
    profileId: string,
    usernames: string[]
  ): Promise<XProfile[]> {
    return (await this.db.getAll<XProfile>(STORES.SAVED_PROFILES)).filter(
      (x) => usernames.includes(x.username) && x.id?.includes(profileId)
    );
  }

  async getByUsername(
    profileId: string,
    username: string
  ): Promise<XProfile | null> {
    const profile = await this.db.get<XProfile>(
      STORES.SAVED_PROFILES,
      `${profileId}:${username}`
    );
    if (!profile) {
      return null;
    }
    return profile;
  }

  async saveProfile(profileId: string, profile: XProfile): Promise<void> {
    await this.db.put(STORES.SAVED_PROFILES, {
      ...profile,
      id: `${profileId}:${profile.username}`,
    });
  }

  async deleteProfile(profileId: string, username: string): Promise<void> {
    await this.db.delete(STORES.SAVED_PROFILES, `${profileId}:${username}`);
  }

  async add(profileId: string, profile: XProfile): Promise<void> {
    await this.db.put(STORES.SAVED_PROFILES, {
      ...profile,
      id: `${profileId}:${profile.username}`,
    });
  }

  async delete(profileId: string, username: string): Promise<void> {
    await this.db.delete(STORES.SAVED_PROFILES, `${profileId}:${username}`);
  }
}
