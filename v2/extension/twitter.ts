import { Scraper } from './base';
import { Page, Post, User } from './models';

interface TweetData {
  profileName?: string;
  isVerified: boolean;
  text?: string;
  time?: string;
  statusID?: string;
  username?: string;
}

export class TwitterScraper extends Scraper {
  readPage(): Promise<Page> {
    const posts: Post[] = [];

    // Extract tweets from current page
    const jsonThread = this.extractTweetsFromPage();

    if (jsonThread.status) {
      // Add main tweet
      const mainPost = this.convertToPost(jsonThread.status);
      if (mainPost) {
        posts.push(mainPost);
      }

      // Add reply tweets
      if (jsonThread.replies) {
        const replyPosts = jsonThread.replies
          .map(reply => this.convertToPost(reply))
          .filter(post => post !== null);

        if (mainPost) {
          mainPost.replies = replyPosts;
        } else {
          posts.push(...replyPosts);
        }
      }
    }

    // Detect active post (where reply form is visible)
    let activePost: Post | undefined;
    const replyForm = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (replyForm && posts.length > 0) {
      activePost = posts[0]; // First post is typically the one being replied to
    }

    const page = new Page('x.com', window.location.href, posts, activePost);
    return Promise.resolve(page);
  }

  insertReply(text: string): boolean {
    const editor = document.querySelector(
      'div[contenteditable="true"][data-testid="tweetTextarea_0"]'
    );

    if (!editor) {
      if (process.env['NODE_ENV'] === 'development') {
        console.warn('Twitter reply editor not found');
      }
      return false;
    }

    try {
      (editor as HTMLElement).focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);

      document.execCommand('selectAll', false, undefined);
      document.execCommand('insertText', false, text);

      return true;
    } catch (error) {
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Failed to insert reply on Twitter:', error);
      }
      return false;
    }
  }

  private extractTweetsFromPage(): {
    status: TweetData | null;
    replies: TweetData[];
    currentResponse?: string;
  } {
    function getTweet(tweet: HTMLElement): TweetData {
      const name = tweet.querySelector('[data-testid=User-Name] a');
      const isVerified = !!name?.querySelector('[data-testid=icon-verified]');
      const profileName = name?.textContent;
      const username = name?.getAttribute('href')?.split('/').pop();
      const tweetText = tweet.querySelector(
        '[data-testid=tweetText]'
      )?.textContent;
      const time = tweet.querySelector('time')?.getAttribute('datetime');
      const linkElement = tweet.querySelector(`a[href*="/status/"]`);
      const url = (linkElement as HTMLLinkElement)?.href ?? '';
      const statusID = url.split('/').pop();

      const result: TweetData = {
        isVerified,
      };

      if (profileName) result.profileName = profileName;
      if (tweetText) result.text = tweetText;
      if (time) result.time = time;
      if (statusID) result.statusID = statusID;
      if (username) result.username = `@${username}`;

      return result;
    }

    const tweets = Array.from(document.querySelectorAll('[data-testid=tweet]'));
    const [first, ...replies] = tweets;

    const responseContainer = document.querySelector(
      `[data-testid="tweetTextarea_0"]`
    )?.parentElement?.children;

    const replyLines: string[] = [];
    if (responseContainer) {
      for (let i = 0; i < responseContainer.length; i++) {
        const reply = responseContainer.item(i);
        if (reply?.textContent?.trim() === '') {
          continue;
        }
        replyLines.push(reply?.textContent?.trim() ?? '');
      }
    }

    const result = {
      status: first ? getTweet(first as HTMLElement) : null,
      replies: replies.map(tweet => getTweet(tweet as HTMLElement)),
    } as {
      status: TweetData | null;
      replies: TweetData[];
      currentResponse?: string;
    };

    if (replyLines.length > 0) {
      result.currentResponse = replyLines.join('\n');
    }

    return result;
  }

  private convertToPost(tweetData: TweetData): Post | null {
    if (!tweetData?.text) {
      return null;
    }

    const userData: Partial<User> = {
      isVerified: tweetData.isVerified,
    };
    if (tweetData.profileName) userData.name = tweetData.profileName;
    if (tweetData.username) userData.userName = tweetData.username;

    const user = new User(userData);

    const postOptions: {
      time?: string;
      statusID?: string;
    } = {};
    if (tweetData.time) postOptions.time = tweetData.time;
    if (tweetData.statusID) postOptions.statusID = tweetData.statusID;

    const post = new Post(user, tweetData.text, postOptions);

    return post;
  }
}
