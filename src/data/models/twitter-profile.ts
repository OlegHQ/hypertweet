export interface Tweet {
  text: string;
  time: string;
  url: string;
  likes: number;
  retweets: number;
  replies: number;
}

export interface XProfile {
  name: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  joinDate?: string;
  following?: number;
  followers?: number;
  recentTweets?: Tweet[];
}
