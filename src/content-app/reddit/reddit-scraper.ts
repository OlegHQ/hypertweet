export interface RedditComment {
  author: string;
  comment: string;
  upvotes: number;
  tree?: RedditComment[];
}

export interface RedditPost {
  postTitle: string;
  author: string;
  body: string;
  comments: RedditComment[];
  url: string;
  subreddit: string;
}

export interface PostMetrics {
  upvotes: number;
  commentCount: number;
  timeAgo: string;
  engagement: 'low' | 'medium' | 'high';
}

export interface SubredditCulture {
  formalityLevel: 'casual' | 'semi-formal' | 'formal';
  humorStyle: 'witty' | 'memes' | 'dry' | 'supportive';
  communityValues: string[];
}

export interface SubredditContext {
  name: string;
  description: string;
  category: string;
  rules: string[];
  culture: SubredditCulture;
}

export interface RedditThreadContext {
  post: {
    title: string;
    author: string;
    body: string;
    subreddit: string;
    url: string;
    metrics: PostMetrics;
  };
  topComments: {
    author: string;
    text: string;
    upvotes: number;
    isTopLevel: boolean;
  }[];
  recentComments: {
    author: string;
    text: string;
    upvotes: number;
    isTopLevel: boolean;
  }[];
  subredditContext: SubredditContext;
  currentUserInput: string;
}

export class RedditScraper {
  private maxDepth = 5;

  private commentElToObj(el: Element, depth: number, maxdepth: number): RedditComment | null {
    if (depth === maxdepth) {
      return null;
    }

    const author = el.querySelector(`[noun="comment_author"]`)?.textContent?.trim() ?? "";
    const comment = el.querySelector(`[slot="comment"]`)?.textContent?.trim() ?? "";
    
    // Navigate through shadow DOM to get upvotes
    const actionRow = el.querySelector("shreddit-comment-action-row");
    const upvotesText = actionRow?.shadowRoot?.querySelector(`[slot="vote-button"]`)
      ?.textContent?.trim() ?? "0";
    
    const upvotes = upvotesText
      .split(" ")
      .filter(x => x)
      .map(Number)
      .filter(x => !isNaN(x))
      .pop() ?? 0;

    const res: RedditComment = { author, comment, upvotes };
    
    const tree = this.genCommentTree(el, depth + 1, maxdepth);
    if (tree.length) {
      res.tree = tree;
    }
    
    return res;
  }

  private genCommentTree(parent: Element | Document = document, depth: number = 0, maxdepth: number = 5): RedditComment[] {
    const elems = Array.from(parent.querySelectorAll(`shreddit-comment[depth='${depth}']`));
    return elems
      .map(el => this.commentElToObj(el, depth, maxdepth))
      .filter((comment): comment is RedditComment => comment !== null);
  }

  extractPost(): RedditPost | null {
    console.log('[Reddit Scraper] Extracting post data...');
    try {
      const titleEl = document.querySelector("h1[slot=title]");
      const authorEl = document.querySelector("span[slot=authorName]");
      const bodyEl = document.querySelector('div[property="schema:articleBody"]');
      
      console.log('[Reddit Scraper] DOM elements found:', {
        hasTitle: !!titleEl,
        hasAuthor: !!authorEl,
        hasBody: !!bodyEl,
        titleText: titleEl?.textContent?.trim(),
        authorText: authorEl?.textContent?.trim()
      });
      
      if (!titleEl || !authorEl) {
        console.warn("[Reddit Scraper] Required post elements not found");
        return null;
      }

      const postTitle = titleEl.textContent?.trim() ?? "";
      const author = authorEl.textContent?.trim() ?? "";
      const body = bodyEl?.textContent?.trim() ?? "";
      
      // Extract subreddit from URL
      const urlParts = window.location.pathname.split('/');
      const subredditIndex = urlParts.indexOf('r');
      const subreddit = (subredditIndex !== -1 && urlParts[subredditIndex + 1]) ? urlParts[subredditIndex + 1] : "";
      
      // Use the single comment tree implementation
      console.log('[Reddit Scraper] Extracting comments...');
      const comments = this.genCommentTree(document, 0, this.maxDepth);
      console.log('[Reddit Scraper] Comments extracted:', comments.length);
      
      const result = {
        postTitle,
        author,
        body,
        comments,
        url: window.location.href,
        subreddit: subreddit || ''
      };
      
      console.log('[Reddit Scraper] Post extraction successful:', {
        title: postTitle,
        author,
        subreddit,
        commentsCount: comments.length,
        bodyLength: body.length
      });
      
      return result;
    } catch (error) {
      console.error("[Reddit Scraper] Error extracting Reddit post:", error);
      console.error("[Reddit Scraper] Error stack:", error.stack);
      return null;
    }
  }

  extractRecentComments(limit: number = 10): RedditComment[] {
    const comments = this.genCommentTree(document, 0, 1); // Only get top-level comments
    return comments.slice(0, limit);
  }

