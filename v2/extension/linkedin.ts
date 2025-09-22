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

		// Extract all LinkedIn posts on the page
		const allPosts = this.extractAllPosts();
		allPosts.forEach(postData => {
			const post = this.convertToPost(postData);
			if (post) {
				page.posts.push(post);
			}
		});

		// Detect active post (where reply form is visible)
		const activePostData = this.findActivePost();
		if (activePostData) {
			const activePost = this.convertToPost(activePostData);
			if (activePost) {
				page.activePost = activePost;
			}
		}

		return page;
	}

	insertReply(text: string): boolean {
		const editor = this.findCommentEditor();
		if (!editor) {
			console.warn("LinkedIn comment editor not found");
			return false;
		}

		try {
			editor.focus();

			const selection = window.getSelection();
			if (!selection) {
				console.warn("Could not get window selection.");
				return false;
			}

			// Position cursor and select all content
			const range = document.createRange();
			range.selectNodeContents(editor);
			range.collapse(true);
			selection.removeAllRanges();
			selection.addRange(range);

			// Select all content
			document.execCommand("selectAll", false, undefined);

			// Prepare HTML content for multi-line
			const lines = text.split("\n");
			const htmlContent = lines.map((line) => `<p>${line || "<br>"}</p>`).join("");

			// Insert the HTML
			const success = document.execCommand("insertHTML", false, htmlContent);
			if (!success) {
				console.error("Failed to insert HTML using execCommand");
				return false;
			}

			return true;
		} catch (error) {
			console.error("Failed to insert reply on LinkedIn:", error);
			return false;
		}
	}

	private findCommentEditor(): HTMLElement | null {
		// Look for visible comment editor
		const editors = document.querySelectorAll('div[data-test-ql-editor-contenteditable="true"]');
		for (const editor of Array.from(editors)) {
			if (editor instanceof HTMLElement && this.isElementVisible(editor)) {
				return editor;
			}
		}
		return null;
	}

	private isElementVisible(element: HTMLElement): boolean {
		const rect = element.getBoundingClientRect();
		const style = window.getComputedStyle(element);
		return (
			rect.width > 0 &&
			rect.height > 0 &&
			style.visibility !== 'hidden' &&
			style.display !== 'none'
		);
	}

	private extractAllPosts(): LinkedInPostData[] {
		// Find all post elements on the page
		const postElements = Array.from(document.querySelectorAll('[role="article"]'));
		const posts: LinkedInPostData[] = [];

		for (const postElement of postElements) {
			const postData = this.extractPostFromElement(postElement as HTMLElement);
			if (postData) {
				posts.push(postData);
			}
		}

		return posts;
	}

	private findActivePost(): LinkedInPostData | null {
		// Find the post that has an active comment box
		const commentEditor = this.findCommentEditor();
		if (!commentEditor) {
			return null;
		}

		// Find the closest article element to this comment editor
		const articleElement = commentEditor.closest('[role="article"]') as HTMLElement;
		if (!articleElement) {
			return null;
		}

		return this.extractPostFromElement(articleElement);
	}

	private extractPostFromElement(postElement: HTMLElement): LinkedInPostData | null {
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

