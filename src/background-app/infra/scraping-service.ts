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
    const profile = await contentApp.scrapeProfile();
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
    const twitterThread = await contentApp.copyTweets();
    return twitterThread;
  }
}