  findCommentTextarea(): HTMLElement | null {
    // TODO: Update this selector when we have the DOM structure
    // This is a placeholder for finding the comment textarea
    console.log("TODO: Implement findCommentTextarea with proper selectors");
    return null;
  }

  insertTextIntoCommentBox(text: string): boolean {
    // TODO: Implement this when we have the DOM structure for the comment box
    console.log("TODO: Implement insertTextIntoCommentBox", text);
    return false;
  }

  isRedditPost(): boolean {
    return window.location.hostname.includes('reddit.com') && 
           window.location.pathname.includes('/comments/');
  }

  isRedditFeed(): boolean {
    return window.location.hostname.includes('reddit.com') && 
           !window.location.pathname.includes('/comments/');
  }

  /**
   * Extract full Reddit thread context for complex mode
   * Returns structured data similar to Twitter thread format
   */
  extractRedditThread(): RedditThreadContext | null {
    console.log('[Reddit Scraper] Starting Reddit thread extraction...');
    
    const post = this.extractPost();
    console.log('[Reddit Scraper] Post extraction result:', {
      hasPost: !!post,
      title: post?.postTitle,
      author: post?.author,
      subreddit: post?.subreddit
    });
    
    if (!post) {
      console.warn('[Reddit Scraper] No post data available');
      return null;
    }

    // Get top comments for context (sorted by relevance/upvotes)
    console.log('[Reddit Scraper] Getting top comments...');
    const topComments = this.getTopComments(10);
    console.log('[Reddit Scraper] Top comments found:', topComments.length);
    
    // Get recent comments for engagement patterns
    console.log('[Reddit Scraper] Getting recent comments...');
    const recentComments = this.extractRecentComments(5);
    console.log('[Reddit Scraper] Recent comments found:', recentComments.length);
    
    // Extract engagement metrics
    console.log('[Reddit Scraper] Extracting engagement metrics...');
    const metrics = this.extractEngagementMetrics();
    console.log('[Reddit Scraper] Metrics extracted:', metrics);
    
    const subredditContext = this.getSubredditContext(post.subreddit);
    const currentUserInput = this.getCurrentUserInput();
    
    const result = {
      post: {
        title: post.postTitle,
        author: post.author,
        body: post.body,
        subreddit: post.subreddit,
        url: post.url,
        metrics
      },
      topComments: topComments.map(comment => ({
        author: comment.author,
        text: comment.comment,
        upvotes: comment.upvotes,
        isTopLevel: true
      })),
      recentComments: recentComments.map(comment => ({
        author: comment.author,
        text: comment.comment,
        upvotes: comment.upvotes,
        isTopLevel: true
      })),
      subredditContext,
      currentUserInput
    };
    
    console.log('[Reddit Scraper] Thread extraction complete:', {
      postTitle: result.post.title,
      topCommentsCount: result.topComments.length,
      recentCommentsCount: result.recentComments.length,
      subreddit: result.subredditContext.name,
      hasUserInput: !!result.currentUserInput
    });
    
    return result;
  }

