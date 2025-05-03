import { browserApi } from "./browser-api";

browserApi.runtime.onMessage.addListener((message) => {
  if (message.action === "copyTweets") {
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
      return {
        status: getTweet(first!),
        replies: replies.map(getTweet),
      };
    })();

    return Promise.resolve(jsonThread);
  } else if (message.action === "scrapeProfile") {
    const name =
      document.querySelector('[data-testid="UserName"]')?.textContent?.trim() ||
      "";
    const username =
      document
        .querySelector('[data-testid="User-Name"] a[href^="/"]')
        ?.getAttribute("href")
        ?.slice(1) || "";
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

    return Promise.resolve({
      name,
      username,
      bio,
      location,
      website,
      joinDate,
      following,
      followers,
    });
  }
});
