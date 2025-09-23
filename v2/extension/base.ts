import { Page } from './models';

export abstract class Scraper {
  abstract readPage(): Promise<Page>;
  abstract insertReply(text: string): boolean;
}
