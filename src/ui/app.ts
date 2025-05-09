import { createProxyHandler } from "../utils/proxy-handler";
import type { App } from "../background-app";
import { sendMessage } from "../utils/browser-api";

export const app = createProxyHandler<App>(async (path, args) => {
  const result = await sendMessage({
    name: "proxy",
    path,
    args,
  });
  return result;
});