  private getTopComments(limit: number = 10): RedditComment[] {
    const allComments = this.genCommentTree(document, 0, 2); // Get 2 levels deep
    
    // Sort by upvotes and relevance (prioritize longer, substantive comments)
    return allComments
      .filter(comment => comment.comment.length > 20) // Filter out short comments
      .sort((a, b) => {
        // Score based on upvotes and comment length
        const scoreA = a.upvotes + (a.comment.length / 10);
        const scoreB = b.upvotes + (b.comment.length / 10);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  private extractEngagementMetrics(): PostMetrics {
    try {
      // Extract upvotes/downvotes from post
      const voteSection = document.querySelector('shreddit-post')?.shadowRoot
        ?.querySelector('[slot="vote-button"]');
      
      const voteText = voteSection?.textContent?.trim() || '0';
      const upvotes = parseInt(voteText.replace(/[^0-9]/g, '')) || 0;
      
      // Count total comments
      const commentCount = this.genCommentTree(document, 0, 10).length;
      
      // Extract post age
      const timeElement = document.querySelector('[slot="timestamp"]');
      const timeAgo = timeElement?.textContent?.trim() || '';
      
      return {
        upvotes,
        commentCount,
        timeAgo,
        engagement: this.calculateEngagementLevel(upvotes, commentCount)
      };
    } catch (error) {
      console.error('Error extracting metrics:', error);
      return {
        upvotes: 0,
        commentCount: 0,
        timeAgo: '',
        engagement: 'low'
      };
    }
  }

  private calculateEngagementLevel(upvotes: number, commentCount: number): 'low' | 'medium' | 'high' {
    const totalEngagement = upvotes + (commentCount * 2); // Weight comments higher
    
    if (totalEngagement > 1000) return 'high';
    if (totalEngagement > 100) return 'medium';
    return 'low';
  }

  private getSubredditContext(subreddit: string): SubredditContext {
    // Extract basic subreddit info from current page
    const subredditDescription = document.querySelector('[data-testid="subreddit-sidebar"] p')?.textContent?.trim() || '';
    
    // Determine subreddit category based on common patterns
    const category = this.categorizeSubreddit(subreddit);
    
    return {
      name: subreddit,
      description: subredditDescription,
      category,
      rules: [], // Could be enhanced to scrape subreddit rules
      culture: this.inferSubredditCulture(subreddit)
    };
  }

  private categorizeSubreddit(subreddit: string): string {
    const techSubs = ['programming', 'javascript', 'python', 'technology', 'coding', 'webdev'];
    const newsSubs = ['news', 'worldnews', 'politics', 'science'];
    const entertainmentSubs = ['movies', 'television', 'music', 'gaming', 'books'];
    const discussionSubs = ['askreddit', 'explainlikeimfive', 'changemyview', 'nostupidquestions'];
    
    const sub = subreddit.toLowerCase();
    
    if (techSubs.some(t => sub.includes(t))) return 'technology';
    if (newsSubs.some(n => sub.includes(n))) return 'news';
    if (entertainmentSubs.some(e => sub.includes(e))) return 'entertainment';
    if (discussionSubs.some(d => sub.includes(d))) return 'discussion';
    
    return 'general';
  }

  private inferSubredditCulture(subreddit: string): SubredditCulture {
    // Basic inference based on subreddit name and common patterns
    const sub = subreddit.toLowerCase();
    
    return {
      formalityLevel: this.inferFormalityLevel(sub),
      humorStyle: this.inferHumorStyle(sub),
      communityValues: this.inferCommunityValues(sub)
    };
  }

  private inferFormalityLevel(subreddit: string): 'casual' | 'semi-formal' | 'formal' {
    const formalSubs = ['science', 'askhistorians', 'law', 'medicine'];
    const casualSubs = ['memes', 'funny', 'gaming', 'relationship_advice'];
    
    if (formalSubs.some(f => subreddit.includes(f))) return 'formal';
    if (casualSubs.some(c => subreddit.includes(c))) return 'casual';
    return 'semi-formal';
  }

  private inferHumorStyle(subreddit: string): 'witty' | 'memes' | 'dry' | 'supportive' {
    if (subreddit.includes('meme')) return 'memes';
    if (subreddit.includes('funny') || subreddit.includes('joke')) return 'witty';
    if (subreddit.includes('science') || subreddit.includes('academic')) return 'dry';
    return 'supportive';
  }

  private inferCommunityValues(subreddit: string): string[] {
    const values: string[] = [];
    
    if (subreddit.includes('help') || subreddit.includes('support')) {
      values.push('helpfulness', 'empathy');
    }
    if (subreddit.includes('learn') || subreddit.includes('education')) {
      values.push('knowledge-sharing', 'patience');
    }
    if (subreddit.includes('discuss') || subreddit.includes('debate')) {
      values.push('open-mindedness', 'critical-thinking');
    }
    
    return values.length > 0 ? values : ['respect', 'community'];
  }

  private getCurrentUserInput(): string {
    // Try to find any text the user might have already entered
    const textareas = Array.from(document.querySelectorAll('textarea, [contenteditable="true"]'));
    
    for (const textarea of textareas) {
      const text = (textarea as HTMLTextAreaElement).value || textarea.textContent;
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
    
    return '';
  }

  /**
   * Test method that exactly matches your working JavaScript code
   * This ensures we get the same results as the proven implementation
   */
  testExtractThread(): any {
    const commentElToObj = (el: Element, depth: number, maxdepth: number) => {
      if (depth === maxdepth) { return null; }
      
      const author = el.querySelector(`[noun="comment_author"]`)?.textContent?.trim() ?? "";
      const comment = el.querySelector(`[slot="comment"]`)?.textContent?.trim() ?? "";
      const upvotes = el.querySelector("shreddit-comment-action-row")?.shadowRoot
        ?.querySelector(`[slot="vote-button"]`)?.textContent?.trim()
        .split(" ")
        .filter((x: string) => x)
        .map(Number)
        .filter((x: number) => !isNaN(x))
        .pop() ?? 0;
      
      const res = { author, comment, upvotes };
      const tree = genCommentTree(el, depth + 1, maxdepth);
      if (tree.length) {
        (res as any).tree = tree;
      }
      return res;
    };

    const genCommentTree = (parent: Element | Document = document, depth: number = 0, maxdepth: number = 5) => {
      const elems = Array.from(parent.querySelectorAll(`shreddit-comment[depth='${depth}']`));
      return elems.map(el => commentElToObj(el, depth, maxdepth)).filter(comment => comment !== null);
    };

    return {
      postTitle: document.querySelector("h1[slot=title]")?.textContent?.trim(),
      author: document.querySelector("span[slot=authorName]")?.textContent?.trim(),
      body: document.querySelector('div[property="schema:articleBody"]')?.textContent?.trim(),
      comments: genCommentTree()
    };
  }
}