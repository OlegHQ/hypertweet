import type { ScrapingService } from "src/background-app/infra/scraping-service";
import type { XProfile } from "../models/social-profile";
import type { SavedProfilesRepository } from "../repositories/saved-profiles-repository";

export class ProfileService {
  constructor(
    private readonly savedProfiles: SavedProfilesRepository,
    private readonly scraping: ScrapingService
  ) {}

  async saveOne(profileId: string, profile: XProfile) {
    const existingProfile = await this.savedProfiles.getByUsername(
      profileId,
      profile.username
    );
    if (existingProfile) {
      const a = Object.fromEntries(
        existingProfile.recentTweets?.map((x) => [x.text, x]) ?? []
      );

      const b = Object.fromEntries(
        profile.recentTweets?.map((x) => [x.text, x]) ?? []
      );

      for (const key in a) {
        if (a[key]) {
          b[key] = a[key];
        }
      }

      profile.recentTweets = Object.values(b);
    }
    await this.savedProfiles.add(profileId, profile);
    return profile;
  }

  async scrapeOneAndSave(profileId: string) {
    const profile = await this.scraping.getTwitterProfileOnActivePage();
    if (!profile) {
      return null;
    }
    return this.saveOne(profileId, profile);
  }
}
