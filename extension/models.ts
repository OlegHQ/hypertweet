// Interfaces for page data - used by both raw JS and TypeScript
// PascalCase keys to match server API
export interface User {
  UserName?: string;
  Email?: string;
  Name?: string;
  IsVerified?: boolean;
  Bio?: string;
  Location?: string;
  Website?: string;
  JoinDate?: string;
  Following?: number;
  Followers?: number;
}

export interface Post {
  Author: User;
  Text: string;
  CurrentReplyDraft?: string;
  Replies?: Post[];
  Time?: string;
  StatusID?: string;
  Url?: string;
  Upvotes?: number;
  CommentCount?: number;
  IsTopLevel?: boolean;
}

export interface Page {
  Site: string;
  Url: string;
  Posts: Post[];
  ActivePost?: Post;
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
