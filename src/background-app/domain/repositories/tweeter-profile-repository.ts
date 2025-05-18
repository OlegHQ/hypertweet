import { STORES, type Database } from "../../infra/database";
import type { XProfile, Tweet } from "../models/social-profile";

export class TwitterProfileRepository {
  constructor(private db: Database) {}

  async getByUsername(username: string): Promise<XProfile | null> {
    return this.db.get<XProfile>(STORES.TWITTER_PROFILES, username);
  }

  async getByUsernames(usernames: string[]): Promise<XProfile[]> {
    return (
      await Promise.all(
        usernames.map((username) => this.getByUsername(username))
      )
    ).filter((x) => x !== null) as XProfile[];
  }

  async delete(username: string): Promise<void> {
    await this.db.delete(STORES.TWITTER_PROFILES, username);
  }

  async upsert(profile: XProfile): Promise<void> {
    const existingProfile = await this.db.get<XProfile>(
      STORES.TWITTER_PROFILES,
      profile.username
    );

    if (existingProfile) {
      // Merge non-undefined attributes from new profile into existing one
      const mergedProfile = {
        ...existingProfile,
        ...Object.fromEntries(
          Object.entries(profile).filter(([_, value]) => value !== undefined)
        ),
      };
      await this.db.put(STORES.TWITTER_PROFILES, mergedProfile);
    } else {
      await this.db.put(STORES.TWITTER_PROFILES, profile);
    }
  }

  async getAll(): Promise<XProfile[]> {
    return this.db.getAll(STORES.TWITTER_PROFILES);
  }

  async getTweets(username: string): Promise<Tweet[]> {
    const profile = await this.getByUsername(username);
    return profile?.recentTweets ?? [];
  }
}
