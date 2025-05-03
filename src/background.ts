// Use a unified API reference for Chrome & Firefox

import { browserApi } from "./browser-api";

browserApi.action.onClicked.addListener((tab) => {
  browserApi.tabs.sendMessage(tab.id!, { action: "copyTweets" });
});
