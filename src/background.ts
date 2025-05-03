// Use a unified API reference for Chrome & Firefox

import { browserApi } from "./browser-api";
import { createDataLayer, setupBackgroundApp } from "./data";
import { makePathInvoker } from "./data/proxy-handler";

// Listen for extension icon click
browserApi.action.onClicked.addListener((tab) => {
  if (tab.id) {
    browserApi.sidebarAction.open();
  }
});

const app = setupBackgroundApp();
const invoker = makePathInvoker(app);

browserApi.runtime.onMessage.addListener(async (message: any) => {
  const { name, path, args } = message;
  if (name === "proxy") {
    return await invoker(path, args);
  }
});
