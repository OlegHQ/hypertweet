import { browserApi } from "./utils/browser-api";
import { makeContentApp } from "./content-app/context";
import { makePathInvoker } from "./utils/proxy-handler";
import { injectReplyStuff } from "./content-app/inject";

const app = makeContentApp();
const invoker = makePathInvoker(app);

browserApi.runtime.onMessage.addListener(async (message) => {
  const { name, path, args } = message;
  if (name === "content-proxy") {
    return await invoker(path, args);
  }
  throw new Error("unknown message");
});

injectReplyStuff();
