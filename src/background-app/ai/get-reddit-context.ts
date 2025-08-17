import type { RedditPost, RedditComment } from "src/content-app/reddit/reddit-scraper";

export interface RedditContext {
  postTitle: string;
  postAuthor: string;
  postBody: string;
  subreddit: string;
  topComments: string[];
  url: string;
}

function formatComment(comment: RedditComment, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  let formatted = `${indent}@${comment.author} (${comment.upvotes} upvotes): ${comment.comment}`;
  
  if (comment.tree && comment.tree.length > 0) {
    const replies = comment.tree
      .slice(0, 2) // Only include first 2 replies to avoid too much context
      .map(reply => formatComment(reply, depth + 1))
      .join("\n");
    formatted += "\n" + replies;
  }
  
  return formatted;
}

export function extractRedditContext(post: RedditPost | null): RedditContext | null {
  if (!post) {
    return null;
  }

  // Get top comments with some replies for context
  const topComments = post.comments
    .slice(0, 5) // Get top 5 comments
    .map(comment => formatComment(comment));

  return {
    postTitle: post.postTitle,
    postAuthor: post.author,
    postBody: post.body,
    subreddit: post.subreddit,
    topComments,
    url: post.url,
  };
}

export function formatRedditContextForPrompt(context: RedditContext): string {
  const parts = [
    `Reddit Post: r/${context.subreddit}`,
    `Title: ${context.postTitle}`,
    `Author: u/${context.postAuthor}`,
  ];

  if (context.postBody) {
    parts.push(`\nPost Content:\n${context.postBody}`);
  }

  if (context.topComments.length > 0) {
    parts.push(`\nTop Comments:\n${context.topComments.join("\n\n")}`);
  }

  return parts.join("\n");
}