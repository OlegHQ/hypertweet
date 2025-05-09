// Use a unified API reference for Chrome & Firefox

import { setupBackgroundApp } from "./background-app";
import { browserApi, onMessage } from "./utils/browser-api";
import { makePathInvoker } from "./utils/proxy-handler";

// Listen for extension icon click
browserApi.action.onClicked.addListener(async function (tab) {
  if (tab.id && "sidebarAction" in browserApi) {
    browserApi.sidebarAction.open();
  } else if (tab.id && typeof chrome.sidePanel !== "undefined") {
    chrome.sidePanel.open(
      {
        tabId: tab.id!,
      },
      () => {
        // -> ("Side panel opened");
      }
    );
  }
});

const invoker: { current: any } = { current: null };

setupBackgroundApp().then((app) => {
  invoker.current = makePathInvoker(app);
});

onMessage(async (message: any) => {
  const { name, path, args } = message;
  if (name === "proxy") {
    for (let i = 0; i < 10; i++) {
      if (typeof invoker.current === "function") {
        const result = await invoker.current(path, args);
        return result;
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    throw new Error("Failed to invoke proxy");
  }
});
