import { useCallback } from "react";
import { useSiteType } from "./use-site-type";
import { TwitterScraper } from "../twitter/twitter-scraper";
import type { PostContent } from "../types";

export default function usePostText() {
  const siteType = useSiteType();
  const loadPostContent = useCallback(async (): Promise<PostContent | null> => {
    if (siteType === "debugging") {
      return {
        authorName: "John Doe",
        authorUsername: "john_doe",
        postText: "This is a test post",
        replies: [],
        currentReply: null,
      };
    }

    if (siteType === "twitter") {
      const thread = await new TwitterScraper().copyTweets();
      const result = {
        authorName: thread.status.profileName,
        authorUsername: thread.status.username,
        postText: thread.status.text ?? "",
        replies: thread.replies
          .map((status) => {
            return {
              authorName: status.profileName,
              authorUsername: status.username,
              postText: status.text ?? "",
            };
          })
          .filter((x) => x.postText !== ""),
        currentReply: thread.currentResponse ?? null,
      };
      if (result.postText === "") {
        return null;
      }
      return result;
    }
    return null;
  }, [siteType]);
  return loadPostContent;
}
