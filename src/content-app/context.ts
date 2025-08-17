import { LinkedInScraper } from "./linkedin/linkedin-scraper";
import { TwitterScraper } from "./twitter/twitter-scraper";
import { RedditScraper } from "./reddit/reddit-scraper";

export class ContentApp {
  constructor(
    public readonly twitter: TwitterScraper,
    public readonly linkedin: LinkedInScraper,
    public readonly reddit: RedditScraper
  ) {}
}
