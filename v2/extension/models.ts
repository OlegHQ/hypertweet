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

export type ReplyFormRenderedCallback = (container: HTMLElement) => void;

// Raw API interface - all platform scrapers implement this
export interface RawScraperAPI {
  readPage(): Promise<Page>;
  insertReply(text: string): boolean;
  onReplyFormRendered(callback: ReplyFormRenderedCallback): void;
}

// Global window augmentation for raw APIs
declare global {
  interface Window {
    __twitter?: RawScraperAPI;
    __reddit?: RawScraperAPI;
    __linkedin?: RawScraperAPI;
  }
}
