import { browserApi } from "src/utils/browser-api";
import { getContentApp } from "./utils";

export class ScrapingService {
  async getTwitterProfileOnActivePage() {
    const tabs = await browserApi.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs[0]) {
      return null;
    }
    const contentApp = getContentApp(tabs[0].id!);
    const profile = await contentApp.twitter.scrapeProfile();
    if (profile.username.length === 0) {
      return null;
    }
    return profile;
  }

  async getTwitterThreadOnActivePage() {
    const tabs = await browserApi.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs[0]) {
      return null;
    }
    const contentApp = getContentApp(tabs[0].id!);
    const twitterThread = await contentApp.twitter.copyTweets();
    return twitterThread;
  }

  async getRedditThreadOnActivePage() {
    console.log('[Scraping] Getting Reddit thread...');
    const tabs = await browserApi.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs[0]) {
      console.warn('[Scraping] No active tab for Reddit thread');
      return null;
    }
    
    console.log('[Scraping] Getting content app for tab:', tabs[0].id);
    const contentApp = getContentApp(tabs[0].id!);
    
    console.log('[Scraping] Calling extractRedditThread...');
    try {
      const redditThread = await contentApp.reddit.extractRedditThread();
      console.log('[Scraping] Reddit thread extracted:', {
        hasThread: !!redditThread,
        postTitle: redditThread?.post?.title
      });
      return redditThread;
    } catch (error) {
      console.error('[Scraping] Error extracting Reddit thread:', error);
      return null;
    }
  }

  async getThreadOnActivePage() {
    console.log('[Scraping] Getting thread from active page...');
    const tabs = await browserApi.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs[0]) {
      console.warn('[Scraping] No active tab found');
      return null;
    }
    
    const url = tabs[0].url || '';
    console.log('[Scraping] Active tab URL:', url);
    
    if (url.includes('twitter.com') || url.includes('x.com')) {
      console.log('[Scraping] Detected Twitter, getting Twitter thread...');
      return await this.getTwitterThreadOnActivePage();
    } else if (url.includes('reddit.com')) {
      console.log('[Scraping] Detected Reddit, getting Reddit thread...');
      return await this.getRedditThreadOnActivePage();
    }
    
    console.warn('[Scraping] Unsupported platform:', url);
    return null;
  }
}
