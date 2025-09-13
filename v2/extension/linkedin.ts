import { Scraper } from "./base";
import { Page, Post, User } from "./models";

interface LinkedInPostData {
	authorName: string;
	authorUsername: string;
	postText: string;
	currentReply?: string | null;
}

export class LinkedInScraper extends Scraper {
	async readPage(): Promise<Page> {
		const page = new Page();
		page.baseHost = "linkedin.com";
		page.url = window.location.href;
		page.posts = [];

		// Extract LinkedIn post data
		const postData = this.extractPost();
		if (postData) {
			const post = this.convertToPost(postData);
			if (post) {
				page.posts.push(post);
			}
		}

		return page;
	}

	private extractPost(): LinkedInPostData | null {
		// Find the post element - LinkedIn posts are typically in article tags
		const postElement = document.querySelector('[role="article"]') as HTMLElement;
		if (!postElement) {
			return null;
		}

		// Extract post text
		const textEl = postElement.querySelector('.update-components-text');
		const postText = textEl?.textContent?.trim() || "";

		// Extract author info
		const authorEl = postElement.querySelector('.update-components-actor__title span[aria-hidden="true"]');
		const authorName = authorEl?.textContent?.trim() || "";

		// Check for existing reply text
		const commentBox = postElement.querySelector('div[data-test-ql-editor-contenteditable="true"]') as HTMLElement;
		const currentReply = commentBox?.innerText?.trim() || null;

		return {
			authorName,
			authorUsername: authorName, // LinkedIn doesn't have separate usernames
			postText,
			currentReply,
		};
	}

	private convertToPost(postData: LinkedInPostData): Post | null {
		if (!postData || !postData.postText) {
			return null;
		}

		const user = new User();
		user.name = postData.authorName;
		user.userName = postData.authorUsername;

		const post = new Post();
		post.author = user;
		post.text = postData.postText;

		return post;
	}
}

