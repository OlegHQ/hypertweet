import { createProxyHandler } from "../data/proxy-handler";
import type { App } from "../data";
import { browserApi } from "../browser-api";

export const app = createProxyHandler<App>(async (path, args) => {
  return await browserApi.runtime.sendMessage({ name: "proxy", path, args });
});
