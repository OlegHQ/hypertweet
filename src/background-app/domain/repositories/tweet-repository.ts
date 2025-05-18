import { STORES, type Database } from "../../infra/database";
import type { Tweet } from "../models/social-profile";

export class TweetRepository {
  constructor(private db: Database) {}

  async add(tweet: Tweet): Promise<void> {
    await this.db.put(STORES.TWEETS, tweet);
  }

  async getCountByUsername(username: string): Promise<number> {
    const tweets = await this.db.getAllByIndex(
      STORES.TWEETS,
      "username",
      username
    );
    return tweets.length;
  }

  async getByUsername(username: string): Promise<Tweet[]> {
    return this.db.getAllByIndex(STORES.TWEETS, "username", username);
  }
}
