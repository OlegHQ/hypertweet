import { Database } from "../infra/database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";
import { SavedProfilesRepository } from "./repositories/saved-profiles-repository";
import { TweetRepository } from "./repositories/tweet-repository";

export class DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
  savedProfiles: SavedProfilesRepository;
  tweet: TweetRepository;
  constructor(private db: Database) {
    this.profile = new ProfileRepository(db);
    this.config = new ConfigRepository(db);
    this.savedProfiles = new SavedProfilesRepository(db);
    this.tweet = new TweetRepository(db);
  }

  async init() {
    await this.db.init();
  }
}

export * from "./models/profile";
export * from "./models/settings";
export * from "./models/social-profile";
export * from "./models/reply-type";
export * from "./models/config-type-key";
