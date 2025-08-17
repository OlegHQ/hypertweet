export interface RedditComment {
  author: string;
  comment: string;
  upvotes: number;
  tree?: RedditComment[];
}

export interface RedditPost {
  postTitle: string;
  author: string;
  body: string;
  comments: RedditComment[];
  url: string;
  subreddit: string;
}

export class RedditScraper {
  private maxDepth = 5;

  private commentElToObj(el: Element, depth: number, maxdepth: number): RedditComment | null {
    if (depth === maxdepth) {
      return null;
    }

    const author = el.querySelector(`[noun="comment_author"]`)?.textContent?.trim() ?? "";
    const comment = el.querySelector(`[slot="comment"]`)?.textContent?.trim() ?? "";
    
    // Navigate through shadow DOM to get upvotes
    const actionRow = el.querySelector("shreddit-comment-action-row");
    const upvotesText = actionRow?.shadowRoot?.querySelector(`[slot="vote-button"]`)
      ?.textContent?.trim() ?? "0";
    
    const upvotes = upvotesText
      .split(" ")
      .filter(x => x)
      .map(Number)
      .filter(x => !isNaN(x))
      .pop() ?? 0;

    const res: RedditComment = { author, comment, upvotes };
    
    const tree = this.genCommentTree(el, depth + 1, maxdepth);
    if (tree.length) {
      res.tree = tree;
    }
    
    return res;
  }

  private genCommentTree(parent: Element | Document = document, depth: number = 0, maxdepth: number = 5): RedditComment[] {
    const elems = Array.from(parent.querySelectorAll(`shreddit-comment[depth='${depth}']`));
    return elems
      .map(el => this.commentElToObj(el, depth, maxdepth))
      .filter((comment): comment is RedditComment => comment !== null);
  }

  extractPost(): RedditPost | null {
    try {
      const titleEl = document.querySelector("h1[slot=title]");
      const authorEl = document.querySelector("span[slot=authorName]");
      const bodyEl = document.querySelector('div[property="schema:articleBody"]');
      
      if (!titleEl || !authorEl) {
        console.log("Reddit post elements not found");
        return null;
      }

      const postTitle = titleEl.textContent?.trim() ?? "";
      const author = authorEl.textContent?.trim() ?? "";
      const body = bodyEl?.textContent?.trim() ?? "";
      
      // Extract subreddit from URL
      const urlParts = window.location.pathname.split('/');
      const subredditIndex = urlParts.indexOf('r');
      const subreddit = (subredditIndex !== -1 && urlParts[subredditIndex + 1]) ? urlParts[subredditIndex + 1] : "";
      
      const comments = this.genCommentTree(document, 0, this.maxDepth);

      return {
        postTitle,
        author,
        body,
        comments,
        url: window.location.href,
        subreddit: subreddit || ''
      };
    } catch (error) {
      console.error("Error extracting Reddit post:", error);
      return null;
    }
  }

  extractRecentComments(limit: number = 10): RedditComment[] {
    const comments = this.genCommentTree(document, 0, 1); // Only get top-level comments
    return comments.slice(0, limit);
  }

  findCommentTextarea(): HTMLElement | null {
    // TODO: Update this selector when we have the DOM structure
    // This is a placeholder for finding the comment textarea
    console.log("TODO: Implement findCommentTextarea with proper selectors");
    return null;
  }

  insertTextIntoCommentBox(text: string): boolean {
    // TODO: Implement this when we have the DOM structure for the comment box
    console.log("TODO: Implement insertTextIntoCommentBox", text);
    return false;
  }

  isRedditPost(): boolean {
    return window.location.hostname.includes('reddit.com') && 
           window.location.pathname.includes('/comments/');
  }

  isRedditFeed(): boolean {
    return window.location.hostname.includes('reddit.com') && 
           !window.location.pathname.includes('/comments/');
  }
}