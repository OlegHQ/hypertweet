import type { Settings } from "http2";
import type { Profile, ReplyType, XProfile, Tweet } from "../domain";
import { STORES, type Database } from "./database";
import { gzipSync, gunzipSync } from "fflate"; // npm i fflate

export class BackupService {
  constructor(private db: Database) {}
  async exportData() {
    const profiles = await this.db.getAll<Profile>(STORES.PROFILES);
    const settings = await this.db.getAll<Settings>(STORES.SETTINGS);
    const replyTypes = await this.db.getAll<ReplyType>(STORES.REPLY_TYPES);
    const savedProfiles = await this.db.getAll<XProfile>(STORES.SAVED_PROFILES);
    const tweets = await this.db.getAll<Tweet>(STORES.TWEETS);
    const twitterProfiles = await this.db.getAll<XProfile>(
      STORES.TWITTER_PROFILES
    );

    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        profiles,
        settings,
        replyTypes,
        savedProfiles,
        tweets,
        twitterProfiles,
      },
    };

    const json = JSON.stringify(backupData);
    const compressed = gzipSync(new TextEncoder().encode(json), { level: 9 });

    const blob = new Blob([compressed], { type: "application/gzip" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `hypertweet-backup-${
      new Date().toISOString().split("T")[0]
    }.json.gz`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importData(text: string): Promise<void> {
    const backupData = JSON.parse(text);

    if (!backupData.version || !backupData.data) {
      throw new Error("Invalid backup file format");
    }

    // Clear existing data
    await Promise.all([
      this.db.clearStore(STORES.PROFILES),
      this.db.clearStore(STORES.SETTINGS),
      this.db.clearStore(STORES.REPLY_TYPES),
      this.db.clearStore(STORES.SAVED_PROFILES),
      this.db.clearStore(STORES.TWEETS),
      this.db.clearStore(STORES.TWITTER_PROFILES),
    ]);

    // Import new data
    const {
      profiles,
      settings,
      replyTypes,
      savedProfiles,
      tweets,
      twitterProfiles,
    } = backupData.data;

    await Promise.all([
      ...(profiles ?? []).map((profile: Profile) =>
        this.db.put(STORES.PROFILES, profile)
      ),
      ...(settings ?? []).map((setting: Settings) =>
        this.db.put(STORES.SETTINGS, setting)
      ),
      ...(replyTypes ?? []).map((replyType: ReplyType) =>
        this.db.put(STORES.REPLY_TYPES, replyType)
      ),
      ...(savedProfiles ?? []).map((savedProfile: XProfile) =>
        this.db.put(STORES.SAVED_PROFILES, savedProfile)
      ),
      ...(tweets ?? []).map((tweet: Tweet) =>
        this.db.put(STORES.TWEETS, tweet)
      ),
      ...(twitterProfiles ?? []).map((profile: XProfile) =>
        this.db.put(STORES.TWITTER_PROFILES, profile)
      ),
    ]);
  }
}
