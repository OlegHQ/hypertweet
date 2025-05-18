import { bgApp } from "../bg-app";
import { extractTweet } from "./extract-tweet";

/**
 * This script watches the X / Twitter timeline for newly‑inserted tweets and
 * forwards them to the background data layer.  It automatically re‑attaches
 * itself when the SPA navigates or the timeline node is re‑created and stays
 * silent on non‑twitter domains.
 */

const TWEET_SEL = '[data-testid="tweet"]';
const TIMELINE_SEL = '[aria-label^="Timeline"]';
const ALLOWED_HOST_RE = /^(?:www\.)?(?:twitter\.com|x\.com)$/i;

async function handleNewTweet(t: HTMLElement) {
  /* …same as before… */
  const tweet = extractTweet(t);
  if (tweet) {
    await bgApp.dataLayer.tweet.add(tweet);
    console.log(`tweet added ${tweet.id} from ${tweet.from}`);
  }
}

/**
 * Starts a resilient timeline watcher.  It does nothing on non‑Twitter pages.
 */
export function startWatching() {
  // Bail on any domain that is not Twitter or X
  if (!ALLOWED_HOST_RE.test(location.hostname)) {
    console.debug(
      "tweet watcher disabled: not on Twitter/X →",
      location.hostname
    );
    return;
  }

  let currentObserver: MutationObserver | null = null;
  let currentTimeline: HTMLElement | null = null;

  /** (re)attach a MutationObserver to the main timeline node when it exists */
  const attachObserver = () => {
    const timeline = document.querySelector<HTMLElement>(TIMELINE_SEL);
    if (!timeline || timeline === currentTimeline) return; // nothing new

    // clean up the old observer if we found a fresh timeline node
    currentObserver?.disconnect();
    currentTimeline = timeline;

    currentObserver = new MutationObserver((muts) => {
      for (const mut of muts) {
        for (const node of Array.from(mut.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(TWEET_SEL)) handleNewTweet(node);
          node
            .querySelectorAll(TWEET_SEL)
            .forEach((t) => handleNewTweet(t as HTMLElement));
        }
      }
    });

    currentObserver.observe(currentTimeline, {
      childList: true,
      subtree: true,
    });
  };

  // Try immediately and keep polling every 2 s in case the timeline mounts late
  attachObserver();
  const pollId = setInterval(attachObserver, 2000);

  /* watch for SPA route changes that change location.href */
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      attachObserver();
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Clean up the polling interval on unload
  window.addEventListener("beforeunload", () => clearInterval(pollId));

  console.log("tweet watcher started");
}
