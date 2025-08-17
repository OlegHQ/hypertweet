const TWEET_CONTEXT =
  "You are composing a reply tweet. Output only the reply text, no greeting, no hashtags unless present in the post.";
const LINKEDIN_CONTEXT =
  "You are composing a reply to a LinkedIn post. Output only the reply text, no greeting, no hashtags unless present in the post.";
const REDDIT_CONTEXT =
  "You are composing a reply to a Reddit post. Output only the comment text. Be conversational and match the tone of the subreddit. No greetings or sign-offs unless contextually appropriate.";

export function getSiteContext(siteType: "twitter" | "linkedin" | "reddit") {
  switch (siteType) {
    case "twitter":
      return TWEET_CONTEXT;
    case "linkedin":
      return LINKEDIN_CONTEXT;
    case "reddit":
      return REDDIT_CONTEXT;
    default:
      return TWEET_CONTEXT;
  }
}
