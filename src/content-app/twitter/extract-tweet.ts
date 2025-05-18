import type { Tweet } from "src/background-app/domain";

const getNumberFromText = (text: string) => {
  const num = text.replace(/[^0-9]/g, "");
  return num ? parseInt(num) : 0;
};

export function extractTweet(
  tweet: HTMLElement
): [string | null, Tweet] | null {
  const text =
    tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() || "";
  const time = tweet.querySelector("time")?.getAttribute("datetime") || "";
  const url =
    (tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement)?.href ||
    "";

  const profileName =
    tweet
      .querySelector(`[data-testid="User-Name"]`)
      ?.querySelector(`[role=link]`)
      ?.textContent?.trim() || "";

  const id = url
    .trim()
    .split("/")
    .reverse()
    .find((x) => !isNaN(Number(x)));

  const from = Array.from(
    tweet.querySelectorAll(`[data-testid="tweet"] [role="link"]`)
  )
    .map((x) => {
      const y = x?.textContent?.trim();
      if (y?.startsWith("@")) {
        return y.slice(1);
      }
      return null;
    })
    .filter((x) => x !== null)
    ?.pop();

  if (!from || !id) {
    return null;
  }

  const photoInside = tweet.querySelector('[data-testid="tweetPhoto"]');
  if (photoInside !== null) {
    return null;
  }
  // Get engagement metrics
  const getEngagementCount = (selector: string) => {
    const element = tweet.querySelector(selector);
    const text = element?.textContent?.trim() || "0";
    return getNumberFromText(text);
  };

  const getImpressions = () => {
    const num = Number(
      tweet
        .querySelector('a[href$="/analytics"]')
        ?.getAttribute("aria-label")
        ?.split(" ")
        .map((x) => {
          const y = Number(x);
          if (isNaN(y)) {
            return 0;
          }
          return y ?? 0;
        })
        .reduce((a, b) => (a > b ? a : b), 0)
    );
    return num;
  };

  return [
    profileName,
    {
      id,
      from,
      text,
      time,
      url,
      likes: getEngagementCount('[data-testid="like"]'),
      retweets: getEngagementCount('[data-testid="retweet"]'),
      replies: getEngagementCount('[data-testid="reply"]'),
      bookmarks: getEngagementCount('[data-testid="bookmark"]'),
      impressions: getImpressions(),
    },
  ];
}
