import type { SocialPage } from './base';
import { twitterSocialPage } from './twitter';
import { redditSocialPage } from './reddit';
import { linkedinSocialPage } from './linkedin';

export type SiteType = 'twitter' | 'reddit' | 'linkedin';

export class Router {
  private siteType: SiteType;

  constructor() {
    this.siteType = this.detectSiteType();
  }

  public getSocialPage(): SocialPage {
    switch (this.siteType) {
      case 'twitter':
        return twitterSocialPage;
      case 'reddit':
        return redditSocialPage;
      case 'linkedin':
        return linkedinSocialPage;
    }
  }

  public getSiteType(): SiteType {
    return this.siteType;
  }

  private detectSiteType(): SiteType {
    const { hostname } = window.location;

    if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
      return 'twitter';
    } else if (hostname.includes('reddit.com')) {
      return 'reddit';
    } else if (hostname.includes('linkedin.com')) {
      return 'linkedin';
    }

    throw new Error(`Unsupported hostname: ${hostname}`);
  }
}
