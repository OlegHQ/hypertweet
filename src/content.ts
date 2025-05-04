import { browserApi } from "./browser-api";
import { makeContentApp } from "./content-app/context";
import { makePathInvoker } from "./data/proxy-handler";
const app = makeContentApp();
const invoker = makePathInvoker(app);
console.log(" hype content script loaded");
browserApi.runtime.onMessage.addListener(async (message) => {
  const { name, path, args } = message;
  if (name === "content-proxy") {
    return await invoker(path, args);
  }
  throw new Error("unknown message");
});
