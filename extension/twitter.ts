import { SocialPage, ReplyFormCallback } from './base';
import type { Page, RawScraperAPI } from './models';
import './twitter.raw.js';

function getAPI(): RawScraperAPI {
  const api = window.__twitter;
  if (!api) {
    throw new Error('Twitter raw API not loaded');
  }
  return api;
}

export class TwitterSocialPage extends SocialPage {
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
