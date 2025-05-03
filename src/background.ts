// Use a unified API reference for Chrome & Firefox

import { setupBackgroundApp } from "./background-app";
import { browserApi } from "./browser-api";
import { createDataLayer } from "./data";
import { makePathInvoker } from "./data/proxy-handler";

// Listen for extension icon click
browserApi.action.onClicked.addListener((tab) => {
  if (tab.id) {
    browserApi.sidebarAction.open();
  }
});

const invoker: { current: any } = { current: null };

setupBackgroundApp().then((app) => {
  invoker.current = makePathInvoker(app);
});

browserApi.runtime.onMessage.addListener(async (message: any) => {
  const { name, path, args } = message;
  if (name === "proxy") {
    return await invoker.current(path, args);
  }
});
