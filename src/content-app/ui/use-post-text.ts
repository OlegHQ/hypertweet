import { useCallback } from "react";
import { useSiteType } from "./use-site-type";
import { TwitterScraper } from "../twitter/twitter-scraper";
import { RedditScraper } from "../reddit/reddit-scraper";
import { LinkedInScraper } from "../linkedin/linkedin-scraper";
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

    if (siteType === "reddit") {
      const post = new RedditScraper().extractPost();
      
      if (!post) {
        return null;
      }

      return {
        authorName: post.author,
        authorUsername: post.author,
        postText: `${post.postTitle}\n\n${post.body}`.trim(),
        replies: post.comments.slice(0, 5).map((comment) => ({
          authorName: comment.author,
          authorUsername: comment.author,
          postText: comment.comment,
        })),
        currentReply: null,
      };
    }

    if (siteType === "linkedin") {
      const linkedInPost = await new LinkedInScraper().extractPost();
      
      if (!linkedInPost) {
        return null;
      }

      return {
        authorName: linkedInPost.authorName,
        authorUsername: linkedInPost.authorUsername,
        postText: linkedInPost.postText,
        replies: [], // LinkedIn comment extraction would be more complex
        currentReply: linkedInPost.currentReply,
      };
    }

    return null;
  }, [siteType]);
  return loadPostContent;
}
