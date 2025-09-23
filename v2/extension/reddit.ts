import { Scraper } from './base';
import { Page, Post, User } from './models';

interface RedditComment {
  author: string;
  comment: string;
  upvotes: number;
  tree?: RedditComment[];
}

interface RedditPostData {
  postTitle: string;
  author: string;
  body: string;
  comments: RedditComment[];
  url: string;
  subreddit: string;
}

export class RedditScraper extends Scraper {
  private readonly maxDepth = 5;

  readPage(): Promise<Page> {
    const posts: Post[] = [];

    // Extract Reddit post data
    const postData = this.extractPost();
    if (postData) {
      const post = this.convertToPost(postData);
      if (post) {
        posts.push(post);

        // Add comments as replies
        if (postData.comments.length > 0) {
          post.replies = postData.comments.map(comment =>
            this.convertCommentToPost(comment)
          );
        }
      }
    }

    // Detect active post (where comment composer is visible)
    let activePost: Post | undefined;
    const composer = document.querySelector('shreddit-composer');
    if (composer && posts.length > 0) {
      activePost = posts[0]; // Main post is the one being commented on
    }

    const page = new Page(
      'reddit.com',
      window.location.href,
      posts,
      activePost
    );
    return Promise.resolve(page);
  }

  insertReply(text: string): boolean {
    // Find the Reddit comment composer
    const composer = document.querySelector('shreddit-composer');
    if (!composer) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Reddit composer not found');
      }
      return false;
    }

    // Find the contenteditable div with the textbox
    const textbox = composer.querySelector(
      'div[contenteditable="true"][role="textbox"]'
    );
    if (!textbox) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Textbox not found in composer');
      }
      return false;
    }

    try {
      // Clear existing content
      textbox.innerHTML = '';

      // Split text into lines for proper paragraph structure
      const lines = text.split('\n');

      lines.forEach(line => {
        // Create a paragraph element with the Reddit structure
        const paragraph = document.createElement('p');
        paragraph.className = 'first:mt-0 last:mb-0';
        paragraph.setAttribute('dir', 'ltr');

        if (line.trim()) {
          // Create the span with lexical-text attribute
          const span = document.createElement('span');
          span.setAttribute('data-lexical-text', 'true');
          span.textContent = line;
          paragraph.appendChild(span);
        } else {
          // Empty paragraph for blank lines
          paragraph.innerHTML = '<br>';
        }

        textbox.appendChild(paragraph);
      });

      // If text is empty, add a single paragraph with placeholder
      if (!text.trim()) {
        const paragraph = document.createElement('p');
        paragraph.className = 'first:mt-0 last:mb-0';
        paragraph.innerHTML = '<br>';
        textbox.appendChild(paragraph);
      }

      // Trigger input event to notify Reddit's JavaScript
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
        data: text,
      });
      textbox.dispatchEvent(inputEvent);

      // Focus the textbox
      (textbox as HTMLElement).focus();

      // Place cursor at the end
      const range = document.createRange();
      const selection = window.getSelection();
      if (textbox.lastChild) {
        range.selectNodeContents(textbox.lastChild);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to insert reply on Reddit:', error);
      }
      return false;
    }
  }

  private commentElToObj(
    el: Element,
    depth: number,
    maxdepth: number
  ): RedditComment | null {
    if (depth === maxdepth) {
      return null;
    }

    const author =
      el.querySelector(`[noun="comment_author"]`)?.textContent?.trim() ?? '';
    const comment =
      el.querySelector(`[slot="comment"]`)?.textContent?.trim() ?? '';

    // Navigate through shadow DOM to get upvotes
    const actionRow = el.querySelector('shreddit-comment-action-row');
    const upvotesText =
      actionRow?.shadowRoot
        ?.querySelector(`[slot="vote-button"]`)
        ?.textContent?.trim() ?? '0';

    const upvotes =
      upvotesText
        .split(' ')
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

  private genCommentTree(
    parent: Element | Document = document,
    depth = 0,
    maxdepth = 5
  ): RedditComment[] {
    const elems = Array.from(
      parent.querySelectorAll(`shreddit-comment[depth='${depth}']`)
    );
    return elems
      .map(el => this.commentElToObj(el, depth, maxdepth))
      .filter((comment): comment is RedditComment => comment !== null);
  }

  private extractPost(): RedditPostData | null {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Reddit Scraper] Extracting post data...');
    }
    try {
      const titleEl = document.querySelector('h1[slot=title]');
      const authorEl = document.querySelector('span[slot=authorName]');
      const bodyEl = document.querySelector(
        'div[property="schema:articleBody"]'
      );

      if (!titleEl || !authorEl) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Reddit Scraper] Required post elements not found');
        }
        return null;
      }

      const postTitle = titleEl.textContent?.trim() ?? '';
      const author = authorEl.textContent?.trim() ?? '';
      const body = bodyEl?.textContent?.trim() ?? '';

      // Extract subreddit from URL
      const urlParts = window.location.pathname.split('/');
      const subredditIndex = urlParts.indexOf('r');
      const subreddit =
        subredditIndex !== -1 && urlParts[subredditIndex + 1]
          ? urlParts[subredditIndex + 1]
          : '';

      // Extract comments
      const comments = this.genCommentTree(document, 0, this.maxDepth);

      const result = {
        postTitle,
        author,
        body,
        comments,
        url: window.location.href,
        subreddit: subreddit ?? '',
      };

      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Reddit Scraper] Error extracting Reddit post:', error);
      }
      return null;
    }
  }

  private convertToPost(postData: RedditPostData): Post | null {
    if (!postData?.postTitle) {
      return null;
    }

    const user = new User({
      name: postData.author,
      userName: postData.author,
    });

    const post = new Post(user, postData.body || postData.postTitle, {
      url: postData.url,
    });

    return post;
  }

  private convertCommentToPost(comment: RedditComment): Post {
    const user = new User({
      name: comment.author,
      userName: comment.author,
    });

    const post = new Post(user, comment.comment, {
      upvotes: comment.upvotes,
      isTopLevel: true,
    });

    // Convert nested comments to replies
    if (comment.tree && comment.tree.length > 0) {
      post.replies = comment.tree.map(nestedComment =>
        this.convertCommentToPost(nestedComment)
      );
    }

    return post;
  }
}
