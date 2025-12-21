import { SocialPage, ReplyFormCallback } from './base';
import type { Page, RawScraperAPI } from './models';
import './linkedin.raw.js';

function getAPI(): RawScraperAPI {
  const api = window.__linkedin;
  if (!api) {
    throw new Error('LinkedIn raw API not loaded');
  }
  return api;
}

export class LinkedInSocialPage extends SocialPage {
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
