import { Scraper } from './base'
import { TwitterScraper } from './twitter'
import { RedditScraper } from './reddit'
import { LinkedInScraper } from './linkedin'

export enum SiteType {
	Twitter,
	Reddit,
	LinkedIn
}

export class Router {
	public getScraper(): Scraper {
		const siteType = this.getSiteType();
		
		switch (siteType) {
			case SiteType.Twitter:
				return new TwitterScraper();
			case SiteType.Reddit:
				return new RedditScraper();
			case SiteType.LinkedIn:
				return new LinkedInScraper();
			default:
				throw new Error(`Unsupported site: ${siteType}`);
		}
	}

	private getSiteType(): SiteType {
		const hostname = window.location.hostname;
		
		if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
			return SiteType.Twitter;
		} else if (hostname.includes('reddit.com')) {
			return SiteType.Reddit;
		} else if (hostname.includes('linkedin.com')) {
			return SiteType.LinkedIn;
		}
		
		throw new Error(`Unsupported hostname: ${hostname}`);
	}
}

