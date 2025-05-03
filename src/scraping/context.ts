import { browserApi } from "../browser-api";

interface ScrapedProfile {
  name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  following?: number;
  followers?: number;
}

export class ScrapingContext {
  async scrapeTwitterProfile(twitterUrl: string): Promise<ScrapedProfile> {
    // Create a new tab in the background
    const tab = await browserApi.tabs.create({
      url: twitterUrl,
      active: false,
    });

    try {
      // Wait for the tab to load
      await this.waitForTabLoad(tab.id!);

      // Wait for content to be ready
      await this.waitForContent(tab.id!);

      // Execute the scraping script
      // send message to content script
      const result = await browserApi.tabs.sendMessage(tab.id!, {
        action: "scrapeProfile",
      });
      if (!result) {
        throw new Error("Failed to scrape profile data");
      }

      return result as ScrapedProfile;
    } catch (error) {
      console.error("Error scraping profile:", error);
      throw error;
    } finally {
      // Close the tab
      if (tab.id) {
        await browserApi.tabs.remove(tab.id);
      }
    }
  }

  private async waitForTabLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const listener = (
        updatedTabId: number,
        changeInfo: chrome.tabs.TabChangeInfo
      ) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
          browserApi.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      browserApi.tabs.onUpdated.addListener(listener);
    });
  }

  private async waitForContent(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, 3000); // Wait for SPA to load
    });
  }

  private async scrapeProfilePage(): Promise<ScrapedProfile> {
    // Wait for content to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return {
      name: "test",
      username: "test",
      bio: "test",
      location: "test",
      website: "test",
      joinDate: "test",
    };
  }
}
