import type { ScrapingService } from "src/background-app/infra/scraping-service";
import type { XProfile } from "../models/social-profile";
import type { TwitterProfileRepository } from "../repositories/tweeter-profile-repository";

export class ProfileService {
  constructor(
    private readonly profiles: TwitterProfileRepository,
    private readonly scraping: ScrapingService
  ) {}

  async saveOne(profile: XProfile) {
    const existingProfile = await this.profiles.getByUsername(profile.username);
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
    await this.profiles.upsert(profile);
    return profile;
  }

  async scrapeOneAndSave() {
    const profile = await this.scraping.getTwitterProfileOnActivePage();
    if (!profile) {
      return null;
    }
    return this.saveOne(profile);
  }
}
