import { STORES, type Database } from "../../infra/database";
import type { Tweet } from "../models/social-profile";

export class TweetRepository {
  constructor(private db: Database) {}

  async add(tweet: Tweet): Promise<void> {
    if (tweet.impressionsNeg === undefined) {
      tweet.impressionsNeg = tweet.impressions * -1;
    }
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
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(STORES.TWEETS, "readonly");
      const store = transaction.objectStore(STORES.TWEETS);
      const index = store.index("username_impressions");
      
      const range = IDBKeyRange.bound(
        [username, -Infinity],
        [username, +Infinity]
      );

      const request = index.openCursor(range);
      const tweets: Tweet[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          tweets.push(cursor.value as Tweet);
          cursor.continue();
        } else {
          resolve(tweets);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}
