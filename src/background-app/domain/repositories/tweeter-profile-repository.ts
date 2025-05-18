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

    const updatedProfile = {
      ...profile,
    };

    if (existingProfile) {
      // Merge non-undefined attributes from new profile into existing one
      const mergedProfile = {
        ...existingProfile,
        ...Object.fromEntries(
          Object.entries(updatedProfile).filter(
            ([_, value]) => value !== undefined
          )
        ),
      };
      await this.db.put(STORES.TWITTER_PROFILES, mergedProfile);
    } else {
      await this.db.put(STORES.TWITTER_PROFILES, updatedProfile);
    }
  }

  async getAll(): Promise<XProfile[]> {
    return this.db.getAll(STORES.TWITTER_PROFILES);
  }

  async getRecentProfiles(limit: number = 50): Promise<XProfile[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(
        STORES.TWITTER_PROFILES,
        "readonly"
      );
      const store = transaction.objectStore(STORES.TWITTER_PROFILES);
      const index = store.index("updatedAtNegative");

      const request = index.openCursor();
      const profiles: XProfile[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>)
          .result;
        if (cursor && profiles.length < limit) {
          profiles.push(cursor.value as XProfile);
          cursor.continue();
        } else {
          resolve(profiles);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getTweets(username: string): Promise<Tweet[]> {
    const profile = await this.getByUsername(username);
    return profile?.recentTweets ?? [];
  }
}
