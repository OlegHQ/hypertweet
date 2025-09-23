export class Page {
  public readonly baseHost: string;
  public readonly url: string;
  public posts?: Post[];
  public activePost?: Post;

  constructor(
    baseHost: string,
    url: string,
    posts?: Post[],
    activePost?: Post
  ) {
    this.baseHost = baseHost;
    this.url = url;
    if (posts !== undefined) this.posts = posts;
    if (activePost !== undefined) this.activePost = activePost;
  }
}

export class User {
  public userName?: string;
  public email?: string;
  public name?: string;
  public isVerified?: boolean;
  public bio?: string;
  public location?: string;
  public website?: string;
  public joinDate?: string;
  public following?: number;
  public followers?: number;

  constructor(data: Partial<User> = {}) {
    Object.assign(this, data);
  }
}

export class Post {
  public readonly author: User;
  public readonly text: string;
  public replies?: Post[];
  public time?: string;
  public statusID?: string;
  public url?: string;
  public upvotes?: number;
  public commentCount?: number;
  public isTopLevel?: boolean;

  constructor(
    author: User,
    text: string,
    options: {
      replies?: Post[];
      time?: string;
      statusID?: string;
      url?: string;
      upvotes?: number;
      commentCount?: number;
      isTopLevel?: boolean;
    } = {}
  ) {
    this.author = author;
    this.text = text;
    Object.assign(this, options);
  }
}
