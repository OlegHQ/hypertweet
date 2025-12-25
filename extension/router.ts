import { SocialPage } from './base';
import { TwitterSocialPage } from './twitter';
import { RedditSocialPage } from './reddit';
import { LinkedInSocialPage } from './linkedin';

export enum SiteType {
  Twitter,
  Reddit,
  LinkedIn,
}

export class Router {
  public getSocialPage(): SocialPage {
    const siteType = this.getSiteType();

    switch (siteType) {
      case SiteType.Twitter:
        return new TwitterSocialPage();
      case SiteType.Reddit:
        return new RedditSocialPage();
      case SiteType.LinkedIn:
        return new LinkedInSocialPage();
      default:
        throw new Error(`Unsupported site: ${siteType}`);
    }
  }

  private getSiteType(): SiteType {
    const { hostname } = window.location;

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
