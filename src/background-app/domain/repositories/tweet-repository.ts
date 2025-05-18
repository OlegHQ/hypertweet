import { STORES, type Database } from "../../infra/database";
import type { Tweet } from "../models/social-profile";

export class TweetRepository {
  constructor(private db: Database) {}

  async add(tweet: Tweet): Promise<void> {
    await this.db.put(STORES.TWEETS, tweet);
  }
}
