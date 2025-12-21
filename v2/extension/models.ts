// Interfaces for page data - used by both raw JS and TypeScript
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
  replies?: Post[];
  time?: string;
  statusID?: string;
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
