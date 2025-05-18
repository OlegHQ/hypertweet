


const TWEET_SEL = '[data-testid="tweet"]';
const collected = new Set<HTMLElement>();

function handleNewTweet(t: HTMLElement) {
  /* …same as before… */
}

let currentObserver: MutationObserver | null = null;
let currentTimeline: HTMLElement | null = null;

function attachObserver() {
  currentTimeline = document.querySelector<HTMLElement>(
    '[aria-label^="Timeline"]'
  );
  if (!currentTimeline) return;

  currentObserver = new MutationObserver((muts) => {
    muts.forEach((m) =>
      m.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches?.(TWEET_SEL)) handleNewTweet(n);
        n
          .querySelectorAll?.(TWEET_SEL)
          .forEach((t) => handleNewTweet(t as HTMLElement));
      })
    );
  });

  currentObserver.observe(currentTimeline, { childList: true, subtree: true });
}

function resetIfNeeded() {
  if (currentObserver) currentObserver.disconnect();
  collected.clear();
  attachObserver();
}

attachObserver();

/* watch for SPA route changes */
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    resetIfNeeded();
  }
}).observe(document.body, { childList: true, subtree: true });
