import { STORES, type Database } from "../../infra/database";
import type { XProfile } from "../models/social-profile";

export class TwitterProfileRepository {
  constructor(private db: Database) {}

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
}
