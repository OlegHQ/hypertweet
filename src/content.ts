import { browserApi } from "./browser-api";
import type { LinkedInProfile } from "./data/models/linkedin-profile";

const linkedInRules = {
  fullName: ".artdeco-card h1",
  description: `.artdeco-card:nth-child(1) .ph5 div[data-generated-suggestion-target^="urn:li:fsu_profileActionDelegate"]`,
  location:
    ".artdeco-card span.text-body-small.inline.t-black--light.break-words",
  experiencePosition: `[data-field="experience_company_logo"].full-width div.full-height span[aria-hidden="true"]`,
  experienceCompany: `[data-field="experience_company_logo"].full-width span.t-normal:nth-child(2) span[aria-hidden="true"]`,
};

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
  } else if (message.action === "scrapeLinkedInProfile") {
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

    return Promise.resolve(profile);
  }
});
