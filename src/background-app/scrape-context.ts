import type { ContentApp } from "@/src/content-app/context";
import { browserApi } from "../utils/browser-api";
import type { LinkedInProfile, XProfile } from "./data";
import { createProxyHandler } from "@/src/utils/proxy-handler";

export function getContentApp(tabId: number): ContentApp {
  return createProxyHandler<ContentApp>(async (path, args) => {
    const result = await browserApi.tabs.sendMessage(tabId, {
      name: "content-proxy",
      path,
      args,
    });
    return result;
  });
}

async function waitForTabLoad(tabId: number): Promise<void> {
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

async function waitForContent(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}

async function doOnTab<T>(
  url: string,
  fn: (tabId: number) => Promise<T>
): Promise<T> {
  const tab = await browserApi.tabs.create({
    url: url,
    active: false,
  });

  try {
    await waitForTabLoad(tab.id!);
    await waitForContent(tab.id!);
    return await fn(tab.id!);
  } catch (error) {
    console.error("Error scraping profile:", error);
    throw error;
  } finally {
    if (tab.id) {
      await browserApi.tabs.remove(tab.id);
    }
  }
}

export class ScrapingContext {
  async scrapeTwitterProfile(twitterUrl: string): Promise<XProfile> {
    return doOnTab(twitterUrl, async (tabId) => {
      const contentApp = getContentApp(tabId);
      const result = await contentApp.scrapeProfile();
      if (!result) {
        throw new Error("Failed to scrape profile data");
      }
      return result as XProfile;
    });
  }

  async scrapeLinkedInProfile(linkedInUrl: string): Promise<LinkedInProfile> {
    return doOnTab(linkedInUrl, async (tabId) => {
      const contentApp = getContentApp(tabId);
      const result = await contentApp.scrapeLinkedInProfile();
      if (!result) {
        throw new Error("Failed to scrape LinkedIn profile data");
      }
      return result as LinkedInProfile;
    });
  }
}
