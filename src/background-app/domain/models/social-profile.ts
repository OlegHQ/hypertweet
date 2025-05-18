export interface Tweet {
  id: string;
  from: string;
  text: string;
  time: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
  impressions: number;
}

export interface XProfile {
  id?: string;
  name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  following?: number;
  followers?: number;
  recentTweets?: Tweet[];
  totalSavedTweets?: number;
}

export interface LinkedInProfile {
  name: string;
  description: string;
  location: string;
  positions: string[];
  companies: string[];
}
