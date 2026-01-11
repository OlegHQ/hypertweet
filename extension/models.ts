// Interfaces for page data - used by both raw JS and TypeScript
// camelCase keys to match server JSON API
export interface User {
  userName?: string;
  email?: string;
  name?: string;
  isVerified?: boolean;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  following?: number;
  followers?: number;
}

export interface Post {
  author: User;
  text: string;
  currentReplyDraft?: string;
  replies?: Post[];
  time?: string;
  statusId?: string;
  url?: string;
  upvotes?: number;
  commentCount?: number;
  isTopLevel?: boolean;
}

export interface Page {
  site: string;
  url: string;
  posts: Post[];
  activePost?: Post;
}

// Raw API insert callback type - editor-specific insert function
export type RawInsertTextCallback = (text: string) => boolean;

// Raw API readPage callback type - editor-specific page reader
export type RawReadPageCallback = () => Promise<Page>;

// Raw API callback signature - receives container, editor-specific insert and readPage
export type RawReplyFormRenderedCallback = (
  container: HTMLElement,
  insertText: RawInsertTextCallback,
  readPage: RawReadPageCallback
) => void;

// Callback for when reply form is rendered - receives container, insert function and readPage
export type ReplyFormRenderedCallback = (
  container: HTMLElement,
  insertText: (text: string) => boolean,
  readPage: () => Promise<Page>
) => void;

// Raw API interface - all platform scrapers implement this
export interface RawScraperAPI {
  readPage(): Promise<Page>;
  insertReply(text: string): boolean;
  onReplyFormRendered(callback: RawReplyFormRenderedCallback): void;
}

// Global window augmentation for raw APIs
declare global {
  interface Window {
    __twitter?: RawScraperAPI;
    __reddit?: RawScraperAPI;
    __linkedin?: RawScraperAPI;
  }
}
