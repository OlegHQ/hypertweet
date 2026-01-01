import type { Page, RawScraperAPI } from './models';

export type InsertTextCallback = (text: string) => void;
export type ReplyFormCallback = (
  container: HTMLElement,
  insertText: InsertTextCallback
) => void;

export abstract class SocialPage {
  abstract readPage(): Promise<Page>;
  abstract insertReply(text: string): boolean;
  abstract onReplyFormRendered(callback: ReplyFormCallback): void;
}

type RawApiKey = '__twitter' | '__reddit' | '__linkedin';

export function createSocialPage(
  apiKey: RawApiKey,
  platformName: string
): SocialPage {
  const getAPI = (): RawScraperAPI => {
    const api = window[apiKey];
    if (!api) {
      throw new Error(`${platformName} raw API not loaded`);
    }
    return api;
  };

  return {
    readPage: () => getAPI().readPage(),
    insertReply: (text: string) => getAPI().insertReply(text),
    onReplyFormRendered(callback: ReplyFormCallback) {
      getAPI().onReplyFormRendered(container => {
        callback(container, text => this.insertReply(text));
      });
    },
  };
}
