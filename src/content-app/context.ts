import { LinkedInScraper } from "./linkedin/linkedin-scraper";
import { TwitterScraper } from "./twitter/twitter-scraper";

export class ContentApp {
  constructor(
    public readonly twitter: TwitterScraper,
    public readonly linkedin: LinkedInScraper
  ) {}
}
