import { onMessage } from "./utils/browser-api";
import { makePathInvoker } from "./utils/proxy-handler";
import { injectTwitterReplyStuff } from "./content-app/ui/inject-twitter";
import { injectLinkedInReplyStuff } from "./content-app/ui/inject-linkedin";
import { ContentApp } from "./content-app/context";
import { TwitterScraper } from "./content-app/twitter/twitter-scraper";
import { LinkedInScraper } from "./content-app/linkedin/linkedin-scraper";

const app = new ContentApp(new TwitterScraper(), new LinkedInScraper());
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
