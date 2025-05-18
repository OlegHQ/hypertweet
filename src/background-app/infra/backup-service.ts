import type { Settings } from "http2";
import type { Profile, ReplyType, XProfile } from "../domain";
import { STORES, type Database } from "./database";

export class BackupService {
  constructor(private db: Database) {}
  async exportData() {
    const profiles = await this.db.getAll<Profile>(STORES.PROFILES);
    const settings = await this.db.getAll<Settings>(STORES.SETTINGS);
    const replyTypes = await this.db.getAll<ReplyType>(STORES.REPLY_TYPES);
    const savedProfiles = await this.db.getAll<XProfile>(STORES.SAVED_PROFILES);

    const backupData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
        profiles,
        settings,
        replyTypes,
        savedProfiles,
      },
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `hypertweet-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
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
    ]);

    // Import new data
    const { profiles, settings, replyTypes, savedProfiles } = backupData.data;

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
    ]);
  }
}
