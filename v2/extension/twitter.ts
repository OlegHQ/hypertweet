import { Scraper } from "./base";
import { Page, Post, User } from "./models";

interface TweetData {
	profileName?: string;
	isVerified: boolean;
	text?: string;
	time?: string;
	statusID?: string;
	username?: string;
}

export class TwitterScraper extends Scraper {
	async readPage(): Promise<Page> {
		const page = new Page();
		page.baseHost = "x.com";
		page.url = window.location.href;
		page.posts = [];

		// Extract tweets from current page
		const jsonThread = this.extractTweetsFromPage();
		
		if (jsonThread.status) {
			// Add main tweet
			const mainPost = this.convertToPost(jsonThread.status);
			if (mainPost) {
				page.posts.push(mainPost);
			}

			// Add reply tweets
			if (jsonThread.replies) {
				const replyPosts = jsonThread.replies
					.map(reply => this.convertToPost(reply))
					.filter(post => post !== null) as Post[];
				
				if (mainPost && replyPosts.length > 0) {
					mainPost.replies = replyPosts;
				} else {
					page.posts.push(...replyPosts);
				}
			}
		}

		// Detect active post (where reply form is visible)
		const replyForm = document.querySelector('[data-testid="tweetTextarea_0"]');
		if (replyForm && page.posts && page.posts.length > 0) {
			page.activePost = page.posts[0]; // First post is typically the one being replied to
		}

		return page;
	}

	insertReply(text: string): boolean {
		const editor = document.querySelector(
			'div[contenteditable="true"][data-testid="tweetTextarea_0"]'
		) as HTMLElement;
		
		if (!editor) {
			console.warn("Twitter reply editor not found");
			return false;
		}

		try {
			editor.focus();
			const sel = window.getSelection();
			const range = document.createRange();
			range.selectNodeContents(editor);
			range.collapse(true);
			sel?.removeAllRanges();
			sel?.addRange(range);

			document.execCommand("selectAll", false, undefined);
			document.execCommand("insertText", false, text);
			
			return true;
		} catch (error) {
			console.error("Failed to insert reply on Twitter:", error);
			return false;
		}
	}

	private extractTweetsFromPage(): {
		status: TweetData | null;
		replies: TweetData[];
		currentResponse?: string;
	} {
		function getTweet(tweet: HTMLElement): TweetData {
			const name = tweet.querySelector("[data-testid=User-Name] a");
			const isVerified = !!name?.querySelector("[data-testid=icon-verified]");
			const profileName = name?.textContent;
			const username = name?.getAttribute("href")?.split("/").pop();
			const tweetText = tweet.querySelector(
				"[data-testid=tweetText]"
			)?.textContent;
			const time = tweet.querySelector("time")?.getAttribute("datetime");
			const url =
				(
					tweet.querySelector(
						`a[href*="/status/"]`
					) as HTMLAnchorElement | null
				)?.href ?? "";
			const statusID = url?.split("/").pop();

			return {
				profileName: profileName ?? undefined,
				isVerified: isVerified,
				text: tweetText ?? undefined,
				time: time ?? undefined,
				statusID: statusID ?? undefined,
				username: username ? "@" + username : undefined,
			};
		}

		const [first, ...replies] = Array.from(
			document.querySelectorAll("[data-testid=tweet]")
		) as HTMLElement[];

		const responseContainer = document.querySelector(
			`[data-testid="tweetTextarea_0"]`
		)?.parentElement?.children;

		const replyLines: string[] = [];
		if (responseContainer) {
			for (let i = 0; i < responseContainer.length; i++) {
				const reply = responseContainer.item(i);
				if (reply?.textContent?.trim() === "") {
					continue;
				}
				replyLines.push(reply?.textContent?.trim() ?? "");
			}
		}

		return {
			status: first ? getTweet(first) : null,
			replies: replies.map(getTweet),
			currentResponse: replyLines.length ? replyLines.join("\n") : undefined,
		};
	}

	private convertToPost(tweetData: TweetData): Post | null {
		if (!tweetData || !tweetData.text) {
			return null;
		}

		const user = new User();
		user.name = tweetData.profileName;
		user.userName = tweetData.username;
		user.isVerified = tweetData.isVerified;

		const post = new Post();
		post.author = user;
		post.text = tweetData.text || "";
		post.time = tweetData.time;
		post.statusID = tweetData.statusID;
		
		return post;
	}
}

