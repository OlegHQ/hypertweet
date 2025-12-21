import { Page } from './models';

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
