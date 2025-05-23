import { Database } from "../infra/database";
import { ProfileRepository } from "./repositories/profile-repository";
import { ConfigRepository } from "./repositories/config-repository";
import { TweetRepository } from "./repositories/tweet-repository";
import { TwitterProfileRepository } from "./repositories/tweeter-profile-repository";
import { RequestLogRepository } from "./repositories/request-log-repository";

export class DataLayer {
  profile: ProfileRepository;
  config: ConfigRepository;
  tweet: TweetRepository;
  twitterProfile: TwitterProfileRepository;
  requestLog: RequestLogRepository;
  constructor(private db: Database) {
    this.profile = new ProfileRepository(db);
    this.config = new ConfigRepository(db);
    this.tweet = new TweetRepository(db);
    this.twitterProfile = new TwitterProfileRepository(db);
    this.requestLog = new RequestLogRepository(db);
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
