import { SocialPage, ReplyFormCallback } from './base';
import type { Page, RawScraperAPI } from './models';
import './reddit.raw.js';

function getAPI(): RawScraperAPI {
  const api = window.__reddit;
  if (!api) {
    throw new Error('Reddit raw API not loaded');
  }
  return api;
}

export class RedditSocialPage extends SocialPage {
  readPage(): Promise<Page> {
    return getAPI().readPage();
  }

  insertReply(text: string): boolean {
    return getAPI().insertReply(text);
  }

  onReplyFormRendered(callback: ReplyFormCallback): void {
    getAPI().onReplyFormRendered(container => {
      callback(container, text => this.insertReply(text));
    });
  }
}
