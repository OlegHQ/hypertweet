import type { Tweet, XProfile, LinkedInProfile } from "../background-app/data";

const getRecentTweets = async (
  maxRetries = 3,
  delay = 1000
): Promise<Tweet[]> => {
  const getNumberFromText = (text: string) => {
    const num = text.replace(/[^0-9]/g, "");
    return num ? parseInt(num) : 0;
  };

  const getTweets = (): Tweet[] => {
    const tweetElements = Array.from(
      document.querySelectorAll('[data-testid="tweet"]')
    ).slice(0, 5); // Get only first 5 tweets

    return tweetElements.map((tweet) => {
      const text =
        tweet.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ||
        "";
      const time = tweet.querySelector("time")?.getAttribute("datetime") || "";
      const url =
        (tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement)
          ?.href || "";

      // Get engagement metrics
      const getEngagementCount = (selector: string) => {
        const element = tweet.querySelector(selector);
        const text = element?.textContent?.trim() || "0";
        return getNumberFromText(text);
      };

      return {
        text,
        time,
        url,
        likes: getEngagementCount('[data-testid="like"]'),
        retweets: getEngagementCount('[data-testid="retweet"]'),
        replies: getEngagementCount('[data-testid="reply"]'),
      };
    });
  };

  // Initial attempt
  let tweets = getTweets();
  if (tweets.length > 0) {
    return tweets;
  }

  // Retry with delay if no tweets found
  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay));
    tweets = getTweets();
    if (tweets.length > 0) {
      return tweets;
    }
  }

  return [];
};

const linkedInRules = {
  fullName: ".artdeco-card h1",
  description: `.artdeco-card:nth-child(1) .ph5 div[data-generated-suggestion-target^="urn:li:fsu_profileActionDelegate"]`,
  location:
    ".artdeco-card span.text-body-small.inline.t-black--light.break-words",
  experiencePosition: `[data-field="experience_company_logo"].full-width div.full-height span[aria-hidden="true"]`,
  experienceCompany: `[data-field="experience_company_logo"].full-width span.t-normal:nth-child(2) span[aria-hidden="true"]`,
};

export type ContentApp = ReturnType<typeof makeContentApp>;

export function makeContentApp() {
  return {
    async copyTweets() {
      const jsonThread = (() => {
        function getTweet(tweet: HTMLElement) {
          const name = tweet.querySelector("[data-testid=User-Name] a");
          const isVerified = !!name?.querySelector(
            "[data-testid=icon-verified]"
          );
          const profileName = name?.textContent;
          const username = name?.getAttribute("href")?.split("/").pop();
          const tweetText = tweet.querySelector(
            "[data-testid=tweetText]"
          )?.textContent;
          const time = tweet.querySelector("time")?.getAttribute("datetime");
          const url =
            (
              tweet.querySelector(
                `a[href*="/status/"]`
              ) as HTMLAnchorElement | null
            )?.href ?? "";
          const statusID = url?.split("/").pop();

          const tweetObj: any = {};
          tweetObj.profileName = profileName;
          if (username) {
            tweetObj.username = "@" + username;
          }
          tweetObj.isVerified = isVerified;
          tweetObj.text = tweetText;
          tweetObj.time = time;
          tweetObj.statusID = statusID;
          return tweetObj;
        }
        const [first, ...replies] = Array.from(
          document.querySelectorAll("[data-testid=tweet]")
        ) as HTMLElement[];
        const responseContainer = document.querySelector(
          ".public-DraftStyleDefault-block"
        )?.parentElement?.children;

        const replyLines: string[] = [];
        if (responseContainer) {
          for (let i = 0; i < responseContainer.length; i++) {
            const reply = responseContainer.item(i);
            if (reply?.textContent?.trim() === "") {
              continue;
            }
            replyLines.push(reply?.textContent?.trim() ?? "");
          }
        }
        return {
          status: getTweet(first!),
          replies: replies.map(getTweet),
          currentResponse: replyLines.length
            ? replyLines.join("\n")
            : undefined,
        };
      })();

      return jsonThread;
    },
    async scrapeProfile() {
      const nameAndUsername =
        document
          .querySelector('[data-testid="UserName"]')
          ?.textContent?.trim() || "";
      const [name, username] = nameAndUsername
        .split("@")
        .filter((x) => x != "")
        .map((x) => x.trim());
      const bio = document
        .querySelector('[data-testid="UserDescription"]')
        ?.textContent?.trim();
      const location = document
        .querySelector('[data-testid="UserLocation"]')
        ?.textContent?.trim();
      const website = document
        .querySelector('[data-testid="UserUrl"]')
        ?.textContent?.trim();
      const joinDate = document
        .querySelector('[data-testid="UserJoinDate"]')
        ?.textContent?.trim();

      // Get following and followers counts
      const followingElement = document.querySelector(
        'a[href$="/following"] span'
      );
      const followersElement = document.querySelector(
        'a[href$="/followers"] span'
      );

      const following = followingElement
        ? parseInt(followingElement.textContent?.replace(/,/g, "") || "0")
        : undefined;
      const followers = followersElement
        ? parseInt(followersElement.textContent?.replace(/,/g, "") || "0")
        : undefined;

      return getRecentTweets().then((recentTweets) => {
        const profile: XProfile = {
          name: name ?? "",
          username: username ?? "",
          bio,
          location,
          website,
          joinDate,
          following,
          followers,
          recentTweets,
        };
        return profile;
      });
    },
    async scrapeLinkedInProfile() {
      const getTextContent = (selector: string) =>
        document.querySelector(selector)?.textContent?.trim() || "";

      const getPositions = () => {
        const positionElements = document.querySelectorAll(
          linkedInRules.experiencePosition
        );
        return Array.from(positionElements).map(
          (el) => el.textContent?.trim() || ""
        );
      };

      const getCompanies = () => {
        const companyElements = document.querySelectorAll(
          linkedInRules.experienceCompany
        );
        return Array.from(companyElements).map(
          (el) => (el.textContent?.trim() || "").split("·")[0]?.trim() ?? "n/a"
        );
      };

      const profile: LinkedInProfile = {
        name: getTextContent(linkedInRules.fullName),
        description: getTextContent(linkedInRules.description),
        location: getTextContent(linkedInRules.location),
        positions: Array.from(new Set(getPositions())).filter(
          (x) => x != "" && x != "n/a"
        ),
        companies: Array.from(new Set(getCompanies())).filter(
          (x) => x != "" && x != "n/a"
        ),
      };

      return profile;
    },
  };
}
