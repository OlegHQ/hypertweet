import { createProxyHandler } from "../utils/proxy-handler";
import type { App } from "../background-app";
import { sendMessage } from "../utils/browser-api";

export const bgApp = createProxyHandler<App>(async (path, args) => {
  return await sendMessage({ name: "proxy", path, args });
});
