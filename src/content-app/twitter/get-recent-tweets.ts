import type { Tweet } from "src/background-app/domain";
import { extractTweet } from "./extract-tweet";

export const getRecentTweets = async (
  maxTweets: number | undefined,
  maxRetries = 3,
  delay = 1000,
  scroll = false
): Promise<Tweet[]> => {
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
        const res = extractTweet(tweet as HTMLElement);
        if (res) {
          return res[1];
        }
        return null;
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
