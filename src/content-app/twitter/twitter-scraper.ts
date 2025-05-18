import type { XProfile } from "src/background-app/domain";
import { getRecentTweets } from "./get-recent-tweets";

export class TwitterScraper {
  async copyTweets() {
    const jsonThread = (() => {
      function getTweet(tweet: HTMLElement) {
        const name = tweet.querySelector("[data-testid=User-Name] a");
        const isVerified = !!name?.querySelector("[data-testid=icon-verified]");
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
        `[data-testid="tweetTextarea_0"]`
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
        currentResponse: replyLines.length ? replyLines.join("\n") : undefined,
      };
    })();

    return jsonThread;
  }
  async scrapeProfile(numberOfTweets?: number) {
    const nameAndUsername =
      document.querySelector('[data-testid="UserName"]')?.textContent?.trim() ||
      "";
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

    return getRecentTweets(
      numberOfTweets,
      1,
      1000,
      numberOfTweets ? true : false
    ).then((recentTweets) => {
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
  }
}
