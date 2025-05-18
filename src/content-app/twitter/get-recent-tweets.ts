import type { Tweet } from "src/background-app/domain";

export const getRecentTweets = async (
  maxTweets: number | undefined,
  maxRetries = 3,
  delay = 1000,
  scroll = false
): Promise<Tweet[]> => {
  const getNumberFromText = (text: string) => {
    const num = text.replace(/[^0-9]/g, "");
    return num ? parseInt(num) : 0;
  };

  const getTweets = async (): Promise<Tweet[]> => {
    if (scroll) {
      /// need to scroll down 10* screen heights viewports
      const screenHeight = window.innerHeight;
      for (let i = 0; i < 15; i++) {
        window.scrollTo(0, screenHeight * i);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    let tweetElements = Array.from(
      document.querySelectorAll('[data-testid="tweet"]')
    );

    if (maxTweets) {
      tweetElements = tweetElements.slice(0, maxTweets);
    }
    return tweetElements
      .map((tweet) => {
        const text = tweet
          .querySelector('[data-testid="tweetText"]')
          ?.textContent?.trim() || "";
        const time = tweet.querySelector("time")?.getAttribute("datetime") || "";
        const url = (tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement)
          ?.href || "";

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

        return {
          text,
          time,
          url,
          likes: getEngagementCount('[data-testid="like"]'),
          retweets: getEngagementCount('[data-testid="retweet"]'),
          replies: getEngagementCount('[data-testid="reply"]'),
          bookmarks: getEngagementCount('[data-testid="bookmark"]'),
          impressions: getImpressions(),
        };
      })
      .filter((x) => x) as Tweet[];
  };

  // Initial attempt
  let tweets = await getTweets();
  if (tweets.length > 0) {
    return tweets;
  }

  // Retry with delay if no tweets found
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    tweets = await getTweets();
    if (tweets.length > 0) {
      return tweets;
    }
  }

  return [];
};
