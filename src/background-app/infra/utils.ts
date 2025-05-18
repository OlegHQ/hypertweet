import type { ContentApp } from "src/content-app/context";
import { browserApi } from "src/utils/browser-api";
import { createProxyHandler } from "src/utils/proxy-handler";

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
