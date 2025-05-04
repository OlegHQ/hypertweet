import { createProxyHandler } from "../utils/proxy-handler";
import type { App } from "../background-app";
import { browserApi } from "../utils/browser-api";

export const bgApp = createProxyHandler<App>(async (path, args) => {
  return await browserApi.runtime.sendMessage({ name: "proxy", path, args });
});
