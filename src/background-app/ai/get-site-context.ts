const TWEET_CONTEXT =
  "You are composing a reply tweet. Output only the reply text, no greeting, no hashtags unless present in the post.";
const LINKEDIN_CONTEXT =
  "You are composing a reply to a LinkedIn post. Output only the reply text, no greeting, no hashtags unless present in the post.";

export function getSiteContext(siteType: "twitter" | "linkedin") {
  return siteType === "twitter" ? TWEET_CONTEXT : LINKEDIN_CONTEXT;
}
