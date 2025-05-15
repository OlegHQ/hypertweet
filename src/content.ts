import { onMessage } from "./utils/browser-api";
import { makeContentApp } from "./content-app/context";
import { makePathInvoker } from "./utils/proxy-handler";
import { injectTwitterReplyStuff } from "./content-app/inject-twitter";
import { injectLinkedInReplyStuff } from "./content-app/inject-linkedin";

const app = makeContentApp();
const invoker = makePathInvoker(app);
onMessage(async (message: any) => {
  const { name, path, args } = message;
  if (name === "content-proxy") {
    return await invoker(path, args);
  }
  throw new Error("unknown message");
});

injectTwitterReplyStuff();
injectLinkedInReplyStuff();
