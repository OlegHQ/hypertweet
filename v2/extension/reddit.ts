import { Scraper } from "./base";
import { Page, Post, User } from "./models";

interface RedditComment {
	author: string;
	comment: string;
	upvotes: number;
	tree?: RedditComment[];
}

interface RedditPostData {
	postTitle: string;
	author: string;
	body: string;
	comments: RedditComment[];
	url: string;
	subreddit: string;
}

export class RedditScraper extends Scraper {
	private maxDepth = 5;

	async readPage(): Promise<Page> {
		const page = new Page();
		page.baseHost = "reddit.com";
		page.url = window.location.href;
		page.posts = [];

		// Extract Reddit post data
		const postData = this.extractPost();
		if (postData) {
			const post = this.convertToPost(postData);
			if (post) {
				page.posts.push(post);

				// Add comments as replies
				if (postData.comments.length > 0) {
					post.replies = postData.comments.map(comment => this.convertCommentToPost(comment));
				}
			}
		}

		return page;
	}

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

	private extractPost(): RedditPostData | null {
		console.log('[Reddit Scraper] Extracting post data...');
		try {
			const titleEl = document.querySelector("h1[slot=title]");
			const authorEl = document.querySelector("span[slot=authorName]");
			const bodyEl = document.querySelector('div[property="schema:articleBody"]');
			
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
			
			// Extract comments
			const comments = this.genCommentTree(document, 0, this.maxDepth);
			
			const result = {
				postTitle,
				author,
				body,
				comments,
				url: window.location.href,
				subreddit: subreddit || ''
			};
			
			return result;
		} catch (error) {
			console.error("[Reddit Scraper] Error extracting Reddit post:", error);
			return null;
		}
	}

	private convertToPost(postData: RedditPostData): Post | null {
		if (!postData || !postData.postTitle) {
			return null;
		}

		const user = new User();
		user.name = postData.author;
		user.userName = postData.author;

		const post = new Post();
		post.author = user;
		post.text = postData.body || postData.postTitle;
		post.url = postData.url;

		return post;
	}

	private convertCommentToPost(comment: RedditComment): Post {
		const user = new User();
		user.name = comment.author;
		user.userName = comment.author;

		const post = new Post();
		post.author = user;
		post.text = comment.comment;
		post.upvotes = comment.upvotes;
		post.isTopLevel = true;

		// Convert nested comments to replies
		if (comment.tree && comment.tree.length > 0) {
			post.replies = comment.tree.map(nestedComment => this.convertCommentToPost(nestedComment));
		}

		return post;
	}
}

