import { Database } from "../infra/database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";
import { TweetRepository } from "./repositories/tweet-repository";
import { TwitterProfileRepository } from "./repositories/tweeter-profile-repository";

export class DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
  tweet: TweetRepository;
  twitterProfile: TwitterProfileRepository;
  constructor(private db: Database) {
    this.profile = new ProfileRepository(db);
    this.config = new ConfigRepository(db);
    this.tweet = new TweetRepository(db);
    this.twitterProfile = new TwitterProfileRepository(db);
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
