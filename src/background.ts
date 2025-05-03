// Use a unified API reference for Chrome & Firefox

import { browserApi, isChrome } from "./browser-api";

interface Tweet {
  id: string;
  text: string;
  author: string;
}

let tweets: Tweet[] = [];

// Listen for extension icon click
browserApi.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    // For Chrome
    if ((browserApi as typeof chrome).sidePanel) {
      const api = browserApi as typeof chrome;
      await api.sidePanel.setOptions({
        tabId: tab.id,
        path: "sidebar.html",
        enabled: true,
      });
    } else {
      const api = browserApi as typeof browser;
      api.sidebarAction.setPanel({ panel: "sidebar.html" });
      api.sidebarAction.open();
    }
  } catch (err) {
    console.error("Failed to open sidebar:", err);
  }
});

// Listen for messages from content script and sidebar
browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "TWEET_COPIED":
      // Store the copied tweet
      tweets.push({
        id: message.id,
        text: message.text,
        author: message.author,
      });
      // Notify sidebar of update
      browserApi.runtime.sendMessage({
        type: "TWEETS_UPDATED",
        tweets,
      });
      break;

    case "GET_TWEETS":
      // Send current tweets to requester
      sendResponse({ tweets });
      break;
  }
});
