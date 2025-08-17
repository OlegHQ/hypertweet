import { onMessage } from "./utils/browser-api";
import { makePathInvoker } from "./utils/proxy-handler";
import { injectTwitterReplyStuff } from "./content-app/ui/inject-twitter";
import { injectLinkedInReplyStuff } from "./content-app/ui/inject-linkedin";
import { injectRedditPanel } from "./content-app/ui/inject-reddit";
import { ContentApp } from "./content-app/context";
import { TwitterScraper } from "./content-app/twitter/twitter-scraper";
import { LinkedInScraper } from "./content-app/linkedin/linkedin-scraper";
import { RedditScraper } from "./content-app/reddit/reddit-scraper";
import { startWatching } from "./content-app/twitter/tweet-watcher";

const app = new ContentApp(new TwitterScraper(), new LinkedInScraper(), new RedditScraper());
const invoker = makePathInvoker(app);
onMessage(async (message: any) => {
  const { name, path, args } = message;
  if (name === "content-proxy") {
    return await invoker(path, args);
  }
  throw new Error("unknown message");
});

// Inject based on current site
if (window.location.hostname.includes('reddit.com')) {
  // Initial injection
  injectRedditPanel();
  
  // Watch for URL changes (Reddit is a SPA)
  let lastUrl = window.location.href;
  
  // Use MutationObserver to detect URL changes
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      // Re-inject panel when navigating to a post page
      if (currentUrl.includes('/comments/')) {
        // Small delay to let Reddit render the new content
        setTimeout(() => injectRedditPanel(), 500);
      }
    }
  });
  
  // Observe changes to the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also listen to popstate for browser back/forward navigation
  window.addEventListener('popstate', () => {
    if (window.location.pathname.includes('/comments/')) {
      setTimeout(() => injectRedditPanel(), 500);
    }
  });
  
} else if (window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com')) {
  injectTwitterReplyStuff();
  startWatching();
} else if (window.location.hostname.includes('linkedin.com')) {
  injectLinkedInReplyStuff();
}
